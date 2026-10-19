import { api } from './api';

export interface Department {
  id: string;
  name: string;
  description?: string;
}

export interface Doctor {
  id: string;
  clinicId: string;
  departmentId?: string | null;
  userId?: string | null;
  specialization?: string | null;
  licenseNumber?: string | null;
  qualification?: string | null;
  experienceYears?: number | null;
  consultationFee?: string | number | null;
  bio?: string | null;
  isAvailable: boolean;
  createdAt: string;
  fullName: string;
  schedule: string;
  cleanBio: string;
  department?: Department | null;
  _count?: {
    appointments: number;
    prescriptions: number;
    labReports: number;
  };
}

export interface DoctorDetail extends Doctor {
  appointments: any[];
  prescriptions: any[];
  labReports: any[];
}

export interface DoctorStats {
  total: number;
  availableCount: number;
  onLeaveCount: number;
  specializationsCount: number;
  departmentsCount: number;
}

export interface CreateDoctorPayload {
  firstName: string;
  lastName: string;
  specialization: string;
  departmentId?: string;
  departmentName?: string;
  licenseNumber?: string;
  qualification?: string;
  experienceYears?: number;
  consultationFee?: number;
  bio?: string;
  schedule?: string;
}

export const doctorsService = {
  async getStats(): Promise<DoctorStats> {
    const { data } = await api.get<DoctorStats>('/doctors/stats');
    return data;
  },

  async listDepartments(): Promise<Department[]> {
    const { data } = await api.get<Department[]>('/doctors/departments');
    return data;
  },

  async listDoctors(params?: {
    search?: string;
    departmentId?: string;
    isAvailable?: boolean;
    page?: number;
    limit?: number;
  }): Promise<{ data: Doctor[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { data } = await api.get('/doctors', { params });
    return data;
  },

  async getDoctorById(id: string): Promise<DoctorDetail> {
    const { data } = await api.get<DoctorDetail>(`/doctors/${id}`);
    return data;
  },

  async createDoctor(payload: CreateDoctorPayload): Promise<Doctor> {
    const { data } = await api.post<Doctor>('/doctors', payload);
    return data;
  },

  async updateDoctor(id: string, payload: Partial<CreateDoctorPayload> & { isAvailable?: boolean }): Promise<Doctor> {
    const { data } = await api.patch<Doctor>(`/doctors/${id}`, payload);
    return data;
  },

  async toggleAvailability(id: string): Promise<Doctor> {
    const { data } = await api.patch<Doctor>(`/doctors/${id}/toggle-availability`);
    return data;
  },

  async deleteDoctor(id: string): Promise<void> {
    await api.delete(`/doctors/${id}`);
  },
};
