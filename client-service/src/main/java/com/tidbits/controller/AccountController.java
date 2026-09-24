package com.tidbits.controller;

import com.tidbits.model.dto.AccountDTO;
import com.tidbits.model.dto.AccountHoldingDTO;
import com.tidbits.model.entity.Account;
import com.tidbits.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.tidbits.mapper.AccountMapper;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/accounts")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @PostMapping
    public ResponseEntity<AccountDTO> createAccount(@PathVariable Integer userId, @RequestBody Account account) {
        return ResponseEntity.ok(AccountMapper.toDto(accountService.createAccount(account)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AccountDTO> getAccountById(@PathVariable Integer userId, @PathVariable Integer id) {
        return ResponseEntity.ok(AccountMapper.toDto(accountService.getAccountById(id).orElse(null)));
    }

    @GetMapping
    public ResponseEntity<List<AccountDTO>> getAllAccounts(@PathVariable Integer userId) {
        return ResponseEntity.ok(AccountMapper.toDtoList(accountService.getAccountsByUserId(userId)));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AccountDTO> updateAccount(@PathVariable Integer userId, @PathVariable Integer id, @RequestBody Account account) {
        return ResponseEntity.ok(null);
    }

    @PatchMapping("/{id}")
    public ResponseEntity<AccountDTO> partiallyUpdateAccount(@PathVariable Integer userId, @PathVariable Integer id, @RequestBody Account account) {
        return ResponseEntity.ok(null);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteAccount(@PathVariable Integer userId, @PathVariable Integer id) {
        return ResponseEntity.noContent().build();
    }

}
