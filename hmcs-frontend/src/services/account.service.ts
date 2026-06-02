import axios from 'axios';
import { getCurrentUser } from './auth.service';

const API_URL = 'http://localhost:8080/api/v1/';

// Interceptor or simple helper to add auth header
const authHeader = () => {
  const user = getCurrentUser();
  if (user && user.token) {
    return { Authorization: 'Bearer ' + user.token };
  } else {
    return {};
  }
};

export interface MemberData {
  memberId?: string;
  fullName: string;
  nic: string;
  address: string;
  contactNumber: string;
  dateOfBirth: string;
  status?: string;
  createdAt?: string;
}

export const registerMember = async (memberData: MemberData) => {
  const response = await axios.post(API_URL + 'members', memberData, {
    headers: authHeader(),
  });
  return response.data;
};

export const searchMembers = async (query: string) => {
  const response = await axios.get(API_URL + 'members/search?q=' + encodeURIComponent(query), {
    headers: authHeader(),
  });
  return response.data;
};

export const getMembers = async () => {
  const response = await axios.get(API_URL + 'members', {
    headers: authHeader(),
  });
  return response.data;
};

export interface AccountData {
  accountId?: number;
  accountNumber: string;
  memberId: string;
  accountType: string;
  balance: number;
  status: string;
  createdAt: string;
}

export const openAccount = async (accountData: { memberId: string, accountType: string, initialDeposit: number }) => {
  const response = await axios.post(API_URL + 'accounts', accountData, {
    headers: authHeader(),
  });
  return response.data;
};

export const getAccounts = async () => {
  const response = await axios.get(API_URL + 'savings', {
    headers: authHeader(),
  });
  return response.data;
};

export const deposit = async (data: { accountNumber: string, amount: number }) => {
  const response = await axios.post(API_URL + 'transactions/deposit', data, {
    headers: authHeader(),
  });
  return response.data;
};

export const withdraw = async (data: { accountNumber: string, amount: number }) => {
  const response = await axios.post(API_URL + 'transactions/withdraw', data, {
    headers: authHeader(),
  });
  return response.data;
};

export const getAdminSummary = async () => {
  const response = await axios.get(API_URL + 'admin/summary', {
    headers: authHeader(),
  });
  return response.data;
};
