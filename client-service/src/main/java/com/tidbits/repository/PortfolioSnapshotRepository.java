package com.tidbits.repository;

import com.tidbits.model.entity.PortfolioSnapshot;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.util.List;
import org.springframework.stereotype.Repository;

@Repository
public interface PortfolioSnapshotRepository extends JpaRepository<PortfolioSnapshot, Long> {
    List<PortfolioSnapshot> findByAccountId(Long accountId);
    @Query(value = "SELECT ps.* FROM portfolio_snapshots ps JOIN accounts a ON ps.account_id = a.account_id WHERE a.user_id = :userId", nativeQuery = true)
    List<PortfolioSnapshot> findByUserId(@Param("userId") Long userId);
}