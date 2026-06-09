import axios from 'axios';
import { getCurrentUser } from './auth.service';

const API_URL = 'http://localhost:8080/api/v1/';

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
  accountType: string;
  balance: number;
  branchId?: number;
  status: string;
  openedDate?: string;
  childName?: string;
  childBirthCertificate?: string;
  childDateOfBirth?: string;
  annualInterestRate?: number;
}

// ── Members ──────────────────────────────────────────────────────
export const getMembers = async (): Promise<MemberData[]> => {
  const res = await axios.get(API_URL + 'members', { headers: authHeader() });
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
export const getAccounts = async (): Promise<AccountData[]> => {
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

export const withdraw = async (data: { accountNumber: string; amount: number }): Promise<AccountData> => {
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
  isChildAccount?: boolean;
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
  await axios.delete(`${API_URL}savings/account-types/${id}`, { headers: authHeader() });
};
