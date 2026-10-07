package com.tidbits.repository;

import com.tidbits.model.entity.AccountHolding;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AccountHoldingRepository extends JpaRepository<AccountHolding, Integer> {
    List<AccountHolding> findByAccountId(Integer accountId);
    Optional<AccountHolding> findByAccountIdAndInstrumentId(Integer accountId, Integer instrumentId);
}
