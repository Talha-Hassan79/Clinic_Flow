import { api } from './api';

export interface Patient {
  id: string;
  clinicId: string;
  firstName: string;
  lastName: string;
  gender?: string | null;
  dateOfBirth?: string | null;
  bloodGroup?: string | null;
  phone?: string | null;
  email?: string | null;
  cnic?: string | null;
  address?: string | null;
  city?: string | null;
  emergencyContactName?: string | null;
  emergencyContactPhone?: string | null;
  allergies?: string | null;
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    appointments: number;
    prescriptions: number;
    labReports: number;
    invoices: number;
  };
}

export interface LabReport {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  reportName: string;
  fileUrl: string;
  uploadedAt: string;
}

export interface PatientDetail extends Patient {
  appointments: any[];
  prescriptions: any[];
  labReports: LabReport[];
  invoices: any[];
  medicalRecords: any[];
}

export interface PatientsResponse {
  data: Patient[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface PatientStats {
  total: number;
  maleCount: number;
  femaleCount: number;
  otherCount: number;
  newThisMonth: number;
  totalLabTests: number;
}

export interface CreatePatientPayload {
  firstName: string;
  lastName: string;
  gender?: string;
  dateOfBirth?: string;
  bloodGroup?: string;
  phone?: string;
  email?: string;
  cnic?: string;
  address?: string;
  city?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  allergies?: string;
  notes?: string;
}

export interface CreateLabReportPayload {
  reportName: string;
  testType?: string;
  fileUrl?: string;
  testResults?: Record<string, any>;
}

export const patientsService = {
  async listPatients(params?: {
    search?: string;
    gender?: string;
    bloodGroup?: string;
    page?: number;
    limit?: number;
  }): Promise<PatientsResponse> {
    const { data } = await api.get<PatientsResponse>('/patients', { params });
    return data;
  },

  async getStats(): Promise<PatientStats> {
    const { data } = await api.get<PatientStats>('/patients/stats');
    return data;
  },

  async getPatientById(id: string): Promise<PatientDetail> {
    const { data } = await api.get<PatientDetail>(`/patients/${id}`);
    return data;
  },

  async createPatient(payload: CreatePatientPayload): Promise<Patient> {
    const { data } = await api.post<Patient>('/patients', payload);
    return data;
  },

  async updatePatient(id: string, payload: Partial<CreatePatientPayload>): Promise<Patient> {
    const { data } = await api.patch<Patient>(`/patients/${id}`, payload);
    return data;
  },

  async deletePatient(id: string): Promise<void> {
    await api.delete(`/patients/${id}`);
  },

  async addLabReport(patientId: string, payload: CreateLabReportPayload): Promise<LabReport> {
    const { data } = await api.post<LabReport>(`/patients/${patientId}/lab-reports`, payload);
    return data;
  },

  async deleteLabReport(patientId: string, reportId: string): Promise<void> {
    await api.delete(`/patients/${patientId}/lab-reports/${reportId}`);
  },
};
