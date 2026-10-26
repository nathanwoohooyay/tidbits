package com.tidbits.controller;

import com.tidbits.model.dto.WatchlistAddRequestDTO;
import com.tidbits.model.dto.WatchlistItemDTO;
import com.tidbits.service.WatchlistService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/watchlist")
public class WatchlistController {

    @Autowired
    private WatchlistService watchlistService;

    @GetMapping
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<List<WatchlistItemDTO>> getWatchlist(@PathVariable Integer userId) {
        return ResponseEntity.ok(watchlistService.getWatchlist(userId));
    }

    @PostMapping
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<WatchlistItemDTO> addToWatchlist(@PathVariable Integer userId, @RequestBody WatchlistAddRequestDTO request) {
        return new ResponseEntity<>(watchlistService.addToWatchlist(userId, request.ticker()), HttpStatus.CREATED);
    }

    @DeleteMapping("/{ticker}")
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public ResponseEntity<Void> removeFromWatchlist(@PathVariable Integer userId, @PathVariable String ticker) {
        watchlistService.removeFromWatchlist(userId, ticker);
        return ResponseEntity.noContent().build();
    }
}
