import axios from 'axios';
import { getCurrentUser, filterByBranch } from './auth.service';

export const API_URL = 'http://localhost:8080/api/v1/';

const authHeader = () => {
  const user = getCurrentUser();
  return user?.token ? { Authorization: 'Bearer ' + user.token } : {};
};

export interface SchedulerLog {
  id: string;
  taskName: string;
  executionTime: string;
  status: string;
  details: string;
}

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
  isMigration?: boolean;
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
  const user = getCurrentUser();
  const overrideBranchId = localStorage.getItem('overrideBranchId');
  const bId = (user?.role === 'ORGANIZATION_ADMIN' && overrideBranchId) ? overrideBranchId : user?.branchId;
  const url = bId ? `${API_URL}members?branchId=${bId}` : `${API_URL}members`;
  const res = await axios.get(url, { headers: authHeader() });
  return filterByBranch(res.data);
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
  return filterByBranch(res.data);
};

export const getGlobalAccounts = async (): Promise<AccountData[]> => {
  const res = await axios.get(API_URL + 'savings', { headers: authHeader() });
  return res.data;
};

export const openAccount = async (data: { memberId: string; accountType: string; initialDeposit: number; openedDate?: string; childName?: string; childBirthCertificate?: string; childDateOfBirth?: string }): Promise<AccountData> => {
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

export const updateAccountStatus = async (accountId: string, status: string): Promise<any> => {
  const res = await axios.put(`${API_URL}accounts/${accountId}/status`, { status }, { headers: authHeader() });
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

export const processFixedDepositInterest = () => {
  return axios.post(`${API_URL}savings/fixed-deposit/trigger`, {}, { headers: authHeader() });
};

export const getSchedulerStatus = () => {
  return axios.get<Record<string, SchedulerLog>>(`${API_URL}savings/scheduler-status`, { headers: authHeader() });
};

export const deleteFixedDepositType = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}fixed-deposit-types/${id}`, { headers: authHeader() });
};

export const deleteFixedDeposit = async (id: string): Promise<void> => {
  await axios.delete(`${API_URL}fixed-deposits/${id}`, { headers: authHeader() });
};

export const updateFixedDepositStatus = async (id: string, status: string): Promise<any> => {
  const res = await axios.put(`${API_URL}fixed-deposits/${id}/status`, { status }, { headers: authHeader() });
  return res.data;
};

export const renewFixedDeposit = async (id: string, data: any): Promise<any> => {
  const res = await axios.post(`${API_URL}fixed-deposits/${id}/renew`, data, { headers: authHeader() });
  return res.data;
};

export const updateFixedDepositType = async (id: string, data: any): Promise<any> => {
  const response = await axios.put(`${API_URL}fixed-deposit-types/${id}`, data, { headers: authHeader() });
  return response.data;
};

// --- Fixed Deposits API ---
// Returns ONLY current branch fixed deposits
export const getFixedDeposits = async (): Promise<any[]> => {
  const response = await axios.get(`${API_URL}fixed-deposits?branchOnly=true`, { headers: authHeader() });
  return filterByBranch(response.data);
};

// Returns ALL fixed deposits (cross-branch)
export const getGlobalFixedDeposits = async (): Promise<any[]> => {
  const response = await axios.get(`${API_URL}fixed-deposits`, { headers: authHeader() });
  return response.data;
};

export const releaseFixedDeposit = async (id: string, targetAccountId?: string): Promise<any> => {
  let url = `${API_URL}fixed-deposits/${id}/release`;
  if (targetAccountId) {
    url += `?targetAccountId=${targetAccountId}`;
  }
  const response = await axios.post(url, {}, { headers: authHeader() });
  return response.data;
};

// --- Branch Activities ---
export const getBranchActivities = async (date?: string): Promise<any[]> => {
  const params = date ? { date } : {};
  const response = await axios.get(`${API_URL}branch/activities`, { headers: authHeader(), params });
  return filterByBranch(response.data);
};

// --- Notifications ---
export const getBranchNotifications = async (): Promise<any[]> => {
  const response = await axios.get(`${API_URL}branch/notifications`, { headers: authHeader() });
  return filterByBranch(response.data);
};

export const getActivityDetails = async (type: string, id: string): Promise<any> => {
  const response = await axios.get(`${API_URL}branch/activity-details/${type}/${id}`, { headers: authHeader() });
  return response.data;
};
