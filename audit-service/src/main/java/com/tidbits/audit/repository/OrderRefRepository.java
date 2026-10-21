package com.tidbits.audit.repository;

import com.tidbits.audit.model.entity.OrderRef;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface OrderRefRepository extends JpaRepository<OrderRef, Integer> {
}
