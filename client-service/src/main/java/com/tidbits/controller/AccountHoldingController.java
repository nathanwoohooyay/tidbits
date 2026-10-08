package com.tidbits.controller;

import com.tidbits.model.dto.AccountHoldingDTO;
import com.tidbits.mapper.AccountHoldingMapper;
import com.tidbits.service.AccountHoldingService;
import com.tidbits.exception.ResourceNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/accounts/{accountId}/holdings")
public class AccountHoldingController {

    @Autowired
    private AccountHoldingService accountHoldingService;

    @GetMapping("/{holdingId}")
    public ResponseEntity<AccountHoldingDTO> getAccountHoldingById(@PathVariable Integer holdingId, @PathVariable Integer accountId) {
        return ResponseEntity.ok(AccountHoldingMapper.toDto(accountHoldingService.getAccountHoldingById(holdingId)
                .orElseThrow(() -> new ResourceNotFoundException("Holding " + holdingId + " not found for account " + accountId + "."))));
    }
    
    @GetMapping("/")
    public ResponseEntity<List<AccountHoldingDTO>> getAllAccountHoldings(@PathVariable Integer accountId) {
        return ResponseEntity.ok(accountHoldingService.getAllAccountHoldingsByAccountId(accountId)
                .stream()
                .map(AccountHoldingMapper::toDto)
                .toList());
    }
}
