package com.yourteam.communicationservice.dto;


import lombok.Data;
import java.time.LocalDateTime;

@Data
public class UserDto {
    private String userId;
    private String name;
    private String email;
    private String role; // On peut le garder en String pour simplifier
    private String phone;
    private String profilePicture;
}
