package com.tidbits.controller;

import com.tidbits.model.dto.LotteryTicketRequestDTO;
import com.tidbits.model.dto.PointsTransactionDTO;
import com.tidbits.model.dto.RewardsSummaryDTO;
import com.tidbits.service.RewardsService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/users/{userId}/rewards")
@PreAuthorize("#userId.toString().equals(authentication.name)")
public class RewardsController {

    @Autowired
    private RewardsService rewardsService;

    @GetMapping
    public ResponseEntity<RewardsSummaryDTO> getSummary(@PathVariable Integer userId) {
        return ResponseEntity.ok(rewardsService.getSummary(userId));
    }

    @GetMapping("/transactions")
    public ResponseEntity<List<PointsTransactionDTO>> getTransactions(@PathVariable Integer userId) {
        return ResponseEntity.ok(rewardsService.getHistory(userId));
    }

    @PostMapping("/lottery/tickets")
    public ResponseEntity<PointsTransactionDTO> buyLotteryTickets(@PathVariable Integer userId, @RequestBody LotteryTicketRequestDTO request) {
        return ResponseEntity.ok(request == null
                ? rewardsService.buyLotteryTickets(userId, null, null)
                : rewardsService.buyLotteryTickets(userId, request.drawId(), request.quantity()));
    }

}
