package com.tidbits.mapper;

import com.tidbits.model.dto.UserDTO;
import com.tidbits.model.dto.UserCreateRequestDTO;
import com.tidbits.model.dto.UserUpdateDTO;
import com.tidbits.model.entity.User;

public final class UserMapper {

    private UserMapper() {
    }

    public static UserDTO toUserDTO(User user) {
        if (user == null) {
            return null;
        }

        return new UserDTO(
                user.getUserId(),
                user.getUsername(),
                user.getEmail(),
                user.getPhoneNumber(),
                user.getRewardPoints()
        );
    }

    public static User toCreateEntity(UserCreateRequestDTO request) {
        if (request == null) {
            return null;
        }

        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        user.setPasswordHash(request.getPassword());
        return user;
    }

    public static User toUpdateEntity(UserUpdateDTO request) {
        if (request == null) {
            return null;
        }

        User user = new User();
        user.setEmail(request.getEmail());
        user.setPhoneNumber(request.getPhoneNumber());
        return user;
    }
}



