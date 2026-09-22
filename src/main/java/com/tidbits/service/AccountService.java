package com.tidbits.service;

import com.tidbits.model.entity.Account;
import com.tidbits.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    public Account createAccount(Account account) {
        return null;
    }

    public Optional<Account> getAccountById(Integer accountId) {
        return Optional.empty();
    }

    public List<Account> getAccountsByUserId(Integer userId) {
        return List.of();
    }

    public List<Account> getAllAccounts() {
        return List.of();
    }

    public Account updateAccount(Integer accountId, Account account) {
        return null;
    }

    public void deleteAccount(Integer accountId) {
    }
}
