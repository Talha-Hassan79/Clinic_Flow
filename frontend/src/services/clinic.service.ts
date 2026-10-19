import { api } from './api';

export interface ClinicDetails {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  country?: string | null;
  postalCode?: string | null;
  timezone?: string | null;
  currency?: string | null;
  logoUrl?: string | null;
  subscriptionPlan?: string | null;
  subscriptionStatus?: string | null;
}

export const clinicService = {
  async getClinic(): Promise<ClinicDetails> {
    const { data } = await api.get<ClinicDetails>('/clinics/my-clinic');
    return data;
  },

  async updateClinic(payload: Partial<ClinicDetails>): Promise<ClinicDetails> {
    const { data } = await api.patch<ClinicDetails>('/clinics/my-clinic', payload);
    return data;
  },
};
