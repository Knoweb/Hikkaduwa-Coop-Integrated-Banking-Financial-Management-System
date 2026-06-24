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
        return repository.findById(key).orElse(null);
    }

    public PawningSetting updateSetting(String key, String value, String description) {
        PawningSetting setting = repository.findById(key).orElse(new PawningSetting());
        setting.setSettingKey(key);
        setting.setSettingValue(value);
        if (description != null) {
            setting.setDescription(description);
        }
        return repository.save(setting);
    }
}
