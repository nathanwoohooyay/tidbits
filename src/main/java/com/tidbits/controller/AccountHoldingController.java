package com.tidbits.controller;

import com.tidbits.model.entity.AccountHolding;
import com.tidbits.service.AccountHoldingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/account-holdings")
public class AccountHoldingController {

    @Autowired
    private AccountHoldingService accountHoldingService;

    @PostMapping
    public ResponseEntity<AccountHolding> createAccountHolding(@RequestBody AccountHolding accountHolding) {
        return ResponseEntity.ok(null);
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountHolding> getAccountHoldingById(@PathVariable Integer id) {
        return ResponseEntity.ok(null);
    }

    @GetMapping
    public ResponseEntity<List<AccountHolding>> getAllAccountHoldings() {
        return ResponseEntity.ok(List.of());
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountHolding> updateAccountHolding(@PathVariable Integer id, @RequestBody AccountHolding accountHolding) {
        return ResponseEntity.ok(null);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccountHolding(@PathVariable Integer id) {
        return ResponseEntity.noContent().build();
    }
}
