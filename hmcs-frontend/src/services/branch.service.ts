import axios from 'axios';
import { getCurrentUser } from './auth.service';

const API_URL = 'http://localhost:8080/api/v1/auth/branches';

const authHeader = () => {
  const user = getCurrentUser();
  return user?.token ? { Authorization: 'Bearer ' + user.token } : {};
};

export interface BranchDTO {
  branchId?: number;
  branchName: string;
  location: string;
  status: string;
}

export const getBranches = async (): Promise<BranchDTO[]> => {
  const response = await axios.get(API_URL, { headers: authHeader() });
  return response.data;
};

export const createBranch = async (branch: BranchDTO): Promise<BranchDTO> => {
  const response = await axios.post(API_URL, branch, { headers: authHeader() });
  return response.data;
};

export const updateBranch = async (id: number, branch: BranchDTO): Promise<BranchDTO> => {
  const response = await axios.put(`${API_URL}/${id}`, branch, { headers: authHeader() });
  return response.data;
};

export const deleteBranch = async (id: number): Promise<void> => {
  await axios.delete(`${API_URL}/${id}`, { headers: authHeader() });
};
