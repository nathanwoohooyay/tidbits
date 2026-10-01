package com.tidbits.controller;

import com.tidbits.mapper.AccountTransactionMapper;
import com.tidbits.model.dto.AccountTransactionDTO;
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
        return ResponseEntity.ok(null);
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<AccountTransactionDTO>> getAccountTransactions(@PathVariable Integer accountId) {
        return ResponseEntity.ok(List.of());
    }

    // @PostMapping("/account/{accountId}/transactions")
    // public ResponseEntity<AccountTransactionDTO> createAccountTransactionForAccount(@RequestBody AccountTransaction accountTransaction) {
    //     return ResponseEntity.ok(null);
    // }
}
