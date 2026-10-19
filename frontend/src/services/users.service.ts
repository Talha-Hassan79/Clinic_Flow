import { api } from './api';

export interface ClinicUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isActive: boolean;
  lastLogin: string | null;
  createdAt: string;
  role: {
    id: string;
    name: string;
  };
}

export interface InviteUserPayload {
  firstName: string;
  lastName: string;
  email: string;
  roleId: string;
}

export interface InviteUserResponse extends ClinicUser {
  tempPassword: string;
}

export const usersService = {
  async listUsers(): Promise<ClinicUser[]> {
    const { data } = await api.get<ClinicUser[]>('/users');
    return data;
  },

  async inviteUser(payload: InviteUserPayload): Promise<InviteUserResponse> {
    const { data } = await api.post<InviteUserResponse>('/users/invite', payload);
    return data;
  },

  async updateRole(userId: string, roleId: string): Promise<ClinicUser> {
    const { data } = await api.patch<ClinicUser>(`/users/${userId}/role`, { roleId });
    return data;
  },

  async deactivateUser(userId: string): Promise<ClinicUser> {
    const { data } = await api.patch<ClinicUser>(`/users/${userId}/deactivate`);
    return data;
  },

  async reactivateUser(userId: string): Promise<ClinicUser> {
    const { data } = await api.patch<ClinicUser>(`/users/${userId}/reactivate`);
    return data;
  },

  async listRoles(): Promise<{ id: string; name: string }[]> {
    const { data } = await api.get<{ id: string; name: string }[]>('/users/roles');
    return data;
  },
};
