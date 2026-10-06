package com.tidbits.audit.config;

import com.tidbits.audit.model.entity.UserRoleRef;
import com.tidbits.audit.repository.UserRoleRefRepository;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

public class TokenVersionJwtDecoder implements JwtDecoder {

    private final JwtDecoder delegate;
    private final UserRoleRefRepository userRoleRefRepository;

    public TokenVersionJwtDecoder(JwtDecoder delegate, UserRoleRefRepository userRoleRefRepository) {
        this.delegate = delegate;
        this.userRoleRefRepository = userRoleRefRepository;
    }

    @Override
    public Jwt decode(String token) {
        Jwt jwt = delegate.decode(token);
        Integer userId = parseInteger(jwt.getSubject(), "subject");
        Integer tokenVersion = parseInteger(jwt.getClaim("tokenVersion"), "tokenVersion");

        UserRoleRef userRef = userRoleRefRepository.findById(userId)
                .orElseThrow(() -> new BadJwtException("JWT subject no longer maps to an active user"));

        Integer persistedTokenVersion = userRef.getTokenVersion() == null ? 0 : userRef.getTokenVersion();
        if (!persistedTokenVersion.equals(tokenVersion)) {
            throw new BadJwtException("JWT tokenVersion no longer matches the stored user token version");
        }

        return jwt;
    }

    private Integer parseInteger(Object value, String claimName) {
        if (value instanceof Integer integerValue) {
            return integerValue;
        }

        if (value instanceof Number numberValue) {
            return numberValue.intValue();
        }

        if (value instanceof String stringValue) {
            try {
                return Integer.valueOf(stringValue);
            } catch (NumberFormatException ex) {
                throw new BadJwtException("JWT " + claimName + " claim is not a valid integer");
            }
        }

        throw new BadJwtException("JWT " + claimName + " claim is missing or invalid");
    }
}