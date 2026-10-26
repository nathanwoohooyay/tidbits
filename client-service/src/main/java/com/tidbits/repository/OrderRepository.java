package com.tidbits.repository;

import com.tidbits.model.entity.Order;
import com.tidbits.model.enums.OrderStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, Integer> {
    List<Order> findByAccountId(Integer accountId);
    List<Order> findByStatus(OrderStatus status);
    long countByAccountIdAndStatus(Integer accountId, OrderStatus status);

    // Cash set aside by the account's pending buys, other than `excludeOrderId` (pass 0 to count them all).
    // Null when there are none.
    @Query("""
            SELECT SUM(o.reservedAmount) FROM Order o
            WHERE o.accountId = :accountId AND o.status = com.tidbits.model.enums.OrderStatus.PENDING
              AND o.orderType = com.tidbits.model.enums.OrderType.BUY AND o.orderId <> :excludeOrderId
            """)
    BigDecimal sumReservedCash(@Param("accountId") Integer accountId, @Param("excludeOrderId") Integer excludeOrderId);

    // Shares of one instrument already promised to the account's pending sells, other than `excludeOrderId`.
    // Null when there are none.
    @Query("""
            SELECT SUM(o.quantity) FROM Order o
            WHERE o.accountId = :accountId AND o.instrumentId = :instrumentId
              AND o.status = com.tidbits.model.enums.OrderStatus.PENDING
              AND o.orderType = com.tidbits.model.enums.OrderType.SELL AND o.orderId <> :excludeOrderId
            """)
    BigDecimal sumReservedShares(@Param("accountId") Integer accountId, @Param("instrumentId") Integer instrumentId,
                                 @Param("excludeOrderId") Integer excludeOrderId);
}
