import { api } from './api';

export type AppointmentStatus =
  | 'SCHEDULED'
  | 'CONFIRMED'
  | 'WAITING'
  | 'IN_CONSULTATION'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'NO_SHOW';

export interface Appointment {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  status: AppointmentStatus;
  reason?: string | null;
  notes?: string | null;
  token?: string;
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
  };
  doctor: {
    id: string;
    fullName: string;
    specialization?: string | null;
    qualification?: string | null;
    consultationFee?: number | string | null;
    department?: { id: string; name: string } | null;
  };
  invoice?: {
    id: string;
    invoiceNumber: string;
    total: number | string;
    status: string;
  } | null;
}

export interface AppointmentStats {
  total: number;
  todayCount: number;
  waitingCount: number;
  inConsultationCount: number;
  completedToday: number;
}

export interface CreateAppointmentPayload {
  patientId: string;
  doctorId: string;
  appointmentDate: string;
  appointmentTime: string;
  reason?: string;
  notes?: string;
  type?: string;
}

export interface TimeSlot {
  time: string;
  isBooked: boolean;
}

export const appointmentsService = {
  async getStats(): Promise<AppointmentStats> {
    const { data } = await api.get<AppointmentStats>('/appointments/stats');
    return data;
  },

  async listAppointments(params?: {
    search?: string;
    doctorId?: string;
    patientId?: string;
    status?: string;
    date?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: Appointment[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { data } = await api.get('/appointments', { params });
    return data;
  },

  async getAppointmentById(id: string): Promise<Appointment> {
    const { data } = await api.get<Appointment>(`/appointments/${id}`);
    return data;
  },

  async createAppointment(payload: CreateAppointmentPayload): Promise<Appointment> {
    const { data } = await api.post<Appointment>('/appointments', payload);
    return data;
  },

  async updateAppointment(id: string, payload: Partial<CreateAppointmentPayload> & { status?: AppointmentStatus }): Promise<Appointment> {
    const { data } = await api.patch<Appointment>(`/appointments/${id}`, payload);
    return data;
  },

  async updateStatus(id: string, status: AppointmentStatus): Promise<Appointment> {
    const { data } = await api.patch<Appointment>(`/appointments/${id}/status`, { status });
    return data;
  },

  async deleteAppointment(id: string): Promise<void> {
    await api.delete(`/appointments/${id}`);
  },

  async getAvailableSlots(doctorId: string, date: string): Promise<TimeSlot[]> {
    const { data } = await api.get<TimeSlot[]>('/appointments/slots', {
      params: { doctorId, date },
    });
    return data;
  },
};
