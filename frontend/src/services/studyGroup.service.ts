import api from './api';
import { ApiResponse } from '../types/api.types';

export interface Invitation {
  _id: string;
  senderId: { _id: string; name: string; email: string };
  receiverEmail: string;
  receiverId?: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: string;
  updatedAt: string;
}

export interface MemberStats {
  userId: string;
  name: string;
  email: string;
  streak: number;
  bestStreak: number;
  totalTasks: number;
  completedTasks: number;
  completionRate: number;
  productivityScore: number;
  consistencyDays: number;
  overdueTasks: number;
}

export interface ConnectionsData {
  members: MemberStats[];
  highlights: {
    mostProductiveMember: { name: string; value: number };
    bestStreakHolder: { name: string; value: number };
    highestCompletionRate: { name: string; value: number };
    weeklyWinner: { name: string; value: number };
  };
}

export const studyGroupService = {
  async lookupUser(email: string): Promise<{ exists: boolean; name: string | null }> {
    const res = await api.get<ApiResponse<{ exists: boolean; name: string | null }>>('/invitations/lookup', { params: { email } });
    return res.data.data!;
  },

  async sendInvitation(email: string): Promise<Invitation> {
    const res = await api.post<ApiResponse<Invitation>>('/invitations/send', { email });
    return res.data.data!;
  },

  async getMyInvitations(): Promise<Invitation[]> {
    const res = await api.get<ApiResponse<Invitation[]>>('/invitations/my');
    return res.data.data || [];
  },

  async getSentInvitations(): Promise<Invitation[]> {
    const res = await api.get<ApiResponse<Invitation[]>>('/invitations/sent');
    return res.data.data || [];
  },

  async respondToInvitation(id: string, action: 'accept' | 'reject'): Promise<Invitation> {
    const res = await api.put<ApiResponse<Invitation>>(`/invitations/${id}/respond`, { action });
    return res.data.data!;
  },

  async getConnections(): Promise<ConnectionsData> {
    const res = await api.get<ApiResponse<ConnectionsData>>('/invitations/connections');
    return res.data.data!;
  },
};
