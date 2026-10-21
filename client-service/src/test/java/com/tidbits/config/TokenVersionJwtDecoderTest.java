package com.tidbits.config;

import com.tidbits.model.entity.User;
import com.tidbits.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.oauth2.jwt.BadJwtException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class TokenVersionJwtDecoderTest {

    @Mock
    private JwtDecoder delegate;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private TokenVersionJwtDecoder tokenVersionJwtDecoder;

    @Test
    void decode_returnsJwtWhenTokenVersionMatchesPersistedUser() {
        Jwt jwt = jwt("15", 2);
        User user = new User();
        user.setUserId(15);
        user.setTokenVersion(2);

        when(delegate.decode("signed-token")).thenReturn(jwt);
        when(userRepository.findById(15)).thenReturn(Optional.of(user));

        Jwt decoded = tokenVersionJwtDecoder.decode("signed-token");

        assertSame(jwt, decoded);
        verify(userRepository).findById(15);
    }

    @Test
    void decode_throwsWhenTokenVersionDiffersFromPersistedUser() {
        Jwt jwt = jwt("15", 2);
        User user = new User();
        user.setUserId(15);
        user.setTokenVersion(3);

        when(delegate.decode("signed-token")).thenReturn(jwt);
        when(userRepository.findById(15)).thenReturn(Optional.of(user));

        assertThrows(BadJwtException.class, () -> tokenVersionJwtDecoder.decode("signed-token"));
    }

    @Test
    void decode_throwsWhenUserNoLongerExists() {
        Jwt jwt = jwt("15", 2);

        when(delegate.decode("signed-token")).thenReturn(jwt);
        when(userRepository.findById(15)).thenReturn(Optional.empty());

        assertThrows(BadJwtException.class, () -> tokenVersionJwtDecoder.decode("signed-token"));
    }

    private Jwt jwt(String subject, int tokenVersion) {
        return Jwt.withTokenValue("signed-token")
                .header("alg", "HS256")
                .claim("sub", subject)
                .claim("tokenVersion", tokenVersion)
                .build();
    }
}