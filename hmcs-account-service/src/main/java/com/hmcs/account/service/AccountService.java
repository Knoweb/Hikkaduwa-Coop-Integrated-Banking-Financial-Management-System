package com.hmcs.account.service;

import com.hmcs.account.dto.MemberRegistrationRequest;
import com.hmcs.account.dto.SavingsAccountRequest;
import com.hmcs.account.entity.Member;
import com.hmcs.account.entity.SavingsAccount;
import com.hmcs.account.repository.MemberRepository;
import com.hmcs.account.repository.SavingsAccountRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;

@Service
public class AccountService {

    @Autowired
    private MemberRepository memberRepository;

    @Autowired
    private SavingsAccountRepository savingsAccountRepository;

    @Transactional
    public Member registerMember(MemberRegistrationRequest request, Long branchId) {
        if (memberRepository.findByNic(request.getNic()).isPresent()) {
            throw new RuntimeException("Member with NIC " + request.getNic() + " already exists.");
        }

        Member member = new Member();
        member.setFullName(request.getFullName());
        member.setNic(request.getNic());
        member.setAddress(request.getAddress());
        member.setContactNumber(request.getContactNumber());
        member.setDateOfBirth(request.getDateOfBirth());
        // Enforce branch isolation
        member.setBranchId(branchId);

        return memberRepository.save(member);
    }

    @Transactional
    public SavingsAccount openSavingsAccount(SavingsAccountRequest request, Long branchId) {
        Member member = memberRepository.findById(request.getMemberId())
                .orElseThrow(() -> new RuntimeException("Member not found"));

        // Verify member belongs to the same branch
        if (!member.getBranchId().equals(branchId)) {
            throw new RuntimeException("Cannot open account for member of a different branch.");
        }

        SavingsAccount account = new SavingsAccount();
        account.setMember(member);
        account.setBranchId(branchId);
        account.setAccountType(request.getAccountType());
        account.setBalance(request.getInitialDeposit());
        
        // Generate a random account number (mock implementation)
        account.setAccountNumber("SA-" + branchId + "-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());

        return savingsAccountRepository.save(account);
    }

    public List<Member> getMembersByBranch(Long branchId) {
        return memberRepository.findByBranchId(branchId);
    }
    
    public List<SavingsAccount> getAccountsByBranch(Long branchId) {
        return savingsAccountRepository.findByBranchId(branchId);
    }
}
