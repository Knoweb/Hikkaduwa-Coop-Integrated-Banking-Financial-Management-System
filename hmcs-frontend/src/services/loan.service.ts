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

// ── EMI & Interest Calculations ───────────────────────────────────────────────

export const getRepaymentSchedule = async (
  principal: number,
  termMonths: number,
  annualRate: number
): Promise<EmiScheduleRow[]> => {
  const response = await axios.get(`${API_URL}/schedule`, {
    headers: authHeader(),
    params: { principal, termMonths, annualRate }
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

// ── Stage Labels (for UI display) ─────────────────────────────────────────────

export const STAGE_LABELS: Record<string, { label: string; labelSi: string; role: string; color: string }> = {
  STAGE_1_APPLICATION_SUBMITTED:       { label: 'Application Submitted',       labelSi: 'ඉල්ලීම ඉදිරිපත් කිරීම',    role: 'MEMBER/STAFF',         color: 'bg-slate-100 text-slate-700' },
  STAGE_2_FIELD_OFFICER_VERIFICATION:  { label: 'Field Officer Verification',  labelSi: 'ක්ෂේත්‍ර නිලධාරී සත්‍යාපනය', role: 'FIELD_OFFICER',         color: 'bg-blue-100 text-blue-700' },
  STAGE_3_REGIONAL_COMMITTEE:          { label: 'Regional Committee Review',   labelSi: 'ප්‍රාදේශීය කමිටු නිර්දේශය', role: 'SENIOR_OFFICER',        color: 'bg-indigo-100 text-indigo-700' },
  STAGE_4_BRANCH_MANAGER_RECOMMENDATION: { label: 'Branch Manager Recommendation', labelSi: 'ශාඛා කළමනාකාර නිර්දේශය', role: 'BRANCH_MANAGER',     color: 'bg-purple-100 text-purple-700' },
  STAGE_5_BANK_SERVICE_MANAGER:        { label: 'Bank Service Manager Directive', labelSi: 'ශාඛා සේවා කළමනාකාර නියෝගය', role: 'BANK_SERVICE_MANAGER', color: 'bg-pink-100 text-pink-700' },
  STAGE_6_LOAN_COMMITTEE_VOTE:         { label: 'Loan Committee Vote',         labelSi: 'ණය කමිටු ඡන්දය',            role: 'LOAN_COMMITTEE',        color: 'bg-amber-100 text-amber-700' },
  STAGE_7_CHAIRMAN_SECRETARY_SIGNATURE:{ label: 'Chairman & Secretary Sign',   labelSi: 'සභාපති හා ලේකම් අත්සන',    role: 'BRANCH_MANAGER',        color: 'bg-orange-100 text-orange-700' },
  STAGE_8_DISBURSEMENT:                { label: 'Disbursement',                labelSi: 'ණය ගෙවීම',                  role: 'TELLER/SENIOR_OFFICER', color: 'bg-green-100 text-green-700' },
};
