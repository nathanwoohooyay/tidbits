package com.tidbits.controller;

import com.tidbits.model.dto.AccountHoldingDTO;
import com.tidbits.service.AccountHoldingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts/{accountId}/holdings")
public class AccountHoldingController {

    @Autowired
    private AccountHoldingService accountHoldingService;

    // @PostMapping
    // public ResponseEntity<AccountHoldingDTO> createAccountHolding(@RequestBody AccountHolding accountHolding) {
    //     return ResponseEntity.ok(null);
    // }

    @GetMapping("/{holdingId}")
    public ResponseEntity<AccountHoldingDTO> getAccountHoldingById(@PathVariable Integer holdingId) {
        return ResponseEntity.ok(null);
    }
    
    @GetMapping("/")
    public ResponseEntity<List<AccountHoldingDTO>> getAllAccountHoldings(@PathVariable Integer accountId) {
        return ResponseEntity.ok(List.of());
    }
}
