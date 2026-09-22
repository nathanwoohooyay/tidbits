package com.tidbits.controller;

import com.tidbits.model.entity.AccountTransaction;
import com.tidbits.service.AccountTransactionService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account-transactions")
public class AccountTransactionController {

    @Autowired
    private AccountTransactionService accountTransactionService;

    @PostMapping
    public ResponseEntity<AccountTransaction> createAccountTransaction(@RequestBody AccountTransaction accountTransaction) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountTransaction> getAccountTransactionById(@PathVariable Integer id) {
        return ResponseEntity.ok(null);
    }

    @GetMapping
    public ResponseEntity<List<AccountTransaction>> getAllAccountTransactions() {
        return ResponseEntity.ok(List.of());
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountTransaction> updateAccountTransaction(@PathVariable Integer id, @RequestBody AccountTransaction accountTransaction) {
        return ResponseEntity.ok(null);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccountTransaction(@PathVariable Integer id) {
        return ResponseEntity.noContent().build();
    }
}
