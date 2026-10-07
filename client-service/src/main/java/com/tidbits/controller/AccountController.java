package com.tidbits.controller;

import com.tidbits.exception.BadRequestException;
import com.tidbits.exception.BusinessException;
import com.tidbits.mapper.AccountMapper;
import com.tidbits.model.dto.AccountCreateRequestDTO;
import com.tidbits.model.dto.AccountDTO;
import com.tidbits.model.entity.Account;
import com.tidbits.service.AccountService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/accounts")
public class AccountController {

    @Autowired
    private AccountService accountService;

    @PostMapping
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<AccountDTO> createAccount(@AuthenticationPrincipal Jwt jwt, @PathVariable Integer userId, @RequestBody String nickname) {
        if (nickname.isBlank()) {
            throw new BadRequestException("Account nickname is required.");
        }

        AccountDTO accountDTO = AccountMapper.toDto(accountService.createAccount(nickname, userId));

        return new ResponseEntity<>(accountDTO, HttpStatus.CREATED);
    }

    @GetMapping("/{id}")
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<AccountDTO> getAccountById(@PathVariable Integer userId, @PathVariable Integer id) {
        return ResponseEntity.ok(AccountMapper.toDto(accountService.getAccountByIdForUser(userId, id)));
    }

    @GetMapping
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<List<AccountDTO>> getAllAccountsByUser(@PathVariable Integer userId) {
        return ResponseEntity.ok(AccountMapper.toDtoList(accountService.getAccountsByUserId(userId)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<AccountDTO> updateAccount(@PathVariable Integer userId, @PathVariable Integer id, @RequestBody String nickname) {
        if (nickname.isBlank()) {
            throw new BadRequestException("New account nickname is required.");
        }

        AccountMapper.toDto(accountService.updateAccount(userId, id, nickname));

        return ResponseEntity.accepted().build();
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<Void> deleteAccount(@PathVariable Integer userId, @PathVariable Integer id) {
        accountService.deleteAccount(userId, id);
        return ResponseEntity.noContent().build();
    }

}
