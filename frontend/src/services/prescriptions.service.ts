import { api } from './api';

export interface PrescriptionItem {
  id: string;
  medicineId: string;
  dosage?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
  notes?: string;
  medicine: { id: string; name: string; genericName?: string };
}

export interface PrescriptionPatient {
  id: string;
  firstName: string;
  lastName: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  phone?: string | null;
}

export interface Prescription {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  appointmentId: string;
  diagnosis?: string | null;
  instructions?: string | null;
  followUpDate?: string | null;
  createdAt: string;
  doctorName: string;
  patientName: string;
  patient: PrescriptionPatient;
  doctor: { id: string; bio: unknown };
  appointment?: { id: string; appointmentDate: string; appointmentTime?: string };
  items: PrescriptionItem[];
}

export interface PrescriptionStats {
  total: number;
  today: number;
  thisMonth: number;
}

export interface PrescriptionItemInput {
  medicineName: string;
  dosage?: string;
  route?: string;
  frequency?: string;
  duration?: string;
  quantity?: number;
  notes?: string;
}

export interface CreatePrescriptionPayload {
  patientId: string;
  doctorId: string;
  appointmentId: string;
  diagnosis?: string;
  instructions?: string;
  followUpDate?: string;
  items: PrescriptionItemInput[];
}

export const prescriptionsService = {
  getStats: async (): Promise<PrescriptionStats> => {
    const res = await api.get<PrescriptionStats>('/prescriptions/stats');
    return res.data;
  },

  list: async (params?: { patientId?: string; doctorId?: string; search?: string }): Promise<Prescription[]> => {
    const res = await api.get<Prescription[]>('/prescriptions', { params });
    return res.data;
  },

  findOne: async (id: string): Promise<Prescription> => {
    const res = await api.get<Prescription>(`/prescriptions/${id}`);
    return res.data;
  },

  create: async (data: CreatePrescriptionPayload): Promise<Prescription> => {
    const res = await api.post<Prescription>('/prescriptions', data);
    return res.data;
  },

  update: async (
    id: string,
    data: Partial<{ diagnosis: string; instructions: string; followUpDate: string }>
  ): Promise<Prescription> => {
    const res = await api.patch<Prescription>(`/prescriptions/${id}`, data);
    return res.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/prescriptions/${id}`);
    return res.data;
  },
};
