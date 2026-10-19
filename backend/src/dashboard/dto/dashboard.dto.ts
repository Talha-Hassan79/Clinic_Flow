export class KpiCardDto {
  title!: string;
  value!: string | number;
  change!: string;
  isPositive!: boolean;
  type!: 'appointments' | 'revenue' | 'patients' | 'queue';
}

export class ChartDataPointDto {
  label!: string;
  value!: number;
}

export class DashboardStatsDto {
  kpis!: KpiCardDto[];
  appointmentTrend!: ChartDataPointDto[];
  revenueTrend!: ChartDataPointDto[];
}

export class DashboardActivityDto {
  id!: string;
  action!: string;
  entity!: string;
  userName!: string;
  createdAt!: Date;
}
