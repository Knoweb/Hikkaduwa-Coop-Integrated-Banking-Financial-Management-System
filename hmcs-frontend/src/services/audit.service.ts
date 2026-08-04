import axios from 'axios';
import { authHeader } from './auth.service';

const API_URL = 'http://localhost:8080/api/v1/audit/comments';

export interface AuditComment {
  id: number;
  auditorUsername: string;
  auditorName: string;
  comment: string;
  tenantId: number;
  branchId?: number;
  status: string;
  createdAt: string;
  readAt?: string;
  readBy?: string;
}

class AuditService {
  async addComment(comment: string, branchId?: number): Promise<AuditComment> {
    const response = await axios.post(API_URL, { comment, branchId }, { headers: authHeader() });
    return response.data;
  }

  async getComments(): Promise<AuditComment[]> {
    const response = await axios.get(API_URL, { headers: authHeader() });
    return response.data;
  }

  async markAsRead(id: number): Promise<AuditComment> {
    const response = await axios.patch(`${API_URL}/${id}/read`, {}, { headers: authHeader() });
    return response.data;
  }

  async resolveComment(id: number): Promise<AuditComment> {
    const response = await axios.patch(`${API_URL}/${id}/resolve`, {}, { headers: authHeader() });
    return response.data;
  }
}

export default new AuditService();
