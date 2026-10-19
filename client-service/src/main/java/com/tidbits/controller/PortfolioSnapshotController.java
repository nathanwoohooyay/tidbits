package com.tidbits.controller;

import com.tidbits.model.entity.PortfolioSnapshot;
import com.tidbits.service.PortfolioSnapshotService;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.access.prepost.PreAuthorize;
import java.util.List;

@RestController
@RequestMapping("/api/portfolio-snapshots")
public class PortfolioSnapshotController {

    private final PortfolioSnapshotService portfolioSnapshotService;

    public PortfolioSnapshotController(PortfolioSnapshotService portfolioSnapshotService) {
        this.portfolioSnapshotService = portfolioSnapshotService;
    }

    @GetMapping("/users/{userId}")
    @PreAuthorize("#userId.toString().equals(authentication.name)")
    public List<PortfolioSnapshot> getSnapshotsByUserId(@PathVariable Long userId) {
        return portfolioSnapshotService.getSnapshotsByUserId(userId);
    }

    @GetMapping("/accounts/{accountId}")
    public List<PortfolioSnapshot> getSnapshotsByAccountId(@PathVariable Long accountId) {
        return portfolioSnapshotService.getSnapshotsByAccountId(accountId);
    }

}