import { api } from './api';

export type InvoiceStatus = 'PENDING' | 'PAID' | 'PARTIALLY_PAID' | 'CANCELLED';
export type PaymentMethod =
  | 'CASH'
  | 'CARD'
  | 'BANK_TRANSFER'
  | 'JAZZ_CASH'
  | 'EASY_PAISA'
  | 'ONLINE';

export interface Payment {
  id: string;
  clinicId: string;
  invoiceId: string;
  paymentMethod: PaymentMethod;
  amount: number;
  transactionReference?: string | null;
  paymentDate: string;
  notes?: string | null;
  createdAt: string;
}

export interface InvoicePatient {
  id: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  email?: string | null;
  cnic?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
}

export interface InvoiceAppointment {
  id: string;
  appointmentDate: string;
  appointmentTime?: string;
  doctor?: {
    id: string;
    specialization?: string | null;
  };
}

export interface Invoice {
  id: string;
  clinicId: string;
  patientId: string;
  appointmentId?: string | null;
  invoiceNumber: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  amountRemaining: number;
  status: InvoiceStatus;
  issuedAt: string;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
  patientName: string;
  doctorName?: string | null;
  patient: InvoicePatient;
  appointment?: InvoiceAppointment | null;
  clinic?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    address?: string | null;
    city?: string | null;
  };
  payments: Payment[];
}

export interface BillingStats {
  totalInvoices: number;
  pendingCount: number;
  paidCount: number;
  revenueToday: number;
  revenueThisMonth: number;
  totalRevenue: number;
}

export interface CreateInvoicePayload {
  patientId: string;
  appointmentId?: string;
  subtotal: number;
  discount?: number;
  tax?: number;
  status?: InvoiceStatus;
  dueDate?: string;
}

export interface UpdateInvoicePayload {
  subtotal?: number;
  discount?: number;
  tax?: number;
  status?: InvoiceStatus;
  dueDate?: string;
}

export interface RecordPaymentPayload {
  paymentMethod: PaymentMethod;
  amount: number;
  transactionReference?: string;
  notes?: string;
}

export const billingService = {
  getStats: async (): Promise<BillingStats> => {
    const res = await api.get<BillingStats>('/billing/stats');
    return res.data;
  },

  list: async (params?: {
    patientId?: string;
    status?: InvoiceStatus;
    search?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Invoice[]> => {
    const res = await api.get<Invoice[]>('/billing/invoices', { params });
    return res.data;
  },

  findOne: async (id: string): Promise<Invoice> => {
    const res = await api.get<Invoice>(`/billing/invoices/${id}`);
    return res.data;
  },

  create: async (data: CreateInvoicePayload): Promise<Invoice> => {
    const res = await api.post<Invoice>('/billing/invoices', data);
    return res.data;
  },

  update: async (id: string, data: UpdateInvoicePayload): Promise<Invoice> => {
    const res = await api.patch<Invoice>(`/billing/invoices/${id}`, data);
    return res.data;
  },

  recordPayment: async (id: string, data: RecordPaymentPayload): Promise<Invoice> => {
    const res = await api.post<Invoice>(`/billing/invoices/${id}/payments`, data);
    return res.data;
  },

  remove: async (id: string): Promise<{ message: string }> => {
    const res = await api.delete<{ message: string }>(`/billing/invoices/${id}`);
    return res.data;
  },
};
