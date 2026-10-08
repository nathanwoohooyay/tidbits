package com.tidbits.controller;

import com.tidbits.mapper.AccountTransactionMapper;
import com.tidbits.model.dto.AccountTransactionDTO;
import com.tidbits.model.entity.AccountTransaction;
import com.tidbits.exception.ResourceNotFoundException;
import com.tidbits.service.AccountTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts/{accountId}")
public class AccountTransactionController {

    @Autowired
    private AccountTransactionService accountTransactionService;

    @PostMapping("/deposit")
    public ResponseEntity<AccountTransactionDTO> depositTransaction(@PathVariable Integer accountId, @RequestBody Double amount) {
        return ResponseEntity.ok(AccountTransactionMapper.toDto(accountTransactionService.depositCash(accountId, amount)));
    }

    @PostMapping("/withdraw")
    public ResponseEntity<AccountTransactionDTO> withdrawTransaction(@PathVariable Integer accountId, @RequestBody Double amount) {
        return ResponseEntity.ok(AccountTransactionMapper.toDto(accountTransactionService.withdrawCash(accountId, amount)));
    }

    @GetMapping("/transactions/{transactionId}")
    public ResponseEntity<AccountTransactionDTO> getAccountTransactionById(@PathVariable Integer transactionId, @PathVariable Integer accountId) {
        AccountTransaction transaction = accountTransactionService.getAccountTransactionById(transactionId)
                .orElseThrow(() -> new ResourceNotFoundException("Transaction " + transactionId + " not found."));

        if (!accountId.equals(transaction.getAccountId())) {
            throw new ResourceNotFoundException("Transaction " + transactionId + " not found for account " + accountId + ".");
        }

        return ResponseEntity.ok(AccountTransactionMapper.toDto(transaction));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<AccountTransactionDTO>> getAccountTransactions(@PathVariable Integer accountId) {
        return ResponseEntity.ok(accountTransactionService.getAllTransactionsByAccountId(accountId)
                .stream()
                .map(AccountTransactionMapper::toDto)
                .toList());
    }
}
