package com.hmcs.pawning.controller;

import com.hmcs.pawning.entity.PawningSetting;
import com.hmcs.pawning.service.PawningSettingService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/v1/pawning/settings")
public class PawningSettingController {

    @Autowired
    private PawningSettingService settingService;

    @GetMapping
    public ResponseEntity<List<PawningSetting>> getAllSettings() {
        return ResponseEntity.ok(settingService.getAllSettings());
    }

    @GetMapping("/{key}")
    public ResponseEntity<PawningSetting> getSetting(@PathVariable String key) {
        PawningSetting setting = settingService.getSetting(key);
        if (setting != null) {
            return ResponseEntity.ok(setting);
        }
        return ResponseEntity.notFound().build();
    }

    @PutMapping("/{key}")
    public ResponseEntity<PawningSetting> updateSetting(
            @PathVariable String key,
            @RequestBody Map<String, String> payload) {
        
        String value = payload.get("settingValue");
        String description = payload.get("description");
        
        if (value == null) {
            return ResponseEntity.badRequest().build();
        }
        
        PawningSetting updated = settingService.updateSetting(key, value, description);
        return ResponseEntity.ok(updated);
    }
}
