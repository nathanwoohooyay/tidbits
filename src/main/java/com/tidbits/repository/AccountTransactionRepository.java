package com.tidbits.repository;

import com.tidbits.model.entity.AccountTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AccountTransactionRepository extends JpaRepository<AccountTransaction, Integer> {
    List<AccountTransaction> findByAccountId(Integer accountId);
    List<AccountTransaction> findByOrderId(Integer orderId);
}
