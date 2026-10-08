package com.tidbits.audit.model.dto;

public class AdminDashboardDTO {
    private long totalUsers;
    private long totalAccounts;
    private long totalUserLogs;
    private long totalTransactionLogs;

    public AdminDashboardDTO() {}

    public AdminDashboardDTO(long totalUsers, long totalAccounts,
                             long totalUserLogs, long totalTransactionLogs) {
        this.totalUsers = totalUsers;
        this.totalAccounts = totalAccounts;
        this.totalUserLogs = totalUserLogs;
        this.totalTransactionLogs = totalTransactionLogs;
    }

    public long getTotalUsers() { return totalUsers; }
    public void setTotalUsers(long totalUsers) { this.totalUsers = totalUsers; }
    public long getTotalAccounts() { return totalAccounts; }
    public void setTotalAccounts(long totalAccounts) { this.totalAccounts = totalAccounts; }
    public long getTotalUserLogs() { return totalUserLogs; }
    public void setTotalUserLogs(long totalUserLogs) { this.totalUserLogs = totalUserLogs; }
    public long getTotalTransactionLogs() { return totalTransactionLogs; }
    public void setTotalTransactionLogs(long totalTransactionLogs) { this.totalTransactionLogs = totalTransactionLogs; }
}
