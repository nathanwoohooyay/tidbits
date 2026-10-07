package com.tidbits.model.dto;

import java.time.LocalDateTime;

public class TransactionFilterDTO {
    private Integer accountId;
    private LocalDateTime startDate;
    private LocalDateTime endDate;
    private String transactionType;
    private Integer pageNumber;
    private Integer pageSize;

    public TransactionFilterDTO() {
    }

    public TransactionFilterDTO(Integer accountId, LocalDateTime startDate, LocalDateTime endDate,
                               String transactionType, Integer pageNumber, Integer pageSize) {
        this.accountId = accountId;
        this.startDate = startDate;
        this.endDate = endDate;
        this.transactionType = transactionType;
        this.pageNumber = pageNumber;
        this.pageSize = pageSize;
    }

    public Integer getAccountId() {
        return accountId;
    }

    public void setAccountId(Integer accountId) {
        this.accountId = accountId;
    }

    public LocalDateTime getStartDate() {
        return startDate;
    }

    public void setStartDate(LocalDateTime startDate) {
        this.startDate = startDate;
    }

    public LocalDateTime getEndDate() {
        return endDate;
    }

    public void setEndDate(LocalDateTime endDate) {
        this.endDate = endDate;
    }

    public String getTransactionType() {
        return transactionType;
    }

    public void setTransactionType(String transactionType) {
        this.transactionType = transactionType;
    }

    public Integer getPageNumber() {
        return pageNumber;
    }

    public void setPageNumber(Integer pageNumber) {
        this.pageNumber = pageNumber;
    }

    public Integer getPageSize() {
        return pageSize;
    }

    public void setPageSize(Integer pageSize) {
        this.pageSize = pageSize;
    }
}
