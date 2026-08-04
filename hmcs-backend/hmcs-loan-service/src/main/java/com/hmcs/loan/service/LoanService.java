package com.hmcs.loan.service;

import com.hmcs.loan.entity.*;
import com.hmcs.loan.repository.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;
import org.springframework.jdbc.core.JdbcTemplate;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;
import java.util.stream.Collectors;

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
    @Autowired private com.hmcs.loan.repository.PendingFieldCollectionRepository pendingFieldCollectionRepository;
    @Autowired private JdbcTemplate jdbcTemplate;

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
        if (type.getName().contains("FD ණය") || type.getName().contains("ස්ථාවර තැන්පතු ණය")) {
            if (ad == null || !ad.containsKey("associatedFdId") || ad.get("associatedFdId").toString().isBlank()) {
                throw new RuntimeException("FD Loan requires an associated Fixed Deposit");
            }
            String fdId = ad.get("associatedFdId").toString();
            try {
                String savingsServiceHost = System.getenv("SAVINGS_SERVICE_HOST");
                if (savingsServiceHost == null || savingsServiceHost.isEmpty()) {
                    savingsServiceHost = "localhost";
                }
                String fdUrl = "http://" + savingsServiceHost + ":8082/api/v1/fixed-deposits/" + fdId;
                
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                Integer currentTenant = com.hmcs.loan.multitenancy.TenantContext.getTenantId();
                if (currentTenant == null) currentTenant = loanRequest.getTenantId();
                if (currentTenant != null) headers.set("X-Tenant-ID", String.valueOf(currentTenant));

                org.springframework.http.HttpEntity<?> entity = new org.springframework.http.HttpEntity<>(headers);
                org.springframework.http.ResponseEntity<Map> response = restTemplate.exchange(fdUrl, org.springframework.http.HttpMethod.GET, entity, Map.class);
                
                if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                    Map fdData = response.getBody();
                    if (fdData.get("principalAmount") != null) {
                        BigDecimal principal = new BigDecimal(fdData.get("principalAmount").toString());
                        BigDecimal maxLimit = principal.multiply(new BigDecimal("0.85"));
                        if (loanRequest.getRequestedAmount().compareTo(maxLimit) > 0) {
                            throw new RuntimeException("Requested amount exceeds 85% of Fixed Deposit principal");
                        }
                    }
                } else {
                    throw new RuntimeException("Could not verify Fixed Deposit details");
                }
            } catch (Exception e) {
                if (e instanceof RuntimeException && e.getMessage().contains("exceeds")) {
                    throw e;
                }
                System.err.println("Failed to validate Fixed Deposit limit: " + e.getMessage());
                // We could throw here, but if savings service is unreachable, we shouldn't block tests entirely.
                // For strict enforcement, we throw:
                throw new RuntimeException("Failed to validate Fixed Deposit limit: " + e.getMessage());
            }
        }

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
    public List<Loan> getAllLoans(Integer branchId) {
        if (branchId != null) {
            return loanRepository.findAll().stream()
                .filter(loan -> branchId.equals(loan.getBranchId()))
                .collect(Collectors.toList());
        }
        return loanRepository.findAll();
    }

    public List<Loan> getAllLoans() { return loanRepository.findAll(); }
    public Optional<Loan> getLoanById(UUID id) { return loanRepository.findById(id); }
    public List<Loan> getLoansByMemberId(UUID memberId) { return loanRepository.findByMemberId(memberId); }
    public List<Loan> getLoansByStatus(String status) { return loanRepository.findByStatus(status); }

    private String getLoanTypeCode(com.hmcs.loan.entity.LoanType loanType) {
        if (loanType == null) return "";
        String desc = loanType.getDescription() != null ? loanType.getDescription() : "";
        String name = loanType.getName() != null ? loanType.getName() : "";
        
        if (desc.contains("[CODE:")) {
            int start = desc.indexOf("[CODE:") + 6;
            int end = desc.indexOf("]", start);
            if (end > start) return desc.substring(start, end).toUpperCase();
        }
        
        // Fallback for older records
        boolean isSinhala = name.matches(".*[\\u0D80-\\u0DFF].*");
        String baseStr = isSinhala ? desc : name;
        if (baseStr != null) {
            return baseStr.replaceAll("\\s+", "_").toUpperCase();
        }
        return "";
    }

    public List<Loan> getInsuranceReportLoans(String monthStr) {
        List<Loan> allLoans = loanRepository.findAll();
        return allLoans.stream().filter(loan -> {
            // Check if it's a Short Term Loan using the code
            String code = getLoanTypeCode(loan.getLoanType());
            boolean isKetiNaya = code.contains("SHORT_TERM");
            if (!isKetiNaya) return false;

            if (!"DISBURSED".equals(loan.getStatus()) && !"ACTIVE".equals(loan.getStatus()) && !"COMPLETED".equals(loan.getStatus())) {
                return false;
            }
            String dateStr = loan.getDisbursementDate() != null ? loan.getDisbursementDate().toString() : 
                             (loan.getAppliedDate() != null ? loan.getAppliedDate().toString() : "");
            return dateStr.startsWith(monthStr);
        }).collect(Collectors.toList());
    }

    @Transactional
    public void deleteLoan(UUID loanId) {
        // Delete related entities first to avoid foreign key constraint violations
        approvalActionRepository.deleteByLoanId(loanId);
        loanScheduleRepository.deleteByLoanId(loanId);
        loanRepaymentRepository.deleteByLoanId(loanId);
        applicantDetailRepository.deleteByLoanId(loanId);
        assetDetailRepository.deleteByLoanId(loanId);
        guarantorRepository.deleteByLoanId(loanId);
        familyMemberRepository.deleteByLoanId(loanId);
        
        // Ledger entries are associated by loanId, but they might be important for auditing.
        // If the system requires complete deletion:
        ledgerEntryRepository.deleteByLoanId(loanId);

        loanRepository.deleteById(loanId);
    }

    public List<LoanSchedule> getLoanSchedules(UUID loanId) {
        return loanScheduleRepository.findByLoanIdOrderByInstallmentNumberAsc(loanId);
    }

    public List<LoanRepayment> getLoanRepayments(UUID loanId) {
        return loanRepaymentRepository.findByLoanIdOrderByPaymentDateDesc(loanId);
    }

    
    // ── Field Officer Workflows ────────────────────────────────────────────────
    public Loan assignEvaluator(UUID loanId, UUID evaluatorId) {
        return loanRepository.findById(loanId).map(loan -> {
            loan.setEvaluatorId(evaluatorId);
            loan.setEvaluationStatus("ASSIGNED");
            return loanRepository.save(loan);
        }).orElseThrow(() -> new RuntimeException("Loan not found"));
    }

    public Loan submitEvaluation(UUID loanId, String status, String notes) {
        return loanRepository.findById(loanId).map(loan -> {
            loan.setEvaluationStatus(status);
            loan.setEvaluationNotes(notes);
            return loanRepository.save(loan);
        }).orElseThrow(() -> new RuntimeException("Loan not found"));
    }

    public List<Loan> getLoansByEvaluatorId(UUID evaluatorId) {
        return loanRepository.findByEvaluatorId(evaluatorId);
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

        // Custom workflow logic: 
        // Only "සේවක ණය" and "කෙටි ණය" go to Loan Committee. Others skip to APPROVED.
        if ("STAGE_2_LOAN_COMMITTEE_APPROVAL".equals(nextStage)) {
            String code = getLoanTypeCode(loan.getLoanType());
            boolean requiresCommittee = code.contains("EMPLOYEE") || code.contains("SHORT_TERM");
            
            if (!requiresCommittee) {
                nextStage = "STAGE_3_APPROVED"; // Skip committee
            }
        }

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
    public Loan disburseLoan(UUID loanId, BigDecimal amount, String actorUsername, String paymentMethod, String savingsAccountNumber, String loanAccountNumber) {
        Loan loan = loanRepository.findById(loanId).orElseThrow(() -> new RuntimeException("Loan not found"));
        if (!"APPROVED".equals(loan.getStatus()) && !"STAGE_3_APPROVED".equals(loan.getCurrentStage())) {
            throw new RuntimeException("Loan must be fully approved before disbursement.");
        }
        
        if (loanAccountNumber == null || loanAccountNumber.trim().isEmpty()) {
            throw new RuntimeException("Loan Account Number is mandatory for disbursement.");
        }
        loan.setAccountNumber(loanAccountNumber.trim());

        loan.setDisbursementDate(java.time.LocalDateTime.now());
        loan.setDisbursedAmount(amount != null ? amount : loan.getRequestedAmount());
        loan.setDisbursedBy(actorUsername);
        loan.setStatus("ACTIVE");
        loan.setCurrentStage("DISBURSED");

        Map<String, Object> ad = loan.getApplicationData();
        if (ad == null) ad = new HashMap<>();
        ad.put("disbursementMethod", paymentMethod);
        if ("SAVINGS_TRANSFER".equalsIgnoreCase(paymentMethod) && savingsAccountNumber != null) {
            ad.put("disbursementSavingsAccount", savingsAccountNumber);
        }
        loan.setApplicationData(ad);

        // Execute Transfer if paymentMethod is SAVINGS_TRANSFER
        if ("SAVINGS_TRANSFER".equalsIgnoreCase(paymentMethod)) {
            if (savingsAccountNumber == null || savingsAccountNumber.trim().isEmpty()) {
                throw new IllegalArgumentException("Savings Account Number is required for savings transfer.");
            }
            
            Map<String, Object> depositRequest = new HashMap<>();
            depositRequest.put("accountNumber", savingsAccountNumber);
            depositRequest.put("amount", loan.getDisbursedAmount());
            depositRequest.put("reference", "ණය මුදල (Loan Disbursement) - " + loan.getAccountNumber());
            depositRequest.put("requestApproval", false);

            try {
                String savingsServiceHost = System.getenv("SAVINGS_SERVICE_HOST");
                if (savingsServiceHost == null || savingsServiceHost.isEmpty()) {
                    savingsServiceHost = "localhost";
                }
                String savingsServiceUrl = "http://" + savingsServiceHost + ":8082/api/v1/transactions/deposit";
                
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                // Use TenantContext if available, otherwise fall back to loan entity's tenantId
                Integer currentTenant = com.hmcs.loan.multitenancy.TenantContext.getTenantId();
                if (currentTenant == null) {
                    currentTenant = loan.getTenantId();
                }
                if (currentTenant != null) {
                    headers.set("X-Tenant-ID", String.valueOf(currentTenant));
                    System.out.println("[LoanService] Sending deposit to savings. TenantId=" + currentTenant + ", Account=" + savingsAccountNumber);
                } else {
                    System.err.println("[LoanService] WARNING: No tenant ID found for savings deposit! Account=" + savingsAccountNumber);
                }
                
                org.springframework.web.context.request.RequestAttributes attrs = org.springframework.web.context.request.RequestContextHolder.getRequestAttributes();
                if (attrs instanceof org.springframework.web.context.request.ServletRequestAttributes) {
                    String authHeader = ((org.springframework.web.context.request.ServletRequestAttributes) attrs).getRequest().getHeader("Authorization");
                    System.out.println("[LoanService] Extracted Auth Header: " + (authHeader != null ? "Present (length: " + authHeader.length() + ")" : "NULL"));
                    if (authHeader != null) {
                        headers.set("Authorization", authHeader);
                    }
                } else {
                    System.out.println("[LoanService] RequestContextHolder attrs is NULL or not ServletRequestAttributes");
                }

                org.springframework.http.HttpEntity<Map<String, Object>> requestEntity = new org.springframework.http.HttpEntity<>(depositRequest, headers);
                
                restTemplate.postForEntity(savingsServiceUrl, requestEntity, Object.class);
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

        List<Map<String, Object>> scheduleData = generateRepaymentSchedule(loan.getDisbursedAmount(), termMonths, loan.getInterestRate(), loan.getDisbursementDate() != null ? loan.getDisbursementDate().toLocalDate() : loan.getAppliedDate());
        
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
        LocalDate previousDate = startDate;
        LocalDate dueDate = startDate.plusMonths(1);
        for (int i = 1; i <= termMonths; i++) {
            // Use actual days between previous and current due date (not fixed 30)
            long actualDays = java.time.temporal.ChronoUnit.DAYS.between(previousDate, dueDate);
            BigDecimal interest = outstandingBalance.multiply(dailyRate).multiply(BigDecimal.valueOf(actualDays)).setScale(2, RoundingMode.HALF_UP);
            BigDecimal emi = monthlyPrincipal.add(interest);
            outstandingBalance = outstandingBalance.subtract(monthlyPrincipal);
            if (outstandingBalance.compareTo(BigDecimal.ZERO) < 0) outstandingBalance = BigDecimal.ZERO;
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("installmentNo", i); row.put("dueDate", dueDate.toString());
            row.put("principalPortion", monthlyPrincipal); row.put("interestPortion", interest);
            row.put("emi", emi); row.put("outstandingBalance", outstandingBalance);
            row.put("daysInPeriod", actualDays);
            schedule.add(row);
            previousDate = dueDate;
            dueDate = dueDate.plusMonths(1);
        }
        return schedule;
    }

    // ── Repayment Processing ───────────────────────────────────────────────────
    @Transactional
    public LoanRepayment payInstallment(UUID loanId, BigDecimal paymentAmount, String paymentMethod, String accountNoOrRef, String actorUsername, Long paymentBranchId, java.time.LocalDate paymentDate) {
        if (paymentDate == null) paymentDate = java.time.LocalDate.now();
        Loan loan = loanRepository.findById(loanId).orElseThrow(() -> new RuntimeException("Loan not found"));
        if (!"ACTIVE".equals(loan.getStatus())) {
            throw new RuntimeException("Loan is not ACTIVE. Cannot accept payments.");
        }

        List<LoanRepayment> repayments = getLoanRepayments(loanId);
        BigDecimal totalPrincipalPaid = BigDecimal.ZERO;
        for (LoanRepayment r : repayments) {
            totalPrincipalPaid = totalPrincipalPaid.add(r.getPrincipalPortion());
        }
        
        BigDecimal outstandingPrincipal = loan.getRequestedAmount().subtract(totalPrincipalPaid);
        if (outstandingPrincipal.compareTo(BigDecimal.ZERO) < 0) {
            outstandingPrincipal = BigDecimal.ZERO;
        }

        java.time.LocalDate lastDate = loan.getDisbursementDate() != null ? loan.getDisbursementDate().toLocalDate() : loan.getAppliedDate();
        if (!repayments.isEmpty()) {
            lastDate = repayments.get(0).getPaymentDate().toLocalDate();
        }

        long daysElapsed = java.time.temporal.ChronoUnit.DAYS.between(lastDate, paymentDate);
        if (daysElapsed < 0) daysElapsed = 0;

        BigDecimal dailyRate = loan.getInterestRate().divide(BigDecimal.valueOf(36500), 10, java.math.RoundingMode.HALF_UP);
        BigDecimal interestPortion = outstandingPrincipal.multiply(BigDecimal.valueOf(daysElapsed)).multiply(dailyRate);
        BigDecimal principalPortion;

        if (paymentAmount.compareTo(interestPortion) <= 0) {
            interestPortion = paymentAmount;
            principalPortion = BigDecimal.ZERO;
        } else {
            principalPortion = paymentAmount.subtract(interestPortion);
        }

        // Record Repayment
        LoanRepayment repayment = new LoanRepayment();
        repayment.setLoanId(loanId);
        java.time.LocalDateTime actualPayTime = paymentDate.equals(java.time.LocalDate.now()) ? java.time.LocalDateTime.now() : paymentDate.atTime(12, 0);
        repayment.setPaymentDate(actualPayTime);
        repayment.setPaymentBranchId(paymentBranchId != null ? paymentBranchId : loan.getBranchId());
        repayment.setProcessedBy(UUID.randomUUID()); 
        repayment.setTotalPaid(paymentAmount);
        repayment.setPrincipalPortion(principalPortion);
        repayment.setInterestPortion(interestPortion);
        repayment.setPenaltyPaid(BigDecimal.ZERO);
        repayment.setPaymentMethod(LoanRepayment.PaymentMethod.valueOf(paymentMethod));
        repayment.setReference("Manual Payment - " + accountNoOrRef);
        repayment = loanRepaymentRepository.save(repayment);

        // Auto-update loan status if fully paid
        if (outstandingPrincipal.subtract(principalPortion).compareTo(BigDecimal.ZERO) <= 0) {
            loan.setStatus("COMPLETED");
            loanRepository.save(loan);
        }

        // Ignore pre-calculated schedule (as requested by user)


        // ── AUTO-CREATE GENERAL LEDGER ENTRY ─────────────────────────────────
        String debitAccount = "SAVINGS_TRANSFER".equalsIgnoreCase(paymentMethod) ? "SAVINGS_DEPOSITS" : 
                              "FIELD_COLLECTION".equalsIgnoreCase(paymentMethod) ? "FIELD_CASH_" + actorUsername.toUpperCase() : 
                              "CASH_IN_VAULT";
        
        LedgerEntry cashIn = new LedgerEntry();
        cashIn.setLoanId(loanId);
        cashIn.setReferenceNumber(repayment.getId().toString());
        cashIn.setEntryDate(paymentDate);
        cashIn.setCreatedAt(actualPayTime);
        cashIn.setDescription("Loan Repayment (Cash In) — " + loan.getAccountNumber());
        cashIn.setDebitAccount(debitAccount);
        cashIn.setCreditAccount("LOAN_REPAYMENT_CLEARING");
        cashIn.setAmount(paymentAmount);
        cashIn.setEntryType("REPAYMENT_CASH_IN");
        cashIn.setPaymentMethod(paymentMethod);
        cashIn.setBranchId(Math.toIntExact(repayment.getPaymentBranchId()));
        cashIn.setCreatedBy(actorUsername);
        ledgerEntryRepository.save(cashIn);

        LedgerEntry principalDeduction = new LedgerEntry();
        principalDeduction.setLoanId(loanId);
        principalDeduction.setReferenceNumber(repayment.getId().toString());
        principalDeduction.setEntryDate(paymentDate);
        principalDeduction.setCreatedAt(actualPayTime);
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
        interestIncome.setEntryDate(paymentDate);
        interestIncome.setCreatedAt(actualPayTime);
        interestIncome.setDescription("Loan Interest Income — " + loan.getAccountNumber());
        interestIncome.setDebitAccount("LOAN_REPAYMENT_CLEARING");
        interestIncome.setCreditAccount("INTEREST_INCOME");
        interestIncome.setAmount(interestPortion);
        interestIncome.setEntryType("REPAYMENT_INTEREST");
        interestIncome.setPaymentMethod(paymentMethod);
        interestIncome.setBranchId(Math.toIntExact(repayment.getPaymentBranchId()));
        interestIncome.setCreatedBy(actorUsername);
        ledgerEntryRepository.save(interestIncome);



        // If Savings Transfer, we need to call Savings Service to deduct the amount
        if ("SAVINGS_TRANSFER".equalsIgnoreCase(paymentMethod)) {
            Map<String, Object> withdrawalRequest = new HashMap<>();
            withdrawalRequest.put("accountNumber", accountNoOrRef);
            withdrawalRequest.put("amount", paymentAmount);
            withdrawalRequest.put("reference", "Loan Installment " + loan.getAccountNumber());
            withdrawalRequest.put("requestApproval", false);

            try {
                String savingsServiceHost = System.getenv("SAVINGS_SERVICE_HOST");
                if (savingsServiceHost == null || savingsServiceHost.isEmpty()) {
                    savingsServiceHost = "localhost";
                }
                String savingsServiceUrl = "http://" + savingsServiceHost + ":8082/api/v1/transactions/withdraw";
                
                org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
                headers.setContentType(org.springframework.http.MediaType.APPLICATION_JSON);
                Integer currentTenant = com.hmcs.loan.multitenancy.TenantContext.getTenantId();
                if (currentTenant != null) {
                    headers.set("X-Tenant-ID", String.valueOf(currentTenant));
                }
                org.springframework.http.HttpEntity<Map<String, Object>> requestEntity = new org.springframework.http.HttpEntity<>(withdrawalRequest, headers);

                restTemplate.postForEntity(savingsServiceUrl, requestEntity, Object.class);
            } catch (Exception e) {
                throw new RuntimeException("Failed to debit savings account for loan repayment: " + e.getMessage(), e);
            }
        }


        return repayment;
    }

    // ── Field Collection Handover ──────────────────────────────────────────────
    public java.math.BigDecimal getFieldCollectionBalance(String username) {
        List<com.hmcs.loan.entity.PendingFieldCollection> pending = pendingFieldCollectionRepository.findByFieldOfficerUsernameAndStatus(username, "PENDING");
        return pending.stream().map(com.hmcs.loan.entity.PendingFieldCollection::getAmount).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
    }

    public List<com.hmcs.loan.entity.PendingFieldCollection> getPendingFieldCollections(Long branchId) {
        return pendingFieldCollectionRepository.findByBranchId(branchId);
    }

    public List<com.hmcs.loan.entity.PendingFieldCollection> getFieldCollectionHistory(String username) {
        return pendingFieldCollectionRepository.findByFieldOfficerUsernameOrderByCreatedAtDesc(username);
    }

    @Transactional
    public com.hmcs.loan.entity.PendingFieldCollection recordFieldCollection(UUID loanId, java.math.BigDecimal amount, String username, Long branchId) {
        com.hmcs.loan.entity.PendingFieldCollection pfc = new com.hmcs.loan.entity.PendingFieldCollection();
        pfc.setLoanId(loanId);
        pfc.setFieldOfficerUsername(username);
        pfc.setAmount(amount);
        pfc.setStatus("PENDING");
        pfc.setBranchId(branchId != null ? branchId : 1L);
        return pendingFieldCollectionRepository.save(pfc);
    }

    @Transactional
    public void handoverFieldCash(String fieldOfficerUsername, java.math.BigDecimal amount, String tellerUsername, Integer branchId) {
        List<com.hmcs.loan.entity.PendingFieldCollection> pending = pendingFieldCollectionRepository.findByFieldOfficerUsernameAndStatus(fieldOfficerUsername, "PENDING");
        java.math.BigDecimal totalPending = pending.stream().map(com.hmcs.loan.entity.PendingFieldCollection::getAmount).reduce(java.math.BigDecimal.ZERO, java.math.BigDecimal::add);
        
        if (totalPending.compareTo(amount) < 0) {
            throw new RuntimeException("Handover amount exceeds field cash balance.");
        }

        // Mark all pending collections as HANDED_OVER (do NOT auto-pay installments)
        // Loan installments must be recorded manually from the Loan Accounts tab.
        for (com.hmcs.loan.entity.PendingFieldCollection pfc : pending) {
            pfc.setStatus("HANDED_OVER");
            pendingFieldCollectionRepository.save(pfc);
        }

        // Move the cash from FIELD_CASH to CASH_IN_VAULT in the ledger
        String fieldAccount = "FIELD_CASH_" + fieldOfficerUsername.toUpperCase();
        LedgerEntry entry = new LedgerEntry();
        entry.setEntryDate(java.time.LocalDate.now());
        entry.setDescription("Field Cash Handover by " + fieldOfficerUsername);
        entry.setDebitAccount("CASH_IN_VAULT");
        entry.setCreditAccount(fieldAccount);
        entry.setAmount(totalPending);
        entry.setEntryType("FIELD_CASH_HANDOVER");
        entry.setPaymentMethod("CASH");
        entry.setBranchId(branchId != null ? branchId : 1);
        entry.setCreatedBy(tellerUsername != null ? tellerUsername : fieldOfficerUsername);
        ledgerEntryRepository.save(entry);
    }

    @org.springframework.transaction.annotation.Transactional
    public void editRepaymentAndRebuildLedger(UUID entryId, BigDecimal newAmount, String reason, String actorUsername) {
        LedgerEntry initialEntry = ledgerEntryRepository.findById(entryId).orElse(null);
        if (initialEntry == null) {
            List<LedgerEntry> byRef = ledgerEntryRepository.findByReferenceNumber(entryId.toString());
            if (byRef != null && !byRef.isEmpty()) {
                initialEntry = byRef.stream()
                        .filter(e -> "REPAYMENT_CASH_IN".equals(e.getEntryType()) || "DISBURSEMENT".equals(e.getEntryType()))
                        .findFirst()
                        .orElse(byRef.get(0));
            }
        }
        if (initialEntry == null) {
            throw new RuntimeException("Ledger transaction not found: " + entryId);
        }

        BigDecimal oldAmount = initialEntry.getAmount();
        UUID auditTxId = entryId;
        Integer branchId = initialEntry.getBranchId() != null ? initialEntry.getBranchId() : 1;
        Integer tenantId = com.hmcs.loan.multitenancy.TenantContext.getTenantId();
        if (tenantId == null || tenantId == 0) tenantId = 1;

        if ("REPAYMENT_CASH_IN".equals(initialEntry.getEntryType()) && initialEntry.getReferenceNumber() != null) {
            try {
                UUID repaymentId = UUID.fromString(initialEntry.getReferenceNumber());
                LoanRepayment repayment = loanRepaymentRepository.findById(repaymentId).orElse(null);
                if (repayment != null) {
                    oldAmount = repayment.getTotalPaid();
                    auditTxId = repayment.getId();
                    
                    List<LedgerEntry> entries = ledgerEntryRepository.findByReferenceNumber(initialEntry.getReferenceNumber());
                    ledgerEntryRepository.deleteAll(entries);
                    
                    UUID loanId = repayment.getLoanId();
                    Loan loan = loanRepository.findById(loanId).orElseThrow(() -> new RuntimeException("Loan not found"));
                    String method = repayment.getPaymentMethod() != null ? repayment.getPaymentMethod().name() : "CASH";
                    Integer payBranchId = repayment.getPaymentBranchId() != null ? Math.toIntExact(repayment.getPaymentBranchId()) : 1;
                    
                    List<LoanRepayment> allRepayments = loanRepaymentRepository.findByLoanIdOrderByPaymentDateAsc(loanId);
                    BigDecimal totalPrincipalPaidBefore = BigDecimal.ZERO;
                    java.time.LocalDate lastDate = loan.getDisbursementDate() != null ? loan.getDisbursementDate().toLocalDate() : loan.getAppliedDate();
                    for (LoanRepayment r : allRepayments) {
                        if (r.getId().equals(repayment.getId())) break;
                        totalPrincipalPaidBefore = totalPrincipalPaidBefore.add(r.getPrincipalPortion());
                        lastDate = r.getPaymentDate().toLocalDate();
                    }
                    
                    BigDecimal outstandingPrincipal = loan.getRequestedAmount().subtract(totalPrincipalPaidBefore);
                    if (outstandingPrincipal.compareTo(BigDecimal.ZERO) < 0) outstandingPrincipal = BigDecimal.ZERO;
                    
                    long daysElapsed = java.time.temporal.ChronoUnit.DAYS.between(lastDate, repayment.getPaymentDate().toLocalDate());
                    if (daysElapsed < 0) daysElapsed = 0;
                    
                    BigDecimal dailyRate = loan.getInterestRate().divide(BigDecimal.valueOf(36500), 10, java.math.RoundingMode.HALF_UP);
                    BigDecimal interestPortion = outstandingPrincipal.multiply(BigDecimal.valueOf(daysElapsed)).multiply(dailyRate);
                    BigDecimal principalPortion;
                    
                    if (newAmount.compareTo(interestPortion) <= 0) {
                        interestPortion = newAmount;
                        principalPortion = BigDecimal.ZERO;
                    } else {
                        principalPortion = newAmount.subtract(interestPortion);
                    }

                    repayment.setTotalPaid(newAmount);
                    repayment.setPrincipalPortion(principalPortion);
                    repayment.setInterestPortion(interestPortion);
                    loanRepaymentRepository.save(repayment);
                    
                    String debitAccount = "SAVINGS_TRANSFER".equalsIgnoreCase(method) ? "SAVINGS_DEPOSITS" : 
                                          "FIELD_COLLECTION".equalsIgnoreCase(method) ? "FIELD_CASH_" + actorUsername.toUpperCase() : 
                                          "CASH_IN_VAULT";
                    
                    java.time.LocalDateTime origTimestamp = repayment.getPaymentDate() != null ? repayment.getPaymentDate() : java.time.LocalDateTime.now();
                    java.time.LocalDate entryDate = origTimestamp.toLocalDate();
                    
                    LedgerEntry cashIn = new LedgerEntry();
                    cashIn.setLoanId(loanId);
                    cashIn.setReferenceNumber(repayment.getId().toString());
                    cashIn.setEntryDate(entryDate);
                    cashIn.setCreatedAt(origTimestamp);
                    cashIn.setDescription("Loan Repayment (Cash In) — " + loan.getAccountNumber());
                    cashIn.setDebitAccount(debitAccount);
                    cashIn.setCreditAccount("LOAN_REPAYMENT_CLEARING");
                    cashIn.setAmount(newAmount);
                    cashIn.setEntryType("REPAYMENT_CASH_IN");
                    cashIn.setPaymentMethod(method);
                    cashIn.setBranchId(payBranchId);
                    cashIn.setCreatedBy(actorUsername);
                    ledgerEntryRepository.save(cashIn);

                    LedgerEntry principalDeduction = new LedgerEntry();
                    principalDeduction.setLoanId(loanId);
                    principalDeduction.setReferenceNumber(repayment.getId().toString());
                    principalDeduction.setEntryDate(entryDate);
                    principalDeduction.setCreatedAt(origTimestamp);
                    principalDeduction.setDescription("Loan Principal Deduction — " + loan.getAccountNumber());
                    principalDeduction.setDebitAccount("LOAN_REPAYMENT_CLEARING");
                    principalDeduction.setCreditAccount("LOAN_RECEIVABLE");
                    principalDeduction.setAmount(principalPortion);
                    principalDeduction.setEntryType("REPAYMENT_PRINCIPAL");
                    principalDeduction.setPaymentMethod(method);
                    principalDeduction.setBranchId(payBranchId);
                    principalDeduction.setCreatedBy(actorUsername);
                    ledgerEntryRepository.save(principalDeduction);

                    if (interestPortion.compareTo(BigDecimal.ZERO) > 0) {
                        LedgerEntry interestIncome = new LedgerEntry();
                        interestIncome.setLoanId(loanId);
                        interestIncome.setReferenceNumber(repayment.getId().toString());
                        interestIncome.setEntryDate(entryDate);
                        interestIncome.setCreatedAt(origTimestamp);
                        interestIncome.setDescription("Loan Interest Income — " + loan.getAccountNumber());
                        interestIncome.setDebitAccount("LOAN_REPAYMENT_CLEARING");
                        interestIncome.setCreditAccount("INTEREST_INCOME");
                        interestIncome.setAmount(interestPortion);
                        interestIncome.setEntryType("REPAYMENT_INTEREST");
                        interestIncome.setPaymentMethod(method);
                        interestIncome.setBranchId(payBranchId);
                        interestIncome.setCreatedBy(actorUsername);
                        ledgerEntryRepository.save(interestIncome);
                    }
                } else {
                    initialEntry.setAmount(newAmount);
                    ledgerEntryRepository.save(initialEntry);
                }
            } catch (Exception e) {
                initialEntry.setAmount(newAmount);
                ledgerEntryRepository.save(initialEntry);
            }
        } else if ("DISBURSEMENT".equals(initialEntry.getEntryType())) {
            initialEntry.setAmount(newAmount);
            ledgerEntryRepository.save(initialEntry);
            if (initialEntry.getLoanId() != null) {
                Loan loan = loanRepository.findById(initialEntry.getLoanId()).orElse(null);
                if (loan != null) {
                    loan.setDisbursedAmount(newAmount);
                    loan.setRequestedAmount(newAmount);
                    loan.setApprovedAmount(newAmount);
                    loanRepository.save(loan);

                    // Rebuild EMI Schedule
                    try {
                        List<LoanSchedule> oldSchedule = loanScheduleRepository.findByLoanIdOrderByInstallmentNumberAsc(loan.getLoanId());
                        loanScheduleRepository.deleteAll(oldSchedule);

                        Integer termMonths = null;
                        if (loan.getApplicationData() != null) {
                            try {
                                Map<String, Object> appData = loan.getApplicationData();
                                if (appData.containsKey("repaymentPeriodMonths")) {
                                    termMonths = Integer.parseInt(appData.get("repaymentPeriodMonths").toString());
                                }
                            } catch (Exception ignored) {}
                        }
                        if (termMonths == null) termMonths = 12;

                        List<Map<String, Object>> scheduleData = generateRepaymentSchedule(
                            loan.getDisbursedAmount(), 
                            termMonths, 
                            loan.getInterestRate(), 
                            loan.getDisbursementDate() != null ? loan.getDisbursementDate().toLocalDate() : loan.getAppliedDate()
                        );
                        
                        for (Map<String, Object> row : scheduleData) {
                            LoanSchedule schedule = new LoanSchedule();
                            schedule.setLoanId(loan.getLoanId());
                            schedule.setInstallmentNumber((Integer) row.get("installmentNo"));
                            schedule.setDueDate(LocalDate.parse(row.get("dueDate").toString()));
                            schedule.setExpectedPrincipal((BigDecimal) row.get("principalPortion"));
                            schedule.setExpectedInterest((BigDecimal) row.get("interestPortion"));
                            schedule.setTotalExpectedAmount((BigDecimal) row.get("emi"));
                            schedule.setOutstandingBalance((BigDecimal) row.get("outstandingBalance"));
                            schedule.setStatus(LoanSchedule.ScheduleStatus.PENDING);
                            loanScheduleRepository.save(schedule);
                        }
                    } catch (Exception ex) {
                        System.err.println("Error rebuilding schedule on transaction edit: " + ex.getMessage());
                    }
                }
            }
        } else {
            initialEntry.setAmount(newAmount);
            ledgerEntryRepository.save(initialEntry);
        }

        String dynamicModuleType = "LOANS";
        String entryType = initialEntry.getEntryType();
        String desc = initialEntry.getDescription();
        if ("REPAYMENT_CASH_IN".equals(entryType) || "REPAYMENT_PRINCIPAL".equals(entryType) || "REPAYMENT_INTEREST".equals(entryType) || (desc != null && desc.contains("Repayment"))) {
            dynamicModuleType = "LOAN_REPAYMENT";
        } else if ("DISBURSEMENT".equals(entryType) || (desc != null && (desc.contains("Disbursement") || desc.contains("ලබාදීම්")))) {
            dynamicModuleType = "LOAN_DISBURSEMENT";
        }

        try {
            String sql = "INSERT INTO audit_service.audit_corrections (correction_id, transaction_id, old_amount, new_amount, module_type, manager_id, reason, timestamp, tenant_id) VALUES (gen_random_uuid(), ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)";
            jdbcTemplate.update(sql, auditTxId, oldAmount, newAmount, dynamicModuleType, actorUsername, reason, branchId);
        } catch (Exception e) {
            try {
                String altSql = "INSERT INTO audit_service.audit_corrections (transaction_id, old_amount, new_amount, module_type, manager_id, reason, timestamp, tenant_id) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, ?)";
                jdbcTemplate.update(altSql, auditTxId, oldAmount, newAmount, dynamicModuleType, actorUsername, reason, branchId);
            } catch (Exception ex) {
                System.err.println("Failed to insert into audit_corrections: " + ex.getMessage());
            }
        }
    }
}

