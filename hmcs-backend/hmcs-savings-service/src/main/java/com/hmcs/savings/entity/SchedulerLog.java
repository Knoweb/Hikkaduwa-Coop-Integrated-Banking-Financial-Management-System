package com.hmcs.savings.entity;

import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Entity
@Table(name = "scheduler_logs", schema = "account_service")
public class SchedulerLog {

    @TenantId
    private Integer tenantId;

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(nullable = false)
    private String taskName;

    @Column(nullable = false)
    private LocalDateTime executionTime;

    @Column(nullable = false)
    private String status;

    @Column(length = 500)
    private String details;
}
