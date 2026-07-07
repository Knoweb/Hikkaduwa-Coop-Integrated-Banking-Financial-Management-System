import { useState, useEffect } from 'react';

export function getTenantInfo() {
  let societyNameSi = 'හික්කඩුව විවිධ සේවා සමුපකාර සමිතිය';
  let branchNameSi = 'ප්‍රධාන ශාඛාව';
  let societyNameEn = 'Hikkaduwa MPCS';
  let branchNameEn = 'Main Branch';

  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      
      if (user.organizationName) {
        societyNameSi = user.organizationName;
        societyNameEn = user.organizationName;
      } else if (user.tenantId === 2) {
        societyNameSi = 'බෝපෙ-පෝද්දල විවිධ සේවා සමුපකාර සමිතිය';
        societyNameEn = 'Bope-Poddala MPCS';
      } else if (user.tenantId === 9) {
        societyNameSi = 'බද්දේගම විවිධ සේවා සමුපකාර සමිතිය';
        societyNameEn = 'Baddegama MPCS';
      }

      if (user.branchName) {
        branchNameSi = user.branchName;
        branchNameEn = user.branchName;
      } else if (user.branchId === 1) {
        branchNameSi = 'හික්කඩුව ශාඛාව';
        branchNameEn = 'Hikkaduwa Branch';
      } else if (user.branchId === 2) {
        branchNameSi = 'දොඩන්දූව ශාඛාව';
        branchNameEn = 'Dodanduwa Branch';
      } else if (user.branchId === 3) {
        branchNameSi = 'බද්දේගම ශාඛාව';
        branchNameEn = 'Baddegama Branch';
      } else if (user.branchId) {
        branchNameSi = `ශාඛාව ${user.branchId}`;
        branchNameEn = `Branch ${user.branchId}`;
      }
    }
  } catch (e) {
    console.error('Error in getTenantInfo', e);
  }

  return { societyNameSi, branchNameSi, societyNameEn, branchNameEn };
}

export function useTenantInfo() {
  const [societyNameSi, setSocietyNameSi] = useState('හික්කඩුව විවිධ සේවා සමුපකාර සමිතිය');
  const [branchNameSi, setBranchNameSi] = useState('ප්‍රධාන ශාඛාව');
  const [societyNameEn, setSocietyNameEn] = useState('Hikkaduwa MPCS');
  const [branchNameEn, setBranchNameEn] = useState('Main Branch');

  useEffect(() => {
    const { societyNameSi: sName, branchNameSi: bName, societyNameEn: sNameEn, branchNameEn: bNameEn } = getTenantInfo();
    setSocietyNameSi(sName);
    setBranchNameSi(bName);
    setSocietyNameEn(sNameEn);
    setBranchNameEn(bNameEn);
  }, []);

  return { societyNameSi, branchNameSi, societyNameEn, branchNameEn };
}
