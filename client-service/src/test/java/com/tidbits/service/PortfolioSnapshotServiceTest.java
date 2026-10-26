package com.tidbits.service;

import java.math.BigDecimal;
import com.tidbits.exception.BadRequestException;
import com.tidbits.model.entity.Account;
import com.tidbits.repository.AccountRepository;
import com.tidbits.repository.PortfolioSnapshotRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class PortfolioSnapshotServiceTest {

    @Mock
    private PortfolioSnapshotRepository portfolioSnapshotRepository;

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private PortfolioSnapshotService portfolioSnapshotService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void getSnapshotsByAccountId_throwsForbiddenWhenAuthenticatedUserDoesNotOwnAccount() {
        setAuthenticatedUser("7");
        when(accountRepository.findById(42)).thenReturn(Optional.of(account(42, 99)));

        AccessDeniedException ex = assertThrows(
                AccessDeniedException.class,
                () -> portfolioSnapshotService.getSnapshotsByAccountId(42L)
        );

        assertEquals("Authenticated user does not own account 42.", ex.getMessage());
        verify(portfolioSnapshotRepository, never()).findByAccountId(42L);
    }

    @Test
    void getSnapshotsByAccountId_throwsBadRequestWhenAccountIdIsOutOfIntegerRange() {
        setAuthenticatedUser("7");

        BadRequestException ex = assertThrows(
                BadRequestException.class,
                () -> portfolioSnapshotService.getSnapshotsByAccountId(Long.MAX_VALUE)
        );

        assertEquals("Account id is invalid.", ex.getMessage());
        verify(accountRepository, never()).findById(org.mockito.ArgumentMatchers.anyInt());
        verify(portfolioSnapshotRepository, never()).findByAccountId(Long.MAX_VALUE);
    }

    @Test
    void getSnapshotsByAccountId_returnsSnapshotsWhenAccountOwnedByAuthenticatedUser() {
        setAuthenticatedUser("7");
        when(accountRepository.findById(42)).thenReturn(Optional.of(account(42, 7)));
        when(portfolioSnapshotRepository.findByAccountId(42L)).thenReturn(List.of());

        List<?> snapshots = portfolioSnapshotService.getSnapshotsByAccountId(42L);

        assertEquals(0, snapshots.size());
        verify(portfolioSnapshotRepository).findByAccountId(42L);
    }

    private void setAuthenticatedUser(String userId) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, null));
    }

    private Account account(Integer accountId, Integer userId) {
        return new Account(accountId, userId, "Primary", new BigDecimal("100.0"), LocalDateTime.now());
    }
}
