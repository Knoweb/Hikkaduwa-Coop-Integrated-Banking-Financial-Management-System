import axios from 'axios';
import { getCurrentUser } from './auth.service';

const API_URL = 'http://localhost:8080/api/v1/loans';

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
  // Disbursement fields
  accountNumber?: string;
  disbursementDate?: string;
  disbursedAmount?: number;
  disbursedBy?: string;
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
  const response = await axios.get(API_URL, { headers: authHeader() });
  return response.data;
};

export const getLoanById = async (id: string): Promise<Loan> => {
  const response = await axios.get(API_URL + '/' + id, { headers: authHeader() });
  return response.data;
};

export const getLoansByStatus = async (status: string): Promise<Loan[]> => {
  const response = await axios.get(API_URL + '/status/' + status, { headers: authHeader() });
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
  paymentMethod: 'CASH' | 'SAVINGS_TRANSFER' = 'CASH',
  savingsAccountNumber?: string
): Promise<Loan> => {
  const response = await axios.post(
    `${API_URL}/${loanId}/disburse`,
    { amount, actorUsername, paymentMethod, savingsAccountNumber },
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
  paymentMethod: 'CASH' | 'SAVINGS_TRANSFER',
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

// ── Stage Labels (for UI display) ─────────────────────────────────────────────

export const STAGE_LABELS: Record<string, { label: string; labelSi: string; role: string; color: string }> = {
  STAGE_1_MANAGER_APPROVAL:        { label: 'Manager Approval Awaiting',   labelSi: 'කළමනාකාර අනුමැතිය බලාපොරොත්තුවෙන්', role: 'BRANCH_MANAGER', color: 'bg-blue-100 text-blue-700' },
  STAGE_2_LOAN_COMMITTEE_APPROVAL: { label: 'Loan Committee Vote',         labelSi: 'ණය කමිටු ඡන්දය',                    role: 'LOAN_COMMITTEE', color: 'bg-amber-100 text-amber-700' },
  STAGE_3_APPROVED:                { label: 'Approved',                    labelSi: 'අනුමත කරන ලදී',                     role: 'BRANCH_MANAGER', color: 'bg-emerald-100 text-emerald-700' },
};
