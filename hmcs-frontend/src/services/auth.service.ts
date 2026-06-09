import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1/auth/';

export const login = async (username: string, password: string) => {
  const response = await axios.post(API_URL + 'login', {
    username,
    password,
  });
  if (response.data.token) {
    localStorage.setItem('user', JSON.stringify(response.data));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) return JSON.parse(userStr);
  return null;
};

export interface UserDTO {
  userId?: string;
  username: string;
  fullName: string;
  role: string;
  branchId: number;
  status: string;
  password?: string;
}

export const getUsers = async (): Promise<UserDTO[]> => {
  const response = await axios.get(API_URL + 'users');
  return response.data;
};

export const createUser = async (user: UserDTO): Promise<UserDTO> => {
  const response = await axios.post(API_URL + 'users', user);
  return response.data;
};

export const updateUser = async (userId: string, user: UserDTO): Promise<UserDTO> => {
  const response = await axios.put(API_URL + 'users/' + userId, user);
  return response.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await axios.delete(API_URL + 'users/' + userId);
};
