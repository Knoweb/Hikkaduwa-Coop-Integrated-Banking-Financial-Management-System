import axios from 'axios';
import { getCurrentUser } from './auth.service';

const API_URL = 'http://localhost:8080/api/v1/';

const authHeader = () => {
  const user = getCurrentUser();
  return user?.token ? { Authorization: 'Bearer ' + user.token } : {};
};

export interface MemberData {
  memberId?: string;
  fullName: string;
  nic: string;
  address: string;
  contactNumber: string;
  dateOfBirth: string;
  registeredBranchId?: number;
  status?: string;
  createdAt?: string;
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

export const openAccount = async (data: { memberId: string; accountType: string; initialDeposit: number }): Promise<AccountData> => {
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
