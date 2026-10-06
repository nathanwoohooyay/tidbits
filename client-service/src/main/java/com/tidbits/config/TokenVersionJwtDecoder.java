package com.tidbits.config;

import com.tidbits.model.entity.User;
import com.tidbits.repository.UserRepository;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

public class TokenVersionJwtDecoder implements JwtDecoder {

    private final JwtDecoder delegate;
    private final UserRepository userRepository;

    public TokenVersionJwtDecoder(JwtDecoder delegate, UserRepository userRepository) {
        this.delegate = delegate;
        this.userRepository = userRepository;
    }

    @Override
    public Jwt decode(String token) {
        Jwt jwt = delegate.decode(token);
        Integer userId = parseInteger(jwt.getSubject(), "subject");
        Integer tokenVersion = parseInteger(jwt.getClaim("tokenVersion"), "tokenVersion");

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new BadJwtException("JWT subject no longer maps to an active user"));

        Integer persistedTokenVersion = user.getTokenVersion() == null ? 0 : user.getTokenVersion();
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