package com.example.diem_danh.dto.request;

import lombok.Data;
import java.util.List;

@Data
public class CreateGroupRequest {
    private String name;
    private List<String> memberIds; // userIds
}