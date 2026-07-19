package com.hmcs.pawning.entity;

import java.io.Serializable;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class PawningSettingId implements Serializable {
    private Integer tenantId;
    private String settingKey;
}
