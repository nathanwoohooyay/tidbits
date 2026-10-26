package com.tidbits.repository;

import com.tidbits.model.entity.WatchlistItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface WatchlistItemRepository extends JpaRepository<WatchlistItem, Integer> {
    List<WatchlistItem> findByUserIdOrderByCreatedAtAsc(Integer userId);

    Optional<WatchlistItem> findByUserIdAndTicker(Integer userId, String ticker);

    long countByUserId(Integer userId);
}
