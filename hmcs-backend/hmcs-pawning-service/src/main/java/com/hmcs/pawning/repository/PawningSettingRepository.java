package com.hmcs.pawning.repository;

import com.hmcs.pawning.entity.PawningSetting;
import com.hmcs.pawning.entity.PawningSettingId;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PawningSettingRepository extends JpaRepository<PawningSetting, PawningSettingId> {
}
