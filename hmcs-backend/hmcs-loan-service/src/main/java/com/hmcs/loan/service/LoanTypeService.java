package com.hmcs.loan.service;

import com.hmcs.loan.entity.LoanType;
import com.hmcs.loan.repository.LoanTypeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
public class LoanTypeService {

    @Autowired
    private LoanTypeRepository loanTypeRepository;

    public List<LoanType> getAllActiveLoanTypes() {
        return loanTypeRepository.findByIsActiveTrue();
    }

    public List<LoanType> getAllLoanTypes() {
        return loanTypeRepository.findAll();
    }

    public Optional<LoanType> getLoanTypeById(UUID id) {
        return loanTypeRepository.findById(id);
    }

    public LoanType createLoanType(LoanType loanType) {
        return loanTypeRepository.save(loanType);
    }

    public LoanType updateLoanType(UUID id, LoanType updatedLoanType) {
        return loanTypeRepository.findById(id).map(loanType -> {
            loanType.setName(updatedLoanType.getName());
            loanType.setDescription(updatedLoanType.getDescription());
            loanType.setMaxAmount(updatedLoanType.getMaxAmount());
            loanType.setMaxTermMonths(updatedLoanType.getMaxTermMonths());
            loanType.setInterestRate(updatedLoanType.getInterestRate());
            loanType.setEligibilityCriteria(updatedLoanType.getEligibilityCriteria());
            loanType.setIsActive(updatedLoanType.getIsActive());
            return loanTypeRepository.save(loanType);
        }).orElseThrow(() -> new RuntimeException("LoanType not found with id " + id));
    }

    public void deleteLoanType(UUID id) {
        loanTypeRepository.deleteById(id);
    }
}
