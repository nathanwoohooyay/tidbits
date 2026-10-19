package com.tidbits.service;

import com.tidbits.model.entity.PortfolioSnapshot;
import com.tidbits.exception.BadRequestException;
import com.tidbits.model.entity.Account;
import com.tidbits.repository.AccountRepository;
import com.tidbits.repository.PortfolioSnapshotRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class PortfolioSnapshotService {

    private final PortfolioSnapshotRepository portfolioSnapshotRepository;
    private final AccountRepository accountRepository;

    @Autowired
    public PortfolioSnapshotService(
            PortfolioSnapshotRepository portfolioSnapshotRepository,
            AccountRepository accountRepository
    ) {
        this.portfolioSnapshotRepository = portfolioSnapshotRepository;
        this.accountRepository = accountRepository;
    }

    public List<PortfolioSnapshot> getSnapshotsByUserId(Long userId) {
        return portfolioSnapshotRepository.findByUserId(userId);
    }

    public List<PortfolioSnapshot> getSnapshotsByAccountId(Long accountId) {
        Integer normalizedAccountId;
        try {
            normalizedAccountId = Math.toIntExact(accountId);
        } catch (ArithmeticException ex) {
            throw new BadRequestException("Account id is invalid.");
        }

        Optional<Account> account = accountRepository.findById(normalizedAccountId);
        if (account.isPresent() && !getAuthenticatedUserId().equals(account.get().getUserId())) {
            throw new AccessDeniedException("User does not own account " + accountId + ".");
        }

        return portfolioSnapshotRepository.findByAccountId(accountId);
    }

    public PortfolioSnapshot saveSnapshot(PortfolioSnapshot snapshot) {
        return portfolioSnapshotRepository.save(snapshot);
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