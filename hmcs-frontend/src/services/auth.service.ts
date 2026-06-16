import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1/auth/';

const authHeader = () => {
  const user = getCurrentUser();
  return user?.token ? { Authorization: 'Bearer ' + user.token } : {};
};

// Add a global interceptor to handle expired tokens
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      // If we get an unauthorized or forbidden response, the token is likely expired.
      const currentUrl = window.location.pathname;
      if (currentUrl !== '/' && currentUrl !== '/login') {
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

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
  const response = await axios.get(API_URL + 'users', { headers: authHeader() });
  return response.data;
};

export const createUser = async (user: UserDTO): Promise<UserDTO> => {
  const response = await axios.post(API_URL + 'users', user, { headers: authHeader() });
  return response.data;
};

export const updateUser = async (userId: string, user: UserDTO): Promise<UserDTO> => {
  const response = await axios.put(API_URL + 'users/' + userId, user, { headers: authHeader() });
  return response.data;
};

export const deleteUser = async (userId: string): Promise<void> => {
  await axios.delete(API_URL + 'users/' + userId, { headers: authHeader() });
};

export interface RoleDTO {
  roleId: number;
  roleName: string;
  description?: string;
}

export const getRoles = async (): Promise<RoleDTO[]> => {
  const response = await axios.get(API_URL + 'users/roles', { headers: authHeader() });
  return response.data;
};
