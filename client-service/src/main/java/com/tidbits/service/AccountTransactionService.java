package com.tidbits.service;

import com.tidbits.model.entity.AccountTransaction;
import com.tidbits.repository.AccountTransactionRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AccountTransactionService {

    @Autowired
    private AccountTransactionRepository accountTransactionRepository;

    public AccountTransaction createAccountTransaction(AccountTransaction accountTransaction) {
        return null;
    }

    public Optional<AccountTransaction> getAccountTransactionById(Integer transactionId) {
        return Optional.empty();
    }

    public List<AccountTransaction> getTransactionsByAccountId(Integer accountId) {
        return List.of();
    }

    public List<AccountTransaction> getTransactionsByOrderId(Integer orderId) {
        return List.of();
    }

    public List<AccountTransaction> getAllAccountTransactions() {
        return List.of();
    }

    public AccountTransaction updateAccountTransaction(Integer transactionId, AccountTransaction accountTransaction) {
        return null;
    }

    public void deleteAccountTransaction(Integer transactionId) {
    }
}
