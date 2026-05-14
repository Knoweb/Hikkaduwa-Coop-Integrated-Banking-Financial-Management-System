import axios from 'axios';
import { getCurrentUser } from './auth.service';

const API_URL = 'http://localhost:8082/api/v1/accounts/';

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
  memberId?: number;
  fullName: string;
  nic: string;
  address: string;
  contactNumber: string;
  dateOfBirth: string;
  status?: string;
  createdAt?: string;
}

export const registerMember = async (memberData: MemberData) => {
  const response = await axios.post(API_URL + 'members/register', memberData, {
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
