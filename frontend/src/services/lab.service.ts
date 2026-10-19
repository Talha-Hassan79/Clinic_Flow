import { api } from './api';

export type LabOrderStatus =
  | 'ORDERED'
  | 'SAMPLE_COLLECTED'
  | 'IN_PROGRESS'
  | 'PENDING_APPROVAL'
  | 'COMPLETED'
  | 'CANCELLED';

export type LabVerificationStatus =
  | 'PENDING_TECH_ENTRY'
  | 'PENDING_PATHOLOGIST_APPROVAL'
  | 'APPROVED'
  | 'CANCELLED';

export type LabOrderPriority = 'ROUTINE' | 'URGENT' | 'STAT';

export interface CatalogParameter {
  id?: string;
  paramKey: string;
  paramLabel: string;
  unit: string;
  normalRange: string;
  sortOrder?: number;
}

export interface LabCatalogItem {
  id: string;
  clinicId: string;
  name: string;
  category: string;
  description?: string;
  price: number | string;
  turnaround?: string;
  isActive: boolean;
  parameters: CatalogParameter[];
  createdAt: string;
  updatedAt: string;
}

export interface LabOrder {
  id: string;
  clinicId: string;
  patientId: string;
  doctorId: string;
  reportName: string;
  uploadedAt: string;
  status: LabOrderStatus;
  priority: LabOrderPriority;
  testCategory?: string;
  clinicalNotes?: string;
  technicianNotes?: string;
  sampleToken?: string;
  sampleType?: string;
  sampleCollectedAt?: string;
  verificationStatus?: LabVerificationStatus;
  pathologistId?: string;
  pathologistSignedAt?: string;
  pathologistNotes?: string;
  pathologistName?: string;
  results?: Record<string, { value: string; unit: string; normalRange: string; flag?: 'NORMAL' | 'HIGH' | 'LOW' }> | null;
  patient?: {
    id: string;
    firstName: string;
    lastName: string;
    phone?: string;
    cnic?: string;
    gender?: string;
    dateOfBirth?: string;
    bloodGroup?: string;
  };
  doctor?: {
    id: string;
    specialization?: string;
    qualification?: string;
    bio?: string;
  };
  clinic?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    address?: string;
    city?: string;
    logoUrl?: string;
  };
}

export interface LabStats {
  totalOrders: number;
  pendingSamples: number;
  inProgress: number;
  pendingApproval: number;
  completedToday: number;
}

export interface CreateLabOrderPayload {
  patientId: string;
  doctorId?: string;
  testName: string;
  testCategory?: string;
  clinicalNotes?: string;
  priority?: LabOrderPriority;
}

export interface CollectSamplePayload {
  sampleToken?: string;
  sampleType?: string;
}

export interface UpdateLabResultsPayload {
  status?: LabOrderStatus;
  results?: Record<string, any>;
  technicianNotes?: string;
  fileUrl?: string;
}

export interface ApproveLabOrderPayload {
  pathologistNotes?: string;
  pathologistName?: string;
}

export interface CreateCatalogPayload {
  name: string;
  category: string;
  description?: string;
  price?: number;
  turnaround?: string;
  parameters: CatalogParameter[];
}

export interface UpdateCatalogPayload {
  name?: string;
  category?: string;
  description?: string;
  price?: number;
  turnaround?: string;
  isActive?: boolean;
  parameters?: CatalogParameter[];
}

export const labService = {
  async getStats(): Promise<LabStats> {
    const { data } = await api.get<LabStats>('/lab/stats');
    return data;
  },

  async listOrders(params?: {
    search?: string;
    status?: string;
    testCategory?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: LabOrder[]; meta: { total: number; page: number; limit: number; totalPages: number } }> {
    const { data } = await api.get('/lab/orders', { params });
    return data;
  },

  async getOrderById(id: string): Promise<LabOrder> {
    const { data } = await api.get<LabOrder>(`/lab/orders/${id}`);
    return data;
  },

  async createOrder(payload: CreateLabOrderPayload): Promise<LabOrder> {
    const { data } = await api.post<LabOrder>('/lab/orders', payload);
    return data;
  },

  async collectSample(id: string, payload: CollectSamplePayload): Promise<LabOrder> {
    const { data } = await api.patch<LabOrder>(`/lab/orders/${id}/collect-sample`, payload);
    return data;
  },

  async updateResults(id: string, payload: UpdateLabResultsPayload): Promise<LabOrder> {
    const { data } = await api.patch<LabOrder>(`/lab/orders/${id}/results`, payload);
    return data;
  },

  async approveOrder(id: string, payload: ApproveLabOrderPayload): Promise<LabOrder> {
    const { data } = await api.patch<LabOrder>(`/lab/orders/${id}/approve`, payload);
    return data;
  },

  async deleteOrder(id: string): Promise<void> {
    await api.delete(`/lab/orders/${id}`);
  },

  // ── Public verification endpoint (accessible without bearer token) ──
  async getPublicVerification(id: string): Promise<LabOrder> {
    const { data } = await api.get<LabOrder>(`/lab/public/verify/${id}`);
    return data;
  },

  // ── Custom Catalog API ──
  async listCatalog(): Promise<LabCatalogItem[]> {
    const { data } = await api.get<LabCatalogItem[]>('/lab/catalog');
    return data;
  },

  async getCatalogItem(id: string): Promise<LabCatalogItem> {
    const { data } = await api.get<LabCatalogItem>(`/lab/catalog/${id}`);
    return data;
  },

  async createCatalogItem(payload: CreateCatalogPayload): Promise<LabCatalogItem> {
    const { data } = await api.post<LabCatalogItem>('/lab/catalog', payload);
    return data;
  },

  async updateCatalogItem(id: string, payload: UpdateCatalogPayload): Promise<LabCatalogItem> {
    const { data } = await api.patch<LabCatalogItem>(`/lab/catalog/${id}`, payload);
    return data;
  },

  async deleteCatalogItem(id: string): Promise<void> {
    await api.delete(`/lab/catalog/${id}`);
  },
};
