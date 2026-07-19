package com.hmcs.pawning.entity;

import jakarta.persistence.Entity;
import jakarta.persistence.IdClass;
import org.hibernate.annotations.TenantId;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Entity
@Table(name = "pawning_settings")
@IdClass(PawningSettingId.class)
@Data
@NoArgsConstructor
@AllArgsConstructor
public class PawningSetting {
    @Id
    @TenantId
    private Integer tenantId;


    @Id
    private String settingKey;

    private String settingValue;

    private String description;
}
