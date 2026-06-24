import axios from 'axios';

const API_URL = 'http://localhost:8085/api/pawning/tickets'; // We'll configure proxy later if needed, or point directly to port

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
