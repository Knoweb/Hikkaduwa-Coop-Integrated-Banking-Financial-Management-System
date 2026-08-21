import axios from 'axios';
import { getCurrentUser } from './auth.service';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/pawning/tickets` : '/api/v1/pawning/tickets';

const authHeader = () => {
  const user = getCurrentUser();
  return user?.token ? { Authorization: 'Bearer ' + user.token } : {};
};

export const getAllTickets = async () => {
  const res = await axios.get(API_URL, { headers: authHeader() });
  return res.data;
};

export const getTicketsByBranch = async (branchId: number) => {
  const res = await axios.get(`${API_URL}/branch/${branchId}`, { headers: authHeader() });
  return res.data;
};

export const getTicket = async (ticketId: string) => {
  const res = await axios.get(`${API_URL}/${ticketId}`, { headers: authHeader() });
  return res.data;
};

export const issueTicket = async (data: any) => {
  const res = await axios.post(API_URL, data, { headers: authHeader() });
  return res.data;
};

export const redeemTicket = async (ticketId: string) => {
  const res = await axios.post(`${API_URL}/${ticketId}/redeem`, {}, { headers: authHeader() });
  return res.data;
};

export const approveTicket = async (ticketId: string, data: { assessedValue: number, remarks: string }) => {
  const res = await axios.post(`${API_URL}/${ticketId}/approve`, data, { headers: authHeader() });
  return res.data;
};

export const disburseTicket = async (ticketId: string, advanceAmount: number) => {
  const res = await axios.post(`${API_URL}/${ticketId}/disburse`, { advanceAmount }, { headers: authHeader() });
  return res.data;
};

export const makePayment = async (ticketId: string, amount: number, date?: string) => {
  const payload: any = { amount };
  if (date) payload.date = date;
  const res = await axios.post(`${API_URL}/${ticketId}/payments`, payload, { headers: authHeader() });
  return res.data;
};

export const getAllSettings = async () => {
  const res = await axios.get(`${API_URL.replace('/tickets', '/settings')}`, { headers: authHeader() });
  return res.data;
};

export const updateSetting = async (key: string, value: string, description?: string) => {
  const res = await axios.put(`${API_URL.replace('/tickets', '/settings')}/${key}`, { settingValue: value, description }, { headers: authHeader() });
  return res.data;
};

export const getBranchTransactions = async (branchId: number) => {
  const res = await axios.get(`${API_URL}/transactions/branch/${branchId}`, { headers: authHeader() });
  return res.data;
};
