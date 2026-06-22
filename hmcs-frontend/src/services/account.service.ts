import axios from 'axios';
import { getCurrentUser } from './auth.service';

export const API_URL = 'http://localhost:8080/api/v1/';

const authHeader = () => {
  const user = getCurrentUser();
  return user?.token ? { Authorization: 'Bearer ' + user.token } : {};
};

export interface MemberData {
  memberId?: string;
  membershipNumber?: string;
  nic: string;
  nameWithInitials?: string;
  fullName: string;
  fullNameSinhala?: string;
  dateOfBirth: string;
  gender?: string;
  maritalStatus?: string;
  address: string;
  province?: string;
  contactNumber?: string;
  isMember?: boolean;
  registeredBranchId?: number;
  shareAmount?: number;
  numberOfShares?: number;
  belongsToOtherSociety?: boolean;
  otherSocietyName?: string;
  status?: string;
  createdAt?: string;
  birthCertificateNumber?: string;
  photographUrl?: string;
  digitalSignatureUrl?: string;
  membershipType?: string;
  deceasedDate?: string;
  insuranceClaimNotes?: string;
  ageCategory?: string;
  guardianNic?: string;
  guardianMemberNo?: string;
}

export interface AccountData {
  accountId?: string;
  accountNumber: string;
  memberId: string;
  memberId2?: string;
  memberId3?: string;
  accountType: string;
  accountMode?: string;
  modeOfOperation?: string;
  occupation1?: string;
  occupation2?: string;
  occupation3?: string;
  childName?: string;
  childBirthCertificate?: string;
  childDateOfBirth?: string;
  witnessName?: string;
  witnessAddress?: string;
  specimenSignature?: string;
  balance: number;
  initialDeposit?: number;
  branchId?: number;
  status: string;
  openedDate?: string;
  annualInterestRate?: number;
}

// ── Members ──────────────────────────────────────────────────────
// Returns ALL members (cross-branch) - used by Transaction Modal
export const getMembers = async (): Promise<MemberData[]> => {
  const res = await axios.get(API_URL + 'members', { headers: authHeader() });
  return res.data;
};

// Returns ONLY current branch members
export const getBranchMembers = async (): Promise<MemberData[]> => {
  const res = await axios.get(API_URL + 'members?branchOnly=true', { headers: authHeader() });
  return res.data;
};

export const getMemberById = async (id: string): Promise<MemberData> => {
  const res = await axios.get(API_URL + `members/${id}`, { headers: authHeader() });
  return res.data;
};

export const searchMembers = async (q: string): Promise<MemberData[]> => {
  const res = await axios.get(API_URL + 'members/search?q=' + encodeURIComponent(q), { headers: authHeader() });
  return res.data;
};

export const registerMember = async (data: MemberData): Promise<MemberData> => {
  const res = await axios.post(API_URL + 'members', data, { headers: authHeader() });
  return res.data;
};

// ── Accounts ──────────────────────────────────────────────────────
// Returns ALL accounts (cross-branch) - used by Transaction Modal
export const getAccounts = async (): Promise<AccountData[]> => {
  const res = await axios.get(API_URL + 'savings', { headers: authHeader() });
  return res.data;
};

// Returns ONLY current branch accounts - used by Ledger tables & Dashboards
export const getBranchAccounts = async (): Promise<AccountData[]> => {
  const res = await axios.get(API_URL + 'savings?branchOnly=true', { headers: authHeader() });
  return res.data;
};

export const getGlobalAccounts = async (): Promise<AccountData[]> => {
  const res = await axios.get(API_URL + 'savings', { headers: authHeader() });
  return res.data;
};

export const openAccount = async (data: { memberId: string; accountType: string; initialDeposit: number; childName?: string; childBirthCertificate?: string; childDateOfBirth?: string }): Promise<AccountData> => {
  const res = await axios.post(API_URL + 'accounts', data, { headers: authHeader() });
  return res.data;
};

// ── Transactions ──────────────────────────────────────────────────
export const deposit = async (data: { accountNumber: string; amount: number }): Promise<AccountData> => {
  const res = await axios.post(API_URL + 'transactions/deposit', data, { headers: authHeader() });
  return res.data;
};

export const withdraw = async (data: { accountNumber: string; amount: number; reference?: string; requestApproval?: boolean; managerUsername?: string; managerPassword?: string }): Promise<any> => {
  const res = await axios.post(API_URL + 'transactions/withdraw', data, { headers: authHeader() });
  return res.data;
};

export const getAdminSummary = async () => {
  const res = await axios.get(API_URL + 'admin/summary', { headers: authHeader() });
  return res.data;
};

// --- Savings Account Types API ---
export interface SavingsAccountType {
  id?: number;
  code: string;
  nameEn: string;
  nameSi: string;
  isChildAccount: boolean;
  interestRate?: number;
}

export const getSavingsAccountTypes = async (): Promise<SavingsAccountType[]> => {
  const response = await axios.get(`${API_URL}savings/account-types`, { headers: authHeader() });
  return response.data;
};

export const createSavingsAccountType = async (data: SavingsAccountType): Promise<SavingsAccountType> => {
  const response = await axios.post(`${API_URL}savings/account-types`, data, { headers: authHeader() });
  return response.data;
};

export const deleteSavingsAccountType = async (id: number): Promise<void> => {
  await axios.delete(API_URL + 'savings/account-types/' + id, { headers: authHeader() });
};

export const updateSavingsAccountTypeRate = async (id: number, interestRate: number): Promise<SavingsAccountType> => {
  const response = await axios.put(API_URL + 'savings/account-types/' + id + '/rate', { interestRate }, { headers: authHeader() });
  return response.data;
};

export const getPassbook = async (accountId: string): Promise<{ account: any; transactions: any[]; dailyBalances: any[] }> => {
  const res = await axios.get(API_URL + `savings/${accountId}/passbook`, { headers: authHeader() });
  return res.data;
};

// --- Pending Approvals API ---
export const getPendingApprovals = async (): Promise<any[]> => {
  const response = await axios.get(`${API_URL}savings/approvals`, { headers: authHeader() });
  return response.data;
};

export const approveTransaction = async (approvalId: string): Promise<any> => {
  const response = await axios.post(`${API_URL}savings/approvals/${approvalId}/approve`, {}, { headers: authHeader() });
  return response.data;
};

export const rejectTransaction = async (approvalId: string): Promise<any> => {
  const response = await axios.post(`${API_URL}savings/approvals/${approvalId}/reject`, {}, { headers: authHeader() });
  return response.data;
};

// --- Fixed Deposit Types API ---
export const getFixedDepositTypes = async (): Promise<any[]> => {
  const response = await axios.get(`${API_URL}fixed-deposit-types`, { headers: authHeader() });
  return response.data;
};

export const createFixedDepositType = async (data: any): Promise<any> => {
  const response = await axios.post(`${API_URL}fixed-deposit-types`, data, { headers: authHeader() });
  return response.data;
};

export const deleteFixedDepositType = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}fixed-deposit-types/${id}`, { headers: authHeader() });
};

export const updateFixedDepositType = async (id: string, data: any): Promise<any> => {
  const response = await axios.put(`${API_URL}fixed-deposit-types/${id}`, data, { headers: authHeader() });
  return response.data;
};

// --- Fixed Deposits API ---
export const getFixedDeposits = async (): Promise<any[]> => {
  const response = await axios.get(`${API_URL}fixed-deposits`, { headers: authHeader() });
  return response.data;
};
