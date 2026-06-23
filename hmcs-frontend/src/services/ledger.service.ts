import axios from 'axios';
import { getCurrentUser } from './auth.service';

const BASE = 'http://localhost:8080/api/v1/ledger';

const authHeader = () => {
  const user = getCurrentUser();
  return user?.token ? { Authorization: 'Bearer ' + user.token } : {};
};

export interface LedgerEntry {
  entryId: string;
  loanId?: string;
  referenceNumber?: string;
  entryDate: string;
  description: string;
  debitAccount: string;
  creditAccount: string;
  amount: number;
  entryType: string;
  paymentMethod?: string;
  branchId?: number;
  createdBy?: string;
  createdAt: string;
}

// All entries — for General Manager / System Admin
export const getAllLedgerEntries = async (): Promise<LedgerEntry[]> => {
  const res = await axios.get(BASE, { headers: authHeader() });
  return res.data;
};

// Branch-specific — for Branch Manager
export const getBranchLedger = async (branchId: number): Promise<LedgerEntry[]> => {
  const res = await axios.get(`${BASE}/branch/${branchId}`, { headers: authHeader() });
  return res.data;
};

// Entries for one loan
export const getLoanLedger = async (loanId: string): Promise<LedgerEntry[]> => {
  const res = await axios.get(`${BASE}/loan/${loanId}`, { headers: authHeader() });
  return res.data;
};

// Date range filter
export const getLedgerByRange = async (
  from: string,
  to: string,
  branchId?: number
): Promise<LedgerEntry[]> => {
  const params: any = { from, to };
  if (branchId) params.branchId = branchId;
  const res = await axios.get(`${BASE}/range`, { headers: authHeader(), params });
  return res.data;
};

// Human-readable labels for GL account codes
export const GL_ACCOUNT_LABELS: Record<string, string> = {
  LOAN_RECEIVABLE:  'ණය ලෙජරය (Loan Receivable)',
  CASH_IN_VAULT:    'අත් මුදල් (Cash in Vault)',
  SAVINGS_DEPOSITS: 'ඉතුරුම් තැන්පතු (Savings Deposits)',
  INTEREST_INCOME:  'පොලී ආදායම (Interest Income)',
  SHARE_CAPITAL:    'කොටස් ප්‍රාග්ධනය (Share Capital)',
};
