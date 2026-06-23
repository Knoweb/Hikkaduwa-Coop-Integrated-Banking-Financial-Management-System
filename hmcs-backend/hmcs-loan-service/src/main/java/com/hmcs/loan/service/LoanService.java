package com.hmcs.loan.service;

import com.hmcs.loan.entity.*;
import com.hmcs.loan.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Service
public class LoanService {

    public static final List<String> WORKFLOW_STAGES = List.of(
        "STAGE_1_MANAGER_APPROVAL",
        "STAGE_2_LOAN_COMMITTEE_APPROVAL",
        "STAGE_3_APPROVED"
    );

    @Autowired private LoanRepository loanRepository;
    @Autowired private LoanTypeRepository loanTypeRepository;
    @Autowired private LoanApprovalActionRepository approvalActionRepository;
    @Autowired private LedgerEntryRepository ledgerEntryRepository;
    @Autowired private RestTemplate restTemplate;
    @Autowired private LoanApplicantDetailRepository applicantDetailRepository;
    @Autowired private LoanAssetDetailRepository assetDetailRepository;
    @Autowired private LoanGuarantorRepository guarantorRepository;
    @Autowired private LoanFamilyMemberRepository familyMemberRepository;

    // ── Helpers ────────────────────────────────────────────────────────────────
    private String str(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return v != null ? v.toString() : null;
    }

    private BigDecimal bd(Map<String, Object> m, String key) {
        Object v = m.get(key);
        if (v == null || v.toString().isBlank()) return null;
        try { return new BigDecimal(v.toString()); } catch (Exception e) { return null; }
    }

    @SuppressWarnings("unchecked")
    private Map<String, Object> nested(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return (v instanceof Map) ? (Map<String, Object>) v : Map.of();
    }

    @SuppressWarnings("unchecked")
    private List<Map<String, Object>> list(Map<String, Object> m, String key) {
        Object v = m.get(key);
        return (v instanceof List) ? (List<Map<String, Object>>) v : List.of();
    }

    // ── Apply ──────────────────────────────────────────────────────────────────
    @Transactional
    public Loan applyForLoan(Loan loanRequest, UUID loanTypeId) {
        LoanType type = loanTypeRepository.findById(loanTypeId)
                .orElseThrow(() -> new RuntimeException("Loan Type not found"));

        loanRequest.setLoanType(type);
        loanRequest.setLoanTypeStr(type.getName());
        if (loanRequest.getBranchId() == null) {
            loanRequest.setBranchId(1);
        }
        loanRequest.setInterestRate(type.getInterestRate());
        loanRequest.setAppliedDate(LocalDate.now());
        loanRequest.setStatus("PENDING");
        loanRequest.setCurrentStage("STAGE_1_MANAGER_APPROVAL");

        Loan saved = loanRepository.save(loanRequest);
        UUID loanId = saved.getLoanId();

        Map<String, Object> ad = saved.getApplicationData();
        if (ad != null && !ad.isEmpty()) {
            saveApplicantDetails(loanId, ad);
            saveAssetDetails(loanId, ad);
            saveGuarantors(loanId, ad);
            saveFamilyMembers(loanId, ad);
        }

        return saved;
    }

    // ── Persist Applicant Details ──────────────────────────────────────────────
    private void saveApplicantDetails(UUID loanId, Map<String, Object> ad) {
        LoanApplicantDetail detail = new LoanApplicantDetail();
        detail.setLoanId(loanId);

        String name = str(ad, "applicantName");
        detail.setApplicantName(name != null ? name : str(ad, "name"));
        String addr = str(ad, "addressLine1");
        detail.setAddressLine1(addr != null ? addr : str(ad, "address"));
        detail.setAddressLine2(str(ad, "addressLine2"));
        detail.setBranch(str(ad, "branch"));
        detail.setSharesObtained(bd(ad, "sharesObtained"));
        detail.setDateOfBirth(str(ad, "dob"));
        detail.setGender(str(ad, "gender"));
        detail.setCivilStatus(str(ad, "civilStatus"));
        detail.setNic(str(ad, "nic"));
        detail.setPhone(str(ad, "phone"));
        String mno = str(ad, "memberNo");
        detail.setMemberNo(mno != null ? mno : str(ad, "officeMemberNo"));
        detail.setResidencePeriod(str(ad, "residencePeriod"));
        detail.setProvince(str(ad, "province"));

        Object isMember = ad.get("isMemberOfOtherCoop");
        if (isMember != null) detail.setIsMemberOfOtherCoop(Boolean.parseBoolean(isMember.toString()));
        detail.setOtherCoopDetails(str(ad, "otherCoopDetails"));
        detail.setGuarantorOfOtherLoan1(str(ad, "guarantorOfOtherLoan1"));
        detail.setGuarantorOfOtherLoan2(str(ad, "guarantorOfOtherLoan2"));
        detail.setRequiredLoanCash(bd(ad, "requiredLoanCash"));
        detail.setRequiredLoanGoods(bd(ad, "requiredLoanGoods"));
        detail.setLoanPurpose(str(ad, "loanPurpose"));

        Object rpm = ad.get("repaymentPeriodMonths");
        if (rpm != null && !rpm.toString().isBlank()) {
            try { detail.setRepaymentPeriodMonths(Integer.parseInt(rpm.toString())); } catch (Exception ignored) {}
        }

        detail.setPrimaryJob(str(ad, "primaryJob"));
        detail.setEmployerDetails(str(ad, "employerDetails"));
        detail.setSpouseJobTitle(str(ad, "spouseJobTitle"));
        detail.setSpouseEmployerDetails(str(ad, "spouseEmployerDetails"));
        detail.setHeadOfHouseholdName(str(ad, "headOfHouseholdName"));

        Object dc = ad.get("dependentsCount");
        if (dc != null && !dc.toString().isBlank()) {
            try { detail.setDependentsCount(Integer.parseInt(dc.toString())); } catch (Exception ignored) {}
        }

        detail.setAnnualIncomePrimary(bd(ad, "annualIncomePrimary"));
        detail.setAnnualIncomeOther(bd(ad, "annualIncomeOther"));
        detail.setAnnualExpense(bd(ad, "annualExpense"));
        detail.setExistingLoansCoop(bd(ad, "existingLoansCoop"));
        detail.setExistingLoansOther(bd(ad, "existingLoansOther"));
        detail.setDesignation(str(ad, "designation"));
        detail.setShareAmount(bd(ad, "shareAmount"));
        detail.setAgreedAmount(bd(ad, "agreedAmount"));
        detail.setApplicantDigitalSignatureUrl(str(ad, "applicantDigitalSignatureUrl"));

        applicantDetailRepository.save(detail);
    }

    // ── Persist Asset Details ──────────────────────────────────────────────────
    private void saveAssetDetails(UUID loanId, Map<String, Object> ad) {
        Map<String, Object> assets = nested(ad, "assets");
        Map<String, Object> bankAccounts = nested(ad, "bankAccounts");
        if (assets.isEmpty() && bankAccounts.isEmpty()) return;

        Map<String, Object> bCurrent = nested(bankAccounts, "current");
        Map<String, Object> bDhana   = nested(bankAccounts, "dhanaYojana");
        Map<String, Object> bSavings = nested(bankAccounts, "savings");
        Map<String, Object> bFixed   = nested(bankAccounts, "fixed");

        LoanAssetDetail assetDetail = new LoanAssetDetail();
        assetDetail.setLoanId(loanId);
        assetDetail.setLandGodaValue(bd(assets, "landGoda"));
        assetDetail.setLandMadaValue(bd(assets, "landMada"));
        assetDetail.setVehiclesValue(bd(assets, "vehicles"));
        assetDetail.setAnimalsValue(bd(assets, "animals"));
        assetDetail.setOtherAssetsValue(bd(assets, "other"));

        assetDetail.setBankCurrentBranch(str(bCurrent, "branch"));
        assetDetail.setBankCurrentAccNo(str(bCurrent, "accNo"));
        assetDetail.setBankCurrentBalance(bd(bCurrent, "balance"));
        assetDetail.setBankDhanaYojanaBranch(str(bDhana, "branch"));
        assetDetail.setBankDhanaYojanaAccNo(str(bDhana, "accNo"));
        assetDetail.setBankDhanaYojanaBalance(bd(bDhana, "balance"));
        assetDetail.setBankSavingsBranch(str(bSavings, "branch"));
        assetDetail.setBankSavingsAccNo(str(bSavings, "accNo"));
        assetDetail.setBankSavingsBalance(bd(bSavings, "balance"));
        assetDetail.setBankFixedBranch(str(bFixed, "branch"));
        assetDetail.setBankFixedAccNo(str(bFixed, "accNo"));
        assetDetail.setBankFixedBalance(bd(bFixed, "balance"));

        assetDetailRepository.save(assetDetail);
    }

    // ── Persist Guarantors ─────────────────────────────────────────────────────
    private void saveGuarantors(UUID loanId, Map<String, Object> ad) {
        for (int i = 1; i <= 2; i++) {
            String key = "guarantor" + i;
            Map<String, Object> g = nested(ad, key);
            String name = g.isEmpty() ? str(ad, key + "Name") : str(g, "name");
            if (name == null || name.isBlank()) continue;

            LoanGuarantor guarantor = new LoanGuarantor();
            guarantor.setLoanId(loanId);
            guarantor.setGuarantorNumber(i);
            guarantor.setFullName(name);
            guarantor.setAddress(g.isEmpty() ? str(ad, key + "Address") : str(g, "address"));
            guarantor.setNic(str(g, "nic"));
            guarantor.setDateOfBirth(str(g, "dob"));
            guarantor.setMemberNo(str(g, "memberNo"));
            guarantor.setJob(str(g, "job"));
            guarantor.setPhone(str(g, "phone"));
            String sig = g.isEmpty() ? str(ad, key + "DigitalSignatureUrl") : str(g, "digitalSignatureUrl");
            guarantor.setDigitalSignatureUrl(sig);

            Map<String, Object> ga = nested(g, "assets");
            guarantor.setAssetLandValue(bd(ga, "land"));
            guarantor.setAssetVehiclesValue(bd(ga, "vehicles"));
            guarantor.setAssetAnimalsValue(bd(ga, "animals"));
            guarantor.setAssetOtherValue(bd(ga, "other"));

            Map<String, Object> gb = nested(g, "bank");
            guarantor.setBankDhanaYojana(bd(gb, "dhanaYojana"));
            guarantor.setBankSavings(bd(gb, "savings"));
            guarantor.setBankFixed(bd(gb, "fixed"));
            guarantor.setAnnualIncomePrimary(bd(g, "incomePrimary"));
            guarantor.setAnnualIncomeOther(bd(g, "incomeOther"));

            guarantorRepository.save(guarantor);
        }
    }

    // ── Persist Family Members ─────────────────────────────────────────────────
    private void saveFamilyMembers(UUID loanId, Map<String, Object> ad) {
        for (Map<String, Object> fm : list(ad, "familyMembers")) {
            String name = str(fm, "name");
            if (name == null || name.isBlank()) continue;
            LoanFamilyMember member = new LoanFamilyMember();
            member.setLoanId(loanId);
            member.setOwnerType("APPLICANT");
            member.setMemberName(name);
            member.setAge(str(fm, "age"));
            member.setRelation(str(fm, "relation"));
            member.setJob(str(fm, "job"));
            familyMemberRepository.save(member);
        }
    }

    // ── Getters ────────────────────────────────────────────────────────────────
    public List<Loan> getAllLoans() { return loanRepository.findAll(); }
    public Optional<Loan> getLoanById(UUID id) { return loanRepository.findById(id); }
    public List<Loan> getLoansByMemberId(UUID memberId) { return loanRepository.findByMemberId(memberId); }
    public List<Loan> getLoansByStatus(String status) { return loanRepository.findByStatus(status); }

    // ── Stage Management ───────────────────────────────────────────────────────
    public Loan updateLoanStage(UUID loanId, String newStage, String newStatus) {
        return loanRepository.findById(loanId).map(loan -> {
            loan.setCurrentStage(newStage);
            if (newStatus != null) loan.setStatus(newStatus);
            return loanRepository.save(loan);
        }).orElseThrow(() -> new RuntimeException("Loan not found with id " + loanId));
    }

    public Loan advanceLoanStage(UUID loanId, String actorUsername, String actorRole, String comments) {
        Loan loan = loanRepository.findById(loanId).orElseThrow(() -> new RuntimeException("Loan not found"));
        String currentStage = loan.getCurrentStage();
        int currentIdx = WORKFLOW_STAGES.indexOf(currentStage);
        if (currentIdx < 0) throw new RuntimeException("Unknown current stage: " + currentStage);
        if (currentIdx >= WORKFLOW_STAGES.size() - 1) throw new RuntimeException("Loan is already at the final stage");

        String nextStage = WORKFLOW_STAGES.get(currentIdx + 1);
        loan.setCurrentStage(nextStage);
        if (nextStage.equals("STAGE_3_APPROVED")) loan.setStatus("APPROVED");
        loanRepository.save(loan);

        LoanApprovalAction action = new LoanApprovalAction();
        action.setLoanId(loanId); action.setStage(currentStage);
        action.setAction("APPROVED"); action.setActorUsername(actorUsername);
        action.setActorRole(actorRole); action.setComments(comments);
        approvalActionRepository.save(action);
        return loan;
    }

    public Loan rejectLoan(UUID loanId, String actorUsername, String actorRole, String comments) {
        Loan loan = loanRepository.findById(loanId).orElseThrow(() -> new RuntimeException("Loan not found"));
        loan.setStatus("REJECTED");
        loanRepository.save(loan);

        LoanApprovalAction action = new LoanApprovalAction();
        action.setLoanId(loanId); action.setStage(loan.getCurrentStage());
        action.setAction("REJECTED"); action.setActorUsername(actorUsername);
        action.setActorRole(actorRole); action.setComments(comments);
        approvalActionRepository.save(action);
        return loan;
    }

    public List<LoanApprovalAction> getLoanApprovalHistory(UUID loanId) {
        return approvalActionRepository.findByLoanIdOrderByCreatedAtAsc(loanId);
    }

    // ── EMI & Interest ─────────────────────────────────────────────────────────
    public BigDecimal calculateInterest(BigDecimal principal, int days, BigDecimal ratePercent) {
        return principal.multiply(BigDecimal.valueOf(days)).multiply(ratePercent)
                .divide(BigDecimal.valueOf(36500), 2, RoundingMode.HALF_UP);
    }

    // ── Disbursement ───────────────────────────────────────────────────────────
    @Transactional
    public Loan disburseLoan(UUID loanId, BigDecimal amount, String actorUsername, String paymentMethod, String savingsAccountNumber) {
        Loan loan = loanRepository.findById(loanId).orElseThrow(() -> new RuntimeException("Loan not found"));
        if (!"APPROVED".equals(loan.getStatus()) && !"STAGE_3_APPROVED".equals(loan.getCurrentStage())) {
            throw new RuntimeException("Loan must be fully approved before disbursement.");
        }
        
        // Generate Account Number: e.g. LN-HKW-{year}-{seq}
        String year = String.valueOf(LocalDate.now().getYear());
        String seq = String.format("%04d", new Random().nextInt(10000));
        loan.setAccountNumber("LN-HKW-" + year + "-" + seq);

        loan.setDisbursementDate(java.time.LocalDateTime.now());
        loan.setDisbursedAmount(amount != null ? amount : loan.getRequestedAmount());
        loan.setDisbursedBy(actorUsername);
        loan.setStatus("ACTIVE");
        loan.setCurrentStage("DISBURSED");

        // Execute Transfer if paymentMethod is SAVINGS_TRANSFER
        if ("SAVINGS_TRANSFER".equalsIgnoreCase(paymentMethod)) {
            if (savingsAccountNumber == null || savingsAccountNumber.trim().isEmpty()) {
                throw new IllegalArgumentException("Savings Account Number is required for savings transfer.");
            }
            
            Map<String, Object> depositRequest = new HashMap<>();
            depositRequest.put("accountNumber", savingsAccountNumber);
            depositRequest.put("amount", loan.getDisbursedAmount());
            depositRequest.put("reference", "Disbursed Loan " + loan.getAccountNumber());
            depositRequest.put("requestApproval", false);

            try {
                String savingsServiceUrl = "http://hmcs-savings-service:8082/api/v1/transactions/deposit";
                restTemplate.postForEntity(savingsServiceUrl, depositRequest, Object.class);
            } catch (Exception e) {
                throw new RuntimeException("Failed to credit savings account: " + e.getMessage(), e);
            }
        }

        LoanApprovalAction action = new LoanApprovalAction();
        action.setLoanId(loanId); 
        action.setStage("DISBURSED");
        action.setAction("DISBURSED"); 
        action.setActorUsername(actorUsername);
        action.setComments("Loan disbursed (" + paymentMethod + "). Account No: " + loan.getAccountNumber());
        approvalActionRepository.save(action);

        // ── AUTO-CREATE GENERAL LEDGER ENTRY ─────────────────────────────────
        // Debit: LOAN_RECEIVABLE (bank is now owed this money)
        // Credit: CASH or SAVINGS_DEPOSITS (depending on how money left the bank)
        String creditAccount = "SAVINGS_TRANSFER".equalsIgnoreCase(paymentMethod)
                ? "SAVINGS_DEPOSITS"
                : "CASH_IN_VAULT";

        LedgerEntry glEntry = new LedgerEntry();
        glEntry.setLoanId(loanId);
        glEntry.setReferenceNumber(loan.getAccountNumber());
        glEntry.setEntryDate(LocalDate.now());
        glEntry.setDescription("Loan Disbursement — " + loan.getAccountNumber()
                + " | Member: " + loan.getMemberId()
                + " | Method: " + paymentMethod);
        glEntry.setDebitAccount("LOAN_RECEIVABLE");
        glEntry.setCreditAccount(creditAccount);
        glEntry.setAmount(loan.getDisbursedAmount());
        glEntry.setEntryType("DISBURSEMENT");
        glEntry.setPaymentMethod(paymentMethod);
        glEntry.setBranchId(loan.getBranchId());
        glEntry.setCreatedBy(actorUsername);
        ledgerEntryRepository.save(glEntry);
        // ─────────────────────────────────────────────────────────────────────

        return loanRepository.save(loan);
    }

    public List<Map<String, Object>> generateRepaymentSchedule(BigDecimal principal, Integer termMonths, BigDecimal annualRatePercent) {
        List<Map<String, Object>> schedule = new ArrayList<>();
        BigDecimal monthlyPrincipal = principal.divide(BigDecimal.valueOf(termMonths), 2, RoundingMode.HALF_UP);
        BigDecimal dailyRate = annualRatePercent.divide(BigDecimal.valueOf(36500), 10, RoundingMode.HALF_UP);
        BigDecimal outstandingBalance = principal;
        LocalDate dueDate = LocalDate.now().plusMonths(1);
        for (int i = 1; i <= termMonths; i++) {
            BigDecimal interest = outstandingBalance.multiply(dailyRate).multiply(BigDecimal.valueOf(30)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal emi = monthlyPrincipal.add(interest);
            outstandingBalance = outstandingBalance.subtract(monthlyPrincipal);
            if (outstandingBalance.compareTo(BigDecimal.ZERO) < 0) outstandingBalance = BigDecimal.ZERO;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("installmentNo", i); row.put("dueDate", dueDate.toString());
            row.put("principalPortion", monthlyPrincipal); row.put("interestPortion", interest);
            row.put("emi", emi); row.put("outstandingBalance", outstandingBalance);
            schedule.add(row);
            dueDate = dueDate.plusMonths(1);
        }
        return schedule;
    }
}
