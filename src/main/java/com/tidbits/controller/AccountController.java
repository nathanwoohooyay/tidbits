package com.tidbits.controller;

import com.tidbits.model.entity.Account;
import com.tidbits.model.entity.AccountHolding;
import com.tidbits.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @PostMapping
    public ResponseEntity<Account> createAccount(@RequestBody Account account) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Account> getAccountById(@PathVariable Integer id) {
        return ResponseEntity.ok(null);
    }

    @GetMapping
    public ResponseEntity<List<Account>> getAllAccounts() {
        return ResponseEntity.ok(List.of());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Account> updateAccount(@PathVariable Integer id, @RequestBody Account account) {
        return ResponseEntity.ok(null);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<Account> partiallyUpdateAccount(@PathVariable Integer id, @RequestBody Account account) {
        return ResponseEntity.ok(null);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Integer id) {
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{accountId}/holdings")
    public ResponseEntity<List<AccountHolding>> getAllAccountHoldings(@PathVariable Integer accountId) {
        return ResponseEntity.ok(List.of());
    }
}
