import { api } from './api';

export interface KpiCard {
  title: string;
  value: string | number;
  change: string;
  isPositive: boolean;
  type: 'appointments' | 'revenue' | 'patients' | 'queue';
}

export interface ChartDataPoint {
  label: string;
  value: number;
}

export interface DashboardStats {
  kpis: KpiCard[];
  appointmentTrend: ChartDataPoint[];
  revenueTrend: ChartDataPoint[];
}

export interface DashboardActivity {
  id: string;
  action: string;
  entity: string;
  userName: string;
  createdAt: string;
}

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    const { data } = await api.get<DashboardStats>('/dashboard/stats');
    return data;
  },

  async getActivities(): Promise<DashboardActivity[]> {
    const { data } = await api.get<DashboardActivity[]>('/dashboard/activities');
    return data;
  },
};
