package com.hmcs.savings.controller.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class NotificationDTO {
    private String id;
    private String title;
    private String message;
    private String type; // e.g., "FD_MATURITY"
    private LocalDateTime timestamp;
    private boolean isRead;
}
