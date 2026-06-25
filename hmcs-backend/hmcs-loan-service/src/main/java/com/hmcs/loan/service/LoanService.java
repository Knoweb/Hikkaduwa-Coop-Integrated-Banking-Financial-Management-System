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
    @Autowired private LoanScheduleRepository loanScheduleRepository;
    @Autowired private LoanRepaymentRepository loanRepaymentRepository;
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
        
        LocalDate appliedDate = loanRequest.getAppliedDate() != null ? loanRequest.getAppliedDate() : LocalDate.now();
        loanRequest.setAppliedDate(appliedDate);
        
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

    public List<LoanSchedule> getLoanSchedules(UUID loanId) {
        return loanScheduleRepository.findByLoanIdOrderByInstallmentNumberAsc(loanId);
    }

    public List<LoanRepayment> getLoanRepayments(UUID loanId) {
        return loanRepaymentRepository.findByLoanIdOrderByPaymentDateDesc(loanId);
    }

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
        // ── AUTO-CREATE LOAN SCHEDULE ────────────────────────────────────────
        Map<String, Object> appData = loan.getApplicationData();
        Integer termMonths = null;
        if (appData != null && appData.containsKey("repaymentPeriodMonths")) {
            try { termMonths = Integer.parseInt(appData.get("repaymentPeriodMonths").toString()); } catch (Exception ignored) {}
        }
        if (termMonths == null) termMonths = 12; // default

        List<Map<String, Object>> scheduleData = generateRepaymentSchedule(loan.getDisbursedAmount(), termMonths, loan.getInterestRate(), loan.getAppliedDate());
        
        for (Map<String, Object> row : scheduleData) {
            LoanSchedule schedule = new LoanSchedule();
            schedule.setLoanId(loanId);
            schedule.setInstallmentNumber((Integer) row.get("installmentNo"));
            schedule.setDueDate(LocalDate.parse(row.get("dueDate").toString()));
            schedule.setExpectedPrincipal((BigDecimal) row.get("principalPortion"));
            schedule.setExpectedInterest((BigDecimal) row.get("interestPortion"));
            schedule.setTotalExpectedAmount((BigDecimal) row.get("emi"));
            schedule.setOutstandingBalance((BigDecimal) row.get("outstandingBalance"));
            schedule.setStatus(LoanSchedule.ScheduleStatus.PENDING);
            loanScheduleRepository.save(schedule);
        }
        // ─────────────────────────────────────────────────────────────────────

        return loanRepository.save(loan);
    }

    public List<Map<String, Object>> generateRepaymentSchedule(BigDecimal principal, Integer termMonths, BigDecimal annualRatePercent, LocalDate startDate) {
        if (startDate == null) startDate = LocalDate.now();
        List<Map<String, Object>> schedule = new ArrayList<>();
        BigDecimal monthlyPrincipal = principal.divide(BigDecimal.valueOf(termMonths), 2, RoundingMode.HALF_UP);
        BigDecimal dailyRate = annualRatePercent.divide(BigDecimal.valueOf(36500), 10, RoundingMode.HALF_UP);
        BigDecimal outstandingBalance = principal;
        LocalDate dueDate = startDate.plusMonths(1);
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

    // ── Repayment Processing ───────────────────────────────────────────────────
    @Transactional
    public LoanRepayment payInstallment(UUID loanId, BigDecimal paymentAmount, String paymentMethod, String accountNoOrRef, String actorUsername, Long paymentBranchId) {
        Loan loan = loanRepository.findById(loanId).orElseThrow(() -> new RuntimeException("Loan not found"));
        if (!"ACTIVE".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not ACTIVE. Cannot accept payments.");
        }

        // Cooperative rules: Heena wana shesha kramaya (reducing balance). No penalty for late payment.
        // User must pay AT LEAST the expected interest + some principal, or they can pay MORE.
        
        // Find next pending schedule
        List<LoanSchedule> pendingSchedules = loanScheduleRepository.findByLoanIdAndStatusOrderByInstallmentNumberAsc(loanId, LoanSchedule.ScheduleStatus.PENDING);
        if (pendingSchedules.isEmpty()) {
            throw new RuntimeException("No pending installments found. Loan might be fully paid.");
        }
        
        LoanSchedule nextInstallment = pendingSchedules.get(0);
        BigDecimal expectedTotal = nextInstallment.getTotalExpectedAmount();

        if (paymentAmount.compareTo(expectedTotal) < 0) {
            throw new RuntimeException("Payment amount (" + paymentAmount + ") is less than the expected installment (" + expectedTotal + "). Underpayment is not allowed.");
        }

        // For reducing balance, if they pay exactly the EMI, split is as per schedule.
        // If they pay MORE, the extra goes entirely towards the Principal.
        BigDecimal interestPortion = nextInstallment.getExpectedInterest();
        BigDecimal principalPortion = paymentAmount.subtract(interestPortion);

        // Record Repayment
        LoanRepayment repayment = new LoanRepayment();
        repayment.setLoanId(loanId);
        repayment.setPaymentBranchId(paymentBranchId != null ? paymentBranchId : loan.getBranchId());
        // Since we don't have a direct user UUID passed for actor, we can try to look it up or just use a dummy UUID if unavailable.
        // For now, we will generate a random UUID to represent the processor if not supplied. 
        repayment.setProcessedBy(UUID.randomUUID()); 
        repayment.setTotalPaid(paymentAmount);
        repayment.setPrincipalPortion(principalPortion);
        repayment.setInterestPortion(interestPortion);
        repayment.setPenaltyPaid(BigDecimal.ZERO); // No penalty for reducing balance
        repayment.setPaymentMethod(LoanRepayment.PaymentMethod.valueOf(paymentMethod));
        repayment.setReference("Installment " + nextInstallment.getInstallmentNumber() + " - " + accountNoOrRef);
        repayment = loanRepaymentRepository.save(repayment);

        // Update Schedule Status
        nextInstallment.setStatus(LoanSchedule.ScheduleStatus.PAID);
        loanScheduleRepository.save(nextInstallment);

        // Update Loan Outstanding Balance
        BigDecimal currentOutstanding = loan.getDisbursedAmount(); // We need an outstanding balance field. If not present, we can approximate or we should really add it to Loan.java
        // Since Loan entity might lack outstanding balance right now, we just rely on ledger for exact balance. 
        // We will update the loan status to COMPLETED if the principal portion covers the whole remaining loan.

        // ── AUTO-CREATE GENERAL LEDGER ENTRY ─────────────────────────────────
        String debitAccount = "SAVINGS_TRANSFER".equalsIgnoreCase(paymentMethod) ? "SAVINGS_DEPOSITS" : "CASH_IN_VAULT";
        
        // Ledger Entry 1: Total cash in
        LedgerEntry cashIn = new LedgerEntry();
        cashIn.setLoanId(loanId);
        cashIn.setReferenceNumber(repayment.getId().toString());
        cashIn.setEntryDate(LocalDate.now());
        cashIn.setDescription("Loan Repayment (Cash In) — " + loan.getAccountNumber());
        cashIn.setDebitAccount(debitAccount);
        cashIn.setCreditAccount("LOAN_REPAYMENT_CLEARING");
        cashIn.setAmount(paymentAmount);
        cashIn.setEntryType("REPAYMENT_CASH_IN");
        cashIn.setPaymentMethod(paymentMethod);
        cashIn.setBranchId(Math.toIntExact(repayment.getPaymentBranchId()));
        cashIn.setCreatedBy(actorUsername);
        ledgerEntryRepository.save(cashIn);

        // Ledger Entry 2: Principal deduction
        LedgerEntry principalDeduction = new LedgerEntry();
        principalDeduction.setLoanId(loanId);
        principalDeduction.setReferenceNumber(repayment.getId().toString());
        principalDeduction.setEntryDate(LocalDate.now());
        principalDeduction.setDescription("Loan Principal Deduction — " + loan.getAccountNumber());
        principalDeduction.setDebitAccount("LOAN_REPAYMENT_CLEARING");
        principalDeduction.setCreditAccount("LOAN_RECEIVABLE");
        principalDeduction.setAmount(principalPortion);
        principalDeduction.setEntryType("REPAYMENT_PRINCIPAL");
        principalDeduction.setPaymentMethod(paymentMethod);
        principalDeduction.setBranchId(Math.toIntExact(repayment.getPaymentBranchId()));
        principalDeduction.setCreatedBy(actorUsername);
        ledgerEntryRepository.save(principalDeduction);

        // Ledger Entry 3: Interest Income
        LedgerEntry interestIncome = new LedgerEntry();
        interestIncome.setLoanId(loanId);
        interestIncome.setReferenceNumber(repayment.getId().toString());
        interestIncome.setEntryDate(LocalDate.now());
        interestIncome.setDescription("Loan Interest Income — " + loan.getAccountNumber());
        interestIncome.setDebitAccount("LOAN_REPAYMENT_CLEARING");
        interestIncome.setCreditAccount("INTEREST_INCOME");
        interestIncome.setAmount(interestPortion);
        interestIncome.setEntryType("REPAYMENT_INTEREST");
        interestIncome.setPaymentMethod(paymentMethod);
        interestIncome.setBranchId(Math.toIntExact(repayment.getPaymentBranchId()));
        interestIncome.setCreatedBy(actorUsername);
        ledgerEntryRepository.save(interestIncome);
        // ─────────────────────────────────────────────────────────────────────

        // If Savings Transfer, we need to call Savings Service to deduct the amount
        if ("SAVINGS_TRANSFER".equalsIgnoreCase(paymentMethod)) {
            Map<String, Object> withdrawalRequest = new HashMap<>();
            withdrawalRequest.put("accountNumber", accountNoOrRef);
            withdrawalRequest.put("amount", paymentAmount);
            withdrawalRequest.put("reference", "Loan Installment " + loan.getAccountNumber());
            withdrawalRequest.put("requestApproval", false);

            try {
                String savingsServiceUrl = "http://hmcs-savings-service:8082/api/v1/transactions/withdraw";
                restTemplate.postForEntity(savingsServiceUrl, withdrawalRequest, Object.class);
            } catch (Exception e) {
                throw new RuntimeException("Failed to debit savings account for loan repayment: " + e.getMessage(), e);
            }
        }

        // Check if fully paid (if no pending schedules left or if principal covers full remaining)
        if (loanScheduleRepository.findByLoanIdAndStatusOrderByInstallmentNumberAsc(loanId, LoanSchedule.ScheduleStatus.PENDING).isEmpty()) {
            loan.setStatus("COMPLETED");
            loanRepository.save(loan);
        }

        return repayment;
    }
}
