package com.tidbits.service;

import com.tidbits.exception.BusinessException;
import com.tidbits.model.entity.Account;
import com.tidbits.model.entity.AccountTransaction;
import com.tidbits.model.enums.NotificationCategory;
import com.tidbits.model.enums.TransactionType;
import com.tidbits.repository.AccountTransactionRepository;
import com.tidbits.repository.OrderRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccountTransactionServiceTest {

    @Mock
    private AccountService accountService;

    @Mock
    private AccountTransactionRepository accountTransactionRepository;

    @Mock
    private OrderEventPublisher orderEventPublisher;

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private NotificationService notificationService;

    @Mock
    private PortfolioSnapshotRecorder snapshotRecorder;

    @InjectMocks
    private AccountTransactionService accountTransactionService;

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void depositCash_throwsWhenAmountIsNull() {
        setAuthenticatedUser("42");

        BusinessException ex = assertThrows(BusinessException.class, () -> accountTransactionService.depositCash(10, null));

        assertEquals("Amount is required", ex.getMessage());
    }

    @Test
    void depositCash_throwsWhenFlooredAmountIsZeroOrLess() {
        setAuthenticatedUser("42");

        BusinessException ex = assertThrows(BusinessException.class, () -> accountTransactionService.depositCash(10, bd("0.009")));

        assertEquals("Deposit amount must be greater than zero", ex.getMessage());
    }

    @Test
    void depositCash_updatesBalanceAndPublishesEvent() {
        setAuthenticatedUser("42");
        Account account = account(10, 42, bd("100.11"));
        when(accountService.getAccountById(10)).thenReturn(Optional.of(account));
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenReturn(
                new AccountTransaction(99, 10, null, bd("10.23"), TransactionType.DEPOSIT, LocalDateTime.now())
        );

        AccountTransaction created = accountTransactionService.depositCash(10, bd("10.239"));

        assertEquals(bd("10.23"), created.getAmount());
        assertEquals(bd("110.34"), account.getCashBalance());
        verify(orderEventPublisher).publishAccountTransactionEvent("DEPOSIT", 10, 99, bd("10.23"));
    }

    @Test
    void withdrawCash_throwsWhenInsufficientBalance() {
        setAuthenticatedUser("42");
        when(accountService.getAccountById(10)).thenReturn(Optional.of(account(10, 42, bd("10.0"))));

        BusinessException ex = assertThrows(BusinessException.class, () -> accountTransactionService.withdrawCash(10, bd("10.01")));

        assertEquals("Insufficient balance.", ex.getMessage());
    }

    @Test
    void withdrawCash_updatesBalanceAndPublishesEvent() {
        setAuthenticatedUser("42");
        Account account = account(10, 42, bd("10.99"));
        when(accountService.getAccountById(10)).thenReturn(Optional.of(account));
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenAnswer(invocation -> {
            AccountTransaction tx = invocation.getArgument(0);
            tx.setTransactionId(77);
            return tx;
        });

        AccountTransaction created = accountTransactionService.withdrawCash(10, bd("1.349"));

        assertEquals(bd("1.34"), created.getAmount());
        assertEquals(bd("9.65"), account.getCashBalance());
        verify(orderEventPublisher).publishAccountTransactionEvent("WITHDRAW", 10, 77, bd("1.34"));
    }

    @Test
    void depositCash_throwsAccessDeniedWhenAuthenticatedUserDoesNotOwnAccount() {
        setAuthenticatedUser("7");
        when(accountService.getAccountById(10)).thenReturn(Optional.of(account(10, 42, bd("100.0"))));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> accountTransactionService.depositCash(10, bd("1.0")));

        assertEquals("Authenticated user does not own account 10.", ex.getMessage());
    }

    @Test
    void depositCash_throwsAccessDeniedWhenAuthenticationNameIsInvalid() {
        setAuthenticatedUser("not-a-number");
        when(accountService.getAccountById(10)).thenReturn(Optional.of(account(10, 42, bd("100.0"))));

        AccessDeniedException ex = assertThrows(AccessDeniedException.class, () -> accountTransactionService.depositCash(10, bd("1.0")));

        assertEquals("Authenticated user id is invalid.", ex.getMessage());
    }

    @Test
    void withdrawCash_refusesCashSetAsideForOpenOrders() {
        setAuthenticatedUser("42");
        Account account = account(10, 42, bd("100.00"));
        when(accountService.getAccountById(10)).thenReturn(Optional.of(account));
        when(orderRepository.sumReservedCash(10, 0)).thenReturn(bd("80.00"));

        BusinessException ex = assertThrows(BusinessException.class, () -> accountTransactionService.withdrawCash(10, bd("30")));

        assertEquals("Insufficient balance: $80.00 is set aside for open orders. Cancel them to withdraw it.", ex.getMessage());
        assertEquals(bd("100.00"), account.getCashBalance());
        verify(accountTransactionRepository, never()).save(any());
    }

    @Test
    void withdrawCash_allowsCashNotSetAside() {
        setAuthenticatedUser("42");
        Account account = account(10, 42, bd("100.00"));
        when(accountService.getAccountById(10)).thenReturn(Optional.of(account));
        when(orderRepository.sumReservedCash(10, 0)).thenReturn(bd("80.00"));
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenAnswer(invocation -> invocation.getArgument(0));

        accountTransactionService.withdrawCash(10, bd("20"));

        assertEquals(bd("80.00"), account.getCashBalance());
    }

    @Test
    void depositCash_notifiesAndRecordsSnapshot() {
        setAuthenticatedUser("42");
        Account account = account(10, 42, bd("5.00"));
        account.setNickname("Main");
        when(accountService.getAccountById(10)).thenReturn(Optional.of(account));
        when(accountTransactionRepository.save(any(AccountTransaction.class))).thenAnswer(invocation -> {
            AccountTransaction tx = invocation.getArgument(0);
            tx.setTransactionId(5);
            return tx;
        });

        accountTransactionService.depositCash(10, bd("1500"));

        verify(notificationService).notify(eq(42), eq(NotificationCategory.CASH), eq("Deposited $1,500.00"), eq("To Main"),
                eq(NotificationService.Source.transaction(10, 5)));
        verify(snapshotRecorder).record(account);
    }

    private void setAuthenticatedUser(String userId) {
        SecurityContextHolder.getContext().setAuthentication(new UsernamePasswordAuthenticationToken(userId, null));
    }

    private Account account(Integer accountId, Integer userId, BigDecimal cashBalance) {
        return new Account(accountId, userId, "Primary", cashBalance, LocalDateTime.now());
    }

    private static BigDecimal bd(String value) {
        return new BigDecimal(value);
    }
}
