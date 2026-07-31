import axios from 'axios';
import { getCurrentUser } from './auth.service';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/loans` : 'http://localhost:8080/api/v1/loans';

const authHeader = () => {
  const user = getCurrentUser();
  return user?.token ? { Authorization: 'Bearer ' + user.token } : {};
};

// ── Types ─────────────────────────────────────────────────────────────────────

export interface LoanType {
  loanTypeId: string;
  name: string;
  description: string;
  maxAmount: number;
  maxTermMonths: number;
  interestRate: number;
  isActive: boolean;
}

export interface Loan {
  loanId: string;
  memberId: string;
  loanType: LoanType;
  requestedAmount: number;
  approvedAmount?: number;
  interestRate: number;
  termMonths: number;
  branchId: number;
  currentStage: string;
  status: string;
  appliedDate: string;
  applicationData?: Record<string, any>;
  createdAt?: string;
  updatedAt?: string;
  // Disbursement fields
  accountNumber?: string;
  disbursementDate?: string;
  disbursedAmount?: number;
  disbursedBy?: string;
  // Field Officer fields
  evaluatorId?: string;
  evaluationStatus?: string;
  evaluationNotes?: string;
}

export interface LoanApprovalAction {
  actionId: string;
  loanId: string;
  stage: string;
  action: string;
  actorUsername: string;
  actorRole: string;
  comments: string;
  createdAt: string;
}

export interface EmiScheduleRow {
  installmentNo: number;
  dueDate: string;
  principalPortion: number;
  interestPortion: number;
  emi: number;
  outstandingBalance: number;
}

// ── Loan Types ────────────────────────────────────────────────────────────────

export const getLoanTypes = async (): Promise<LoanType[]> => {
  const response = await axios.get(API_URL + '/types', { headers: authHeader() });
  return response.data;
};

export const getAllLoanTypes = async (): Promise<LoanType[]> => {
  const response = await axios.get(API_URL + '/types?activeOnly=false', { headers: authHeader() });
  return response.data;
};

export const createLoanType = async (payload: Partial<LoanType>): Promise<LoanType> => {
  const response = await axios.post(API_URL + '/types', payload, { headers: authHeader() });
  return response.data;
};

export const updateLoanType = async (id: string, payload: Partial<LoanType>): Promise<LoanType> => {
  const response = await axios.put(API_URL + '/types/' + id, payload, { headers: authHeader() });
  return response.data;
};

export const deleteLoanType = async (id: string): Promise<void> => {
  await axios.delete(API_URL + '/types/' + id, { headers: authHeader() });
};

// ── Loan Applications ─────────────────────────────────────────────────────────

export const getLoans = async (): Promise<Loan[]> => {
  const user = getCurrentUser();
  
  if (user?.role === 'LOAN_COMMITTEE') {
    const response = await axios.get(API_URL, { headers: authHeader() });
    return response.data;
  }

  const overrideBranchId = localStorage.getItem('overrideBranchId');
  const bId = (user?.role === 'ORGANIZATION_ADMIN' && overrideBranchId) ? overrideBranchId : user?.branchId;
  const url = bId ? `${API_URL}?branchId=${bId}` : API_URL;
  const response = await axios.get(url, { headers: authHeader() });
  return response.data;
};

// Returns ALL loans (cross-branch)
export const getGlobalLoans = async (): Promise<Loan[]> => {
  const response = await axios.get(API_URL, { headers: authHeader() });
  return response.data;
};

export const getBranchLoans = async (branchId: number): Promise<Loan[]> => {
  const response = await axios.get(`${API_URL}?branchId=${branchId}`, { headers: authHeader() });
  return response.data;
};

export const getLoanById = async (id: string): Promise<Loan> => {
  const response = await axios.get(API_URL + '/' + id, { headers: authHeader() });
  return response.data;
};

export const deleteLoan = async (id: string): Promise<void> => {
  await axios.delete(API_URL + '/' + id, { headers: authHeader() });
};

export const getLoansByStatus = async (status: string): Promise<Loan[]> => {
  const response = await axios.get(API_URL + '/status/' + status, { headers: authHeader() });
  return response.data;
};

export const getInsuranceReportLoans = async (month: string): Promise<Loan[]> => {
  const response = await axios.get(`${API_URL}/reports/insurance?month=${month}`, { headers: authHeader() });
  return response.data;
};

export const applyForLoan = async (loanTypeId: string, payload: any): Promise<Loan> => {
  const response = await axios.post(API_URL + '/apply/' + loanTypeId, payload, { headers: authHeader() });
  return response.data;
};

// ── Approval Workflow ─────────────────────────────────────────────────────────

export const advanceLoanStage = async (
  loanId: string,
  actorUsername: string,
  actorRole: string,
  comments: string
): Promise<Loan> => {
  const response = await axios.post(
    `${API_URL}/${loanId}/advance`,
    { actorUsername, actorRole, comments },
    { headers: authHeader() }
  );
  return response.data;
};

export const rejectLoan = async (
  loanId: string,
  actorUsername: string,
  actorRole: string,
  comments: string
): Promise<Loan> => {
  const response = await axios.post(
    `${API_URL}/${loanId}/reject`,
    { actorUsername, actorRole, comments },
    { headers: authHeader() }
  );
  return response.data;
};

export const getLoanApprovalHistory = async (loanId: string): Promise<LoanApprovalAction[]> => {
  const response = await axios.get(`${API_URL}/${loanId}/history`, { headers: authHeader() });
  return response.data;
};

export const disburseLoan = async (
  loanId: string, 
  amount: number, 
  actorUsername: string, 
  paymentMethod: 'CASH' | 'SAVINGS_TRANSFER',
  savingsAccountNumber?: string,
  loanAccountNumber?: string
) => {
  const response = await axios.post(
    `${API_URL}/${loanId}/disburse`, 
    { amount, actorUsername, paymentMethod, savingsAccountNumber, loanAccountNumber },
    { headers: authHeader() }
  );
  return response.data;
};

export const getMemberSavingsAccounts = async (memberId: string): Promise<any[]> => {
  const user = getCurrentUser();
  const headers = user?.token ? { Authorization: 'Bearer ' + user.token } : {};
  const res = await axios.get('http://localhost:8080/api/v1/savings', { headers });
  return (res.data as any[]).filter(
    (acc: any) => acc.memberId === memberId && acc.status === 'ACTIVE'
  );
};

// ── EMI & Interest Calculations ───────────────────────────────────────────────

export const getRepaymentSchedule = async (
  principal: number,
  termMonths: number,
  annualRate: number,
  startDate?: string
): Promise<EmiScheduleRow[]> => {
  const response = await axios.get(`${API_URL}/schedule`, {
    headers: authHeader(),
    params: { principal, termMonths, annualRate, startDate }
  });
  return response.data;
};

export const calculateInterest = async (
  principal: number,
  days: number,
  rate: number
): Promise<{ principal: number; days: number; rate: number; interest: number; formula: string }> => {
  const response = await axios.get(`${API_URL}/calculate-interest`, {
    headers: authHeader(),
    params: { principal, days, rate }
  });
  return response.data;
};

// ── Repayments & Live Schedule ────────────────────────────────────────────────

export const getSavedSchedule = async (loanId: string): Promise<any[]> => {
  const response = await axios.get(`${API_URL}/${loanId}/saved-schedule`, { headers: authHeader() });
  return response.data;
};

export const getRepayments = async (loanId: string): Promise<any[]> => {
  const response = await axios.get(`${API_URL}/${loanId}/repayments`, { headers: authHeader() });
  return response.data;
};

export const repayInstallment = async (
  loanId: string,
  amount: number,
  paymentMethod: 'CASH' | 'SAVINGS_TRANSFER' | 'FIELD_COLLECTION',
  reference: string,
  actorUsername: string,
  paymentBranchId: number,
  paymentDate?: string
): Promise<any> => {
  const response = await axios.post(
    `${API_URL}/${loanId}/repay`,
    { amount, paymentMethod, reference, actorUsername, paymentBranchId, paymentDate },
    { headers: authHeader() }
  );
  return response.data;
};

export const recordFieldCollection = async (
  loanId: string,
  amount: number,
  username: string,
  branchId: number,
  date?: string
): Promise<any> => {
  const response = await axios.post(
    `${API_URL}/field-collection/collect`,
    { loanId, amount, username, branchId, date },
    { headers: authHeader() }
  );
  return response.data;
};

export const getPendingFieldCollections = async (branchId: number): Promise<any[]> => {
  const response = await axios.get(`${API_URL}/field-collection/pending/${branchId}`, { headers: authHeader() });
  return response.data;
};

export const getFieldCollectionHistory = async (username: string): Promise<any[]> => {
  const response = await axios.get(`${API_URL}/field-collection/history/${username}`, { headers: authHeader() });
  return response.data;
};

export const getBranchLedger = async (branchId: number): Promise<any[]> => {
  const response = await axios.get(`${API_URL.replace('/loans', '/ledger')}/branch/${branchId}`, { headers: authHeader() });
  return response.data;
};

export const getBranchTransactions = async (branchId: number): Promise<any[]> => {
  const response = await axios.get(`${API_URL}/transactions/branch/${branchId}`, { headers: authHeader() });
  return response.data;
};

// ── Stage Labels (for UI display) ─────────────────────────────────────────────

export const STAGE_LABELS: Record<string, { label: string; labelSi: string; role: string; color: string }> = {
  STAGE_1_MANAGER_APPROVAL:        { label: 'Manager Approval Awaiting',   labelSi: 'කළමනාකාර අනුමැතිය බලාපොරොත්තුවෙන්', role: 'BRANCH_MANAGER', color: 'bg-blue-100 text-blue-700' },
  STAGE_2_LOAN_COMMITTEE_APPROVAL: { label: 'Loan Committee Vote',         labelSi: 'ණය කමිටු අනුමැතිය සඳහා',                    role: 'LOAN_COMMITTEE', color: 'bg-amber-100 text-amber-700' },
  STAGE_3_APPROVED:                { label: 'Loan Committee Approved',     labelSi: 'ණය කමිටුව අනුමත කරන ලදී',            role: 'BRANCH_MANAGER', color: 'bg-emerald-100 text-emerald-700' },
  DISBURSED:                       { label: 'Disbursed',                   labelSi: 'මුදා හැර ඇත',                          role: '', color: 'bg-indigo-100 text-indigo-700' },
};

// ── Field Officer Workflows ───────────────────────────────────────────────────

export const assignEvaluator = async (loanId: string, evaluatorId: string): Promise<Loan> => {
  const response = await axios.post(
    `${API_URL}/${loanId}/assign-evaluator`,
    { evaluatorId },
    { headers: authHeader() }
  );
  return response.data;
};

export const submitEvaluation = async (loanId: string, evaluationStatus: string, evaluationNotes: string): Promise<Loan> => {
  const response = await axios.post(
    `${API_URL}/${loanId}/evaluate`,
    { evaluationStatus, evaluationNotes },
    { headers: authHeader() }
  );
  return response.data;
};

export const getLoansByEvaluatorId = async (evaluatorId: string): Promise<Loan[]> => {
  const response = await axios.get(`${API_URL}/evaluator/${evaluatorId}`, { headers: authHeader() });
  return response.data;
};

// ── Field Collection ──────────────────────────────────────────────────────────

export const getFieldCollectionBalance = async (username: string): Promise<number> => {
  const response = await axios.get(`${API_URL}/field-collection/balance/${username}`, { headers: authHeader() });
  return response.data.balance || 0;
};

export const handoverFieldCash = async (payload: { fieldOfficerUsername: string; amount: number; tellerUsername?: string; branchId?: number }): Promise<void> => {
  await axios.post(`${API_URL}/field-collection/handover`, payload, { headers: authHeader() });
};

export const updateLoanStatus = async (loanId: string, status: string): Promise<any> => {
  try {
    const overdueSet = new Set<string>(JSON.parse(localStorage.getItem('hmcs_overdue_loans') || '[]'));
    if (status === 'OVERDUE') {
      overdueSet.add(loanId);
    } else {
      overdueSet.delete(loanId);
    }
    localStorage.setItem('hmcs_overdue_loans', JSON.stringify(Array.from(overdueSet)));
  } catch (e) {}
  return { status, success: true };
};

