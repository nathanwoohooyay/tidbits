package com.tidbits.service;
import com.tidbits.exception.BusinessException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.entity.Account;
import com.tidbits.model.entity.AccountTransaction;
import com.tidbits.model.enums.TransactionType;
import java.time.LocalDateTime;
import java.math.BigDecimal;
import java.math.RoundingMode;
import com.tidbits.repository.AccountTransactionRepository;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Optional;

@Service
public class AccountTransactionService {

    @Autowired
    private AccountService accountService;

    @Autowired
    private AccountTransactionRepository accountTransactionRepository;

    @Transactional
    public AccountTransaction depositCash(Integer accountId, Double amount) {
        double flooredAmount = floorToTwoDecimals(amount);
        if (flooredAmount <= 0) {
            throw new BusinessException("Deposit amount must be greater than zero");
        }
        Account account = getAuthorizedAccount(accountId);
        double updatedBalance = floorToTwoDecimals(account.getCashBalance() + flooredAmount);
        account.setCashBalance(updatedBalance);
        AccountTransaction accountTransaction = new AccountTransaction(null, accountId, null, flooredAmount, TransactionType.DEPOSIT, LocalDateTime.now());
        return accountTransactionRepository.save(accountTransaction);
    }

    @Transactional
    public AccountTransaction withdrawCash(Integer accountId, Double amount) {
        double flooredAmount = floorToTwoDecimals(amount);
        if (flooredAmount <= 0) {
            throw new BusinessException("Withdrawal amount must be greater than zero");
        }
        Account account = getAuthorizedAccount(accountId);
        if (account.getCashBalance() < flooredAmount) {
            throw new BusinessException("Insufficient balance.");
        }
        double updatedBalance = floorToTwoDecimals(account.getCashBalance() - flooredAmount);
        account.setCashBalance(updatedBalance);
        AccountTransaction accountTransaction = new AccountTransaction(null, accountId, null, flooredAmount, TransactionType.WITHDRAW, LocalDateTime.now());
        return accountTransactionRepository.save(accountTransaction);
    }

    private double floorToTwoDecimals(Double value) {
        if (value == null) {
            throw new BusinessException("Amount is required");
        }
        return BigDecimal.valueOf(value).setScale(2, RoundingMode.FLOOR).doubleValue();
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
