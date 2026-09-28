package com.tidbits.mapper;
import com.tidbits.model.dto.AccountDTO;
import com.tidbits.model.entity.Account;
import java.util.List;
import java.util.stream.Collectors;
public class AccountMapper {

    public static AccountDTO toDto(Account account) {
        if (account == null) {
            return null;
        }
        AccountDTO dto = new AccountDTO();
        dto.setAccountId(account.getAccountId());
        dto.setUserId(account.getUserId());
        dto.setNickname(account.getNickname());
        dto.setCashBalance(account.getCashBalance());
        return dto;
    }

    public static List<AccountDTO> toDtoList(List<Account> accounts) {
        if (accounts == null) {
            return List.of();
        }
        return accounts.stream().map(AccountMapper::toDto).collect(Collectors.toList());
    }
}
