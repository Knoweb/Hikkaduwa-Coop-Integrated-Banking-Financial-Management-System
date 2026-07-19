package com.hmcs.pawning.service;

import com.hmcs.pawning.entity.PawningSetting;
import com.hmcs.pawning.repository.PawningSettingRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class PawningSettingService {

    @Autowired
    private PawningSettingRepository repository;

    public List<PawningSetting> getAllSettings() {
        return repository.findAll();
    }

    public PawningSetting getSetting(String key) {
        Integer tenantId = com.hmcs.pawning.multitenancy.TenantContext.getTenantId();
        if (tenantId == null) tenantId = 1;
        return repository.findById(new com.hmcs.pawning.entity.PawningSettingId(tenantId, key)).orElse(null);
    }

    public PawningSetting updateSetting(String key, String value, String description) {
        Integer tenantId = com.hmcs.pawning.multitenancy.TenantContext.getTenantId();
        if (tenantId == null) tenantId = 1;
        com.hmcs.pawning.entity.PawningSettingId id = new com.hmcs.pawning.entity.PawningSettingId(tenantId, key);
        
        PawningSetting setting = repository.findById(id).orElse(new PawningSetting());
        setting.setTenantId(tenantId);
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        if (description != null) {
            setting.setDescription(description);
        }
        return repository.save(setting);
    }
}
