package com.tidbits.controller;

import com.tidbits.model.dto.AccountTransactionDTO;
import com.tidbits.model.entity.AccountTransaction;
import com.tidbits.service.AccountTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts/{accountId}/transactions")
public class AccountTransactionController {

    @Autowired
    private AccountTransactionService accountTransactionService;

    @PostMapping("/")
    public ResponseEntity<AccountTransactionDTO> createAccountTransaction(@RequestBody AccountTransaction accountTransaction, @PathVariable Integer accountId) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/{transactionId}")
    public ResponseEntity<AccountTransactionDTO> getAccountTransactionById(@PathVariable Integer transactionId, @PathVariable Integer accountId) {
        return ResponseEntity.ok(null);
    }

    @GetMapping
    public ResponseEntity<List<AccountTransactionDTO>> getAccountTransactions(@PathVariable Integer accountId) {
        return ResponseEntity.ok(List.of());
    }

    // @PostMapping("/account/{accountId}/transactions")
    // public ResponseEntity<AccountTransactionDTO> createAccountTransactionForAccount(@RequestBody AccountTransaction accountTransaction) {
    //     return ResponseEntity.ok(null);
    // }
}
