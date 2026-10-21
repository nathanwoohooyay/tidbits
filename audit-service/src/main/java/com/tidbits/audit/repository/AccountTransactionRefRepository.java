package com.tidbits.audit.repository;

import com.tidbits.audit.model.entity.AccountTransactionRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface AccountTransactionRefRepository extends JpaRepository<AccountTransactionRef, Integer> {
    Optional<AccountTransactionRef> findFirstByOrderIdOrderByTransactionIdDesc(Integer orderId);
}
