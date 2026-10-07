package com.tidbits.service;

import com.tidbits.exception.BusinessException;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.model.entity.Account;
import com.tidbits.repository.AccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
public class AccountService {

    @Autowired
    private AccountRepository accountRepository;

    public Account createAccount(String nickname, int userId) {

        String jwtUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        if (Integer.parseInt(jwtUserId) != userId) {
            throw new AccessDeniedException("User ID is required to create an account.");
        }

        Account account = new Account();
        account.setAccountId(null);
        account.setUserId(userId);
        account.setNickname(nickname);
        account.setCashBalance(0.0);
        account.setCreatedAt(LocalDateTime.now());

        return accountRepository.save(account);
    }

    public Optional<Account> getAccountById(Integer accountId) {
        return accountRepository.findById(accountId);
    }

    public Account getAccountByIdForUser(Integer userId, Integer accountId) {
        return accountRepository.findById(accountId)
                .filter(account -> account.getUserId().equals(userId))
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Account " + accountId + " not found for user " + userId + "."));
    }

    public List<Account> getAccountsByUserId(Integer userId) {
        return accountRepository.findByUserId(userId);
    }

    public Account updateAccount(Integer userId, Integer accountId, String nickname) {
        String jwtUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        if (Integer.parseInt(jwtUserId) != userId) {
            throw new AccessDeniedException("User ID is required to create an account.");
        }

        Account existingAccount = getAccountByIdForUser(userId, accountId);
        existingAccount.setNickname(nickname.trim());

        return accountRepository.save(existingAccount);
    }


    public void deleteAccount(Integer userId, Integer accountId) {

        String jwtUserId = SecurityContextHolder.getContext().getAuthentication().getName();

        if (Integer.parseInt(jwtUserId) != userId) {
            throw new AccessDeniedException("Unauthorized access.");
        }

        Optional<Account> existingAccount = getAccountById(accountId);

        if (existingAccount.isPresent() && !existingAccount.get().getUserId().equals(userId)) {
            throw new AccessDeniedException("Unauthorized access.");
        }
        accountRepository.deleteById(accountId);
    }
}
