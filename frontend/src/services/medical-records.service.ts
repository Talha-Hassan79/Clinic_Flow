import { api } from './api';

export interface Vitals {
  bp?: string;
  pulse?: string;
  temp?: string;
  weight?: string;
  spo2?: string;
}

export interface MedicalRecord {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  visitDate: string;
  chiefComplaint?: string | null;
  history?: string | null;
  examination?: string | null;
  examinationNotes?: string;
  vitals?: Vitals;
  diagnosis?: string | null;
  treatment?: string | null;
  attachments?: string[];
  createdAt: string;
  updatedAt: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string | null;
    cnic?: string | null;
    gender?: string | null;
    dateOfBirth?: string | null;
    bloodGroup?: string | null;
    allergies?: string[];
  };
  doctor: {
    id: string;
    fullName: string;
    specialization?: string | null;
    qualification?: string | null;
    licenseNumber?: string | null;
    department?: { id: string; name: string } | null;
  };
}

export interface MedicalRecordStats {
  total: number;
  todayCount: number;
  uniquePatientsCount: number;
  topDiagnoses: { diagnosis: string; count: number }[];
}

export interface CreateMedicalRecordPayload {
  patientId: string;
  doctorId: string;
  visitDate: string;
  chiefComplaint: string;
  history?: string;
  examination?: string;
  diagnosis: string;
  treatment: string;
  vitals?: Vitals;
  attachments?: string[];
}

export const medicalRecordsService = {
  async getStats(): Promise<MedicalRecordStats> {
    const { data } = await api.get<MedicalRecordStats>('/medical-records/stats');
    return data;
  },

  async listRecords(params?: {
    search?: string;
    patientId?: string;
    doctorId?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: MedicalRecord[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { data } = await api.get('/medical-records', { params });
    return data;
  },

  async getRecordById(id: string): Promise<MedicalRecord> {
    const { data } = await api.get<MedicalRecord>(`/medical-records/${id}`);
    return data;
  },

  async createRecord(payload: CreateMedicalRecordPayload): Promise<MedicalRecord> {
    const { data } = await api.post<MedicalRecord>('/medical-records', payload);
    return data;
  },

  async updateRecord(id: string, payload: Partial<CreateMedicalRecordPayload>): Promise<MedicalRecord> {
    const { data } = await api.patch<MedicalRecord>(`/medical-records/${id}`, payload);
    return data;
  },

  async deleteRecord(id: string): Promise<void> {
    await api.delete(`/medical-records/${id}`);
  },
};
