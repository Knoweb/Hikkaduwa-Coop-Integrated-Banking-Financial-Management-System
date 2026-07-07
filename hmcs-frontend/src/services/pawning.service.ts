import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/pawning/tickets` : 'http://localhost:8080/api/v1/pawning/tickets';

export const getTicketsByBranch = async (branchId: number) => {
  const token = localStorage.getItem('hmcs_token');
  const res = await axios.get(`${API_URL}/branch/${branchId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getTicket = async (ticketId: string) => {
  const token = localStorage.getItem('hmcs_token');
  const res = await axios.get(`${API_URL}/${ticketId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const issueTicket = async (data: any) => {
  const token = localStorage.getItem('hmcs_token');
  const res = await axios.post(API_URL, data, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const redeemTicket = async (ticketId: string) => {
  const token = localStorage.getItem('hmcs_token');
  const res = await axios.post(`${API_URL}/${ticketId}/redeem`, {}, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const makePayment = async (ticketId: string, amount: number, date?: string) => {
  const token = localStorage.getItem('hmcs_token');
  const payload: any = { amount };
  if (date) payload.date = date;
  const res = await axios.post(`${API_URL}/${ticketId}/payments`, payload, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getAllSettings = async () => {
  const token = localStorage.getItem('hmcs_token');
  const res = await axios.get(`${API_URL.replace('/tickets', '/settings')}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const updateSetting = async (key: string, value: string, description?: string) => {
  const token = localStorage.getItem('hmcs_token');
  const res = await axios.put(`${API_URL.replace('/tickets', '/settings')}/${key}`, { settingValue: value, description }, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};

export const getBranchTransactions = async (branchId: number) => {
  const token = localStorage.getItem('hmcs_token');
  const res = await axios.get(`${API_URL}/transactions/branch/${branchId}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  return res.data;
};
