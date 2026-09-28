package com.tidbits.service;

import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.entity.Account;
import com.tidbits.repository.AccountRepository;
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
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertSame;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountServiceTest {

    @Mock
    private AccountRepository accountRepository;

    @InjectMocks
    private AccountService accountService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void createAccount_savesAccountWhenJwtUserMatchesRequestedUser() {
        setAuthenticatedUser("42");
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Account created = accountService.createAccount("My Wallet", 42);

        assertEquals(42, created.getUserId());
        assertEquals("My Wallet", created.getNickname());
        assertEquals(0.0, created.getCashBalance());
        assertNull(created.getAccountId());
        assertNotNull(created.getCreatedAt());
        verify(accountRepository).save(any(Account.class));
    }

    @Test
    void createAccount_throwsAccessDeniedWhenJwtUserDiffers() {
        setAuthenticatedUser("7");

        AccessDeniedException ex = assertThrows(
                AccessDeniedException.class,
                () -> accountService.createAccount("My Wallet", 42)
        );

        assertEquals("User ID is required to create an account.", ex.getMessage());
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    void createAccount_throwsNumberFormatExceptionWhenJwtNameIsNotNumeric() {
        setAuthenticatedUser("not-a-number");

        assertThrows(NumberFormatException.class, () -> accountService.createAccount("My Wallet", 42));
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    void getAccountById_returnsRepositoryResult() {
        Account account = account(11, 42, "Emergency", 1000.0);
        when(accountRepository.findById(11)).thenReturn(Optional.of(account));

        Optional<Account> result = accountService.getAccountById(11);

        assertEquals(Optional.of(account), result);
        verify(accountRepository).findById(11);
    }

    @Test
    void getAccountByIdForUser_returnsAccountForOwner() {
        Account account = account(11, 42, "Emergency", 1000.0);
        when(accountRepository.findById(11)).thenReturn(Optional.of(account));

        Account result = accountService.getAccountByIdForUser(42, 11);

        assertSame(account, result);
    }

    @Test
    void getAccountByIdForUser_throwsWhenAccountMissing() {
        when(accountRepository.findById(11)).thenReturn(Optional.empty());

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> accountService.getAccountByIdForUser(42, 11)
        );

        assertEquals("Account 11 not found for user 42.", ex.getMessage());
    }

    @Test
    void getAccountByIdForUser_throwsWhenAccountBelongsToDifferentUser() {
        Account account = account(11, 99, "Other", 300.0);
        when(accountRepository.findById(11)).thenReturn(Optional.of(account));

        ResourceNotFoundException ex = assertThrows(
                ResourceNotFoundException.class,
                () -> accountService.getAccountByIdForUser(42, 11)
        );

        assertEquals("Account 11 not found for user 42.", ex.getMessage());
    }

    @Test
    void getAccountsByUserId_returnsAllAccountsForUser() {
        List<Account> accounts = List.of(
                account(1, 42, "Main", 100.0),
                account(2, 42, "Savings", 500.0)
        );
        when(accountRepository.findByUserId(42)).thenReturn(accounts);

        List<Account> result = accountService.getAccountsByUserId(42);

        assertEquals(2, result.size());
        assertEquals(accounts, result);
    }

    @Test
    void updateAccount_updatesNicknameAfterTrimWhenAuthorized() {
        setAuthenticatedUser("42");
        Account account = account(10, 42, "Old", 200.0);
        when(accountRepository.findById(10)).thenReturn(Optional.of(account));
        when(accountRepository.save(any(Account.class))).thenAnswer(invocation -> invocation.getArgument(0));

        Account updated = accountService.updateAccount(42, 10, "  New Name  ");

        assertEquals("New Name", updated.getNickname());
        verify(accountRepository).save(account);
    }

    @Test
    void updateAccount_throwsAccessDeniedWhenJwtUserDiffers() {
        setAuthenticatedUser("7");

        AccessDeniedException ex = assertThrows(
                AccessDeniedException.class,
                () -> accountService.updateAccount(42, 10, "Name")
        );

        assertEquals("User ID is required to create an account.", ex.getMessage());
        verify(accountRepository, never()).findById(any());
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    void updateAccount_throwsWhenAccountNotOwnedByUser() {
        setAuthenticatedUser("42");
        Account account = account(10, 99, "Other", 200.0);
        when(accountRepository.findById(10)).thenReturn(Optional.of(account));

        assertThrows(ResourceNotFoundException.class, () -> accountService.updateAccount(42, 10, "Name"));
        verify(accountRepository, never()).save(any(Account.class));
    }

    @Test
    void deleteAccount_deletesWhenAuthorizedAndOwned() {
        setAuthenticatedUser("42");
        Account account = account(10, 42, "Main", 200.0);
        when(accountRepository.findById(10)).thenReturn(Optional.of(account));

        accountService.deleteAccount(42, 10);

        verify(accountRepository).deleteById(10);
    }

    @Test
    void deleteAccount_throwsAccessDeniedWhenJwtUserDiffers() {
        setAuthenticatedUser("7");

        AccessDeniedException ex = assertThrows(
                AccessDeniedException.class,
                () -> accountService.deleteAccount(42, 10)
        );

        assertEquals("Unauthorized access.", ex.getMessage());
        verify(accountRepository, never()).findById(any());
        verify(accountRepository, never()).deleteById(any());
    }

    @Test
    void deleteAccount_throwsAccessDeniedWhenAccountBelongsToDifferentUser() {
        setAuthenticatedUser("42");
        Account account = account(10, 99, "Other", 200.0);
        when(accountRepository.findById(10)).thenReturn(Optional.of(account));

        AccessDeniedException ex = assertThrows(
                AccessDeniedException.class,
                () -> accountService.deleteAccount(42, 10)
        );

        assertEquals("Unauthorized access.", ex.getMessage());
        verify(accountRepository, never()).deleteById(any());
    }

    @Test
    void deleteAccount_stillDeletesWhenAccountDoesNotExist() {
        setAuthenticatedUser("42");
        when(accountRepository.findById(10)).thenReturn(Optional.empty());

        accountService.deleteAccount(42, 10);

        verify(accountRepository).deleteById(10);
    }

    private void setAuthenticatedUser(String userId) {
        SecurityContextHolder.getContext().setAuthentication(
                new UsernamePasswordAuthenticationToken(userId, null)
        );
    }

    private Account account(Integer accountId, Integer userId, String nickname, Double balance) {
        return new Account(accountId, userId, nickname, balance, LocalDateTime.now());
    }

}


