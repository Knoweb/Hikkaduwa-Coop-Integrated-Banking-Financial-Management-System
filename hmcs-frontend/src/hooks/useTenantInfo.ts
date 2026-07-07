import { useState, useEffect } from 'react';

export function useTenantInfo() {
  const [societyNameSi, setSocietyNameSi] = useState('හික්කඩුව විවිධ සේවා සමුපකාර සමිතිය');
  const [branchNameSi, setBranchNameSi] = useState('ප්‍රධාන ශාඛාව');

  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        const user = JSON.parse(userStr);
        
        if (user.organizationName) {
          setSocietyNameSi(user.organizationName);
        } else if (user.tenantId === 2) {
          setSocietyNameSi('බෝපෙ-පෝද්දල විවිධ සේවා සමුපකාර සමිතිය');
        } else if (user.tenantId === 9) {
          setSocietyNameSi('බද්දේගම විවිධ සේවා සමුපකාර සමිතිය');
        }

        if (user.branchName) {
          setBranchNameSi(user.branchName);
        } else if (user.branchId === 1) {
          setBranchNameSi('හික්කඩුව ශාඛාව');
        } else if (user.branchId === 2) {
          setBranchNameSi('දොඩන්දූව ශාඛාව');
        } else if (user.branchId === 3) {
          setBranchNameSi('බද්දේගම ශාඛාව');
        } else if (user.branchId) {
          setBranchNameSi(`ශාඛාව ${user.branchId}`);
        }
      }
    } catch (e) {
      console.error('Error in useTenantInfo', e);
    }
  }, []);

  return { societyNameSi, branchNameSi };
}
