import axios from 'axios';

const API_URL = 'http://localhost:8080/api/v1/auth/';

export const authHeader = (overrideTenantId?: number) => {
  const user = getCurrentUser();
  const headers: Record<string, string> = user?.token ? { Authorization: 'Bearer ' + user.token } : {};
  if (overrideTenantId !== undefined) {
    headers['X-Tenant-ID'] = overrideTenantId.toString();
  }
  return headers;
};

// Add a global interceptor to handle expired tokens
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If we get an unauthorized response, the token is likely expired.
      const currentUrl = window.location.pathname;
      if (currentUrl !== '/' && currentUrl !== '/login') {
        localStorage.removeItem('user');
        window.location.href = '/login?expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export const getTenantCode = (): string => {
  const hostname = window.location.hostname;
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'hikkaduwa'; // Default tenant for local development
  }
  return hostname.split('.')[0];
};

export const login = async (username: string, password: string) => {
  const response = await axios.post(API_URL + 'login', {
    username,
    password,
  });
  if (response.data.token) {
    const userObj = {
      ...response.data,
      tenantId: response.data.tenantId
    };
    localStorage.setItem('user', JSON.stringify(userObj));
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem('user');
};

export const getCurrentUser = () => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    const overrideBranchId = localStorage.getItem('overrideBranchId');
    if (overrideBranchId && (user.role === 'ORGANIZATION_ADMIN' || user.role === 'AUDITOR')) {
      user.branchId = overrideBranchId.includes(':') ? parseInt(overrideBranchId.split(':').pop() || '1', 10) : parseInt(overrideBranchId, 10);
    } else if (typeof user.branchId === 'string' && user.branchId.includes(':')) {
      user.branchId = parseInt(user.branchId.split(':').pop() || '1', 10);
    } else if (typeof user.branchId === 'string') {
      user.branchId = parseInt(user.branchId, 10);
    }
    return user;
  }
  return null;
};

export const filterByBranch = (data: any[]) => {
  const userStr = localStorage.getItem('user');
  const overrideBranchId = localStorage.getItem('overrideBranchId');
  if (userStr && overrideBranchId) {
    const user = JSON.parse(userStr);
    if (user.role === 'ORGANIZATION_ADMIN' || user.role === 'AUDITOR') {
      const bId = parseInt(overrideBranchId, 10);
      return data.filter(item => {
        const itemBranchId = item.branchId !== undefined ? item.branchId : item.registeredBranchId;
        return itemBranchId === bId;
      });
    }
  }
  return data;
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

export const getUsers = async (overrideTenantId?: number): Promise<UserDTO[]> => {
  const response = await axios.get(API_URL + 'users', { headers: authHeader(overrideTenantId) });
  return response.data;
};

export const createUser = async (user: UserDTO, overrideTenantId?: number): Promise<UserDTO> => {
  const response = await axios.post(API_URL + 'users', user, { headers: authHeader(overrideTenantId) });
  return response.data;
};

export const createLoanCommittee = async (organizationId: number, data: any): Promise<any> => {
  const response = await axios.post(API_URL + `organizations/${organizationId}/committees`, data, { headers: authHeader() });
  return response.data;
};

export const updateOrganizationStatus = async (organizationId: number, status: string): Promise<any> => {
  const response = await axios.put(API_URL + `organizations/${organizationId}/status`, { status }, { headers: authHeader() });
  return response.data;
};

export const updateUser = async (userId: string, user: UserDTO, overrideTenantId?: number): Promise<UserDTO> => {
  const response = await axios.put(API_URL + 'users/' + userId, user, { headers: authHeader(overrideTenantId) });
  return response.data;
};

export const deleteUser = async (userId: string, overrideTenantId?: number): Promise<void> => {
  await axios.delete(API_URL + 'users/' + userId, { headers: authHeader(overrideTenantId) });
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
