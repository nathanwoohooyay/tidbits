package com.tidbits.service;
import com.tidbits.exception.BusinessException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.entity.Account;
import com.tidbits.model.entity.AccountTransaction;
import com.tidbits.model.enums.NotificationCategory;
import com.tidbits.model.enums.TransactionType;
import com.tidbits.repository.AccountTransactionRepository;
import com.tidbits.repository.OrderRepository;
import com.tidbits.util.Money;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
public class AccountTransactionService {

    @Autowired
    private AccountService accountService;

    @Autowired
    private AccountTransactionRepository accountTransactionRepository;

    @Autowired
    private OrderEventPublisher orderEventPublisher;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private PortfolioSnapshotRecorder snapshotRecorder;

    @Transactional
    public AccountTransaction depositCash(Integer accountId, BigDecimal amount) {
        BigDecimal flooredAmount = floorToTwoDecimals(amount);
        if (flooredAmount.signum() <= 0) {
            throw new BusinessException("Deposit amount must be greater than zero");
        }
        Account account = getAuthorizedAccount(accountId);
        account.setCashBalance(Money.orZero(account.getCashBalance()).add(flooredAmount));
        AccountTransaction accountTransaction = new AccountTransaction(null, accountId, null, flooredAmount, TransactionType.DEPOSIT, LocalDateTime.now());
        AccountTransaction created = accountTransactionRepository.save(accountTransaction);

        orderEventPublisher.publishAccountTransactionEvent(
            "DEPOSIT",
            accountId,
            created.getTransactionId(),
            created.getAmount()
        );
        notifyCash(account, created, "Deposited " + formatMoney(flooredAmount), "To " + account.getNickname());
        snapshotRecorder.record(account);

        return created;
    }

    // Cash set aside for pending buy orders can't be withdrawn.
    @Transactional
    public AccountTransaction withdrawCash(Integer accountId, BigDecimal amount) {
        BigDecimal flooredAmount = floorToTwoDecimals(amount);
        if (flooredAmount.signum() <= 0) {
            throw new BusinessException("Withdrawal amount must be greater than zero");
        }
        Account account = getAuthorizedAccount(accountId);
        BigDecimal balance = Money.orZero(account.getCashBalance());
        if (balance.compareTo(flooredAmount) < 0) {
            throw new BusinessException("Insufficient balance.");
        }
        BigDecimal reserved = Money.orZero(orderRepository.sumReservedCash(accountId, 0));
        if (balance.subtract(reserved).compareTo(flooredAmount) < 0) {
            throw new BusinessException("Insufficient balance: " + formatMoney(reserved)
                    + " is set aside for open orders. Cancel them to withdraw it.");
        }
        account.setCashBalance(balance.subtract(flooredAmount));
        AccountTransaction accountTransaction = new AccountTransaction(null, accountId, null, flooredAmount, TransactionType.WITHDRAW, LocalDateTime.now());
        AccountTransaction created = accountTransactionRepository.save(accountTransaction);

        orderEventPublisher.publishAccountTransactionEvent(
            "WITHDRAW",
            accountId,
            created.getTransactionId(),
            created.getAmount()
        );
        notifyCash(account, created, "Withdrew " + formatMoney(flooredAmount), "From " + account.getNickname());
        snapshotRecorder.record(account);

        return created;
    }

    private void notifyCash(Account account, AccountTransaction transaction, String title, String message) {
        notificationService.notify(account.getUserId(), NotificationCategory.CASH, title, message,
                NotificationService.Source.transaction(account.getAccountId(), transaction.getTransactionId()));
    }

    private static String formatMoney(BigDecimal value) {
        return NumberFormat.getCurrencyInstance(Locale.US).format(value);
    }

    private BigDecimal floorToTwoDecimals(BigDecimal value) {
        if (value == null) {
            throw new BusinessException("Amount is required");
        }
        return Money.floorCents(value);
    }

    public AccountTransaction createAccountTransaction(AccountTransaction accountTransaction) {
        return accountTransactionRepository.save(accountTransaction);
    }

    public Optional<AccountTransaction> getAccountTransactionById(Integer transactionId) {
        return accountTransactionRepository.findById(transactionId);
    }

    public List<AccountTransaction> getAllTransactionsByAccountId(Integer accountId) {
        return accountTransactionRepository.findAllByAccountId(accountId);
    }

    public AccountTransaction updateAccountTransaction(Integer transactionId, AccountTransaction accountTransaction) {
        return accountTransactionRepository.save(accountTransaction);
    }

    private Account getAuthorizedAccount(Integer accountId) {
        Account account = accountService.getAccountById(accountId)
                .orElseThrow(() -> new ResourceNotFoundException("Account " + accountId + " not found."));

        Integer authenticatedUserId = getAuthenticatedUserId();
        if (!authenticatedUserId.equals(account.getUserId())) {
            throw new AccessDeniedException("Authenticated user does not own account " + accountId + ".");
        }

        return account;
    }

    private Integer getAuthenticatedUserId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null || authentication.getName().isBlank()) {
            throw new AccessDeniedException("Authenticated user id is required.");
        }

        try {
            return Integer.valueOf(authentication.getName());
        } catch (NumberFormatException ex) {
            throw new AccessDeniedException("Authenticated user id is invalid.");
        }
    }
}
