import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { dashboardService } from '../../services/dashboard.service';
import type { DashboardStats, DashboardActivity } from '../../services/dashboard.service';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts';
import {
  Calendar,
  CreditCard,
  Users,
  Clock,
  AlertCircle,
  Play,
  CheckCircle,
  XCircle,
  FileText
} from 'lucide-react';

interface QueueItem {
  id: string;
  name: string;
  age: number;
  gender: string;
  time: string;
  status: 'Waiting' | 'In Consultation' | 'Completed' | 'Cancelled';
}

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activities, setActivities] = useState<DashboardActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active Interactive Queue State
  const [queue, setQueue] = useState<QueueItem[]>([
    { id: '1', name: 'Zainab Bibi', age: 34, gender: 'F', time: '10:15 AM', status: 'Waiting' },
    { id: '2', name: 'Muhammad Ali', age: 45, gender: 'M', time: '10:30 AM', status: 'In Consultation' },
    { id: '3', name: 'Ayesha Begum', age: 28, gender: 'F', time: '11:00 AM', status: 'Waiting' },
    { id: '4', name: 'Kamran Shah', age: 52, gender: 'M', time: '11:30 AM', status: 'Waiting' }
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const [statsData, activitiesData] = await Promise.all([
          dashboardService.getStats(),
          dashboardService.getActivities()
        ]);
        setStats(statsData);
        setActivities(activitiesData);
      } catch (err: any) {
        setError('Failed to sync metrics with workspace API.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleQueueStatusChange = (id: string, newStatus: QueueItem['status']) => {
    setQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: newStatus } : item))
    );
  };

  const getKpiIcon = (type: string) => {
    switch (type) {
      case 'appointments':
        return <Calendar className="w-5 h-5 text-blue-600" />;
      case 'revenue':
        return <CreditCard className="w-5 h-5 text-emerald-600" />;
      case 'patients':
        return <Users className="w-5 h-5 text-teal-600" />;
      default:
        return <Clock className="w-5 h-5 text-orange-600" />;
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-8 animate-pulse text-left">
        <div className="h-28 bg-brand-border rounded-modal" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((n) => (
            <div key={n} className="h-24 bg-brand-border rounded-card" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="h-64 bg-brand-border rounded-card" />
          <div className="h-64 bg-brand-border rounded-card" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-danger/10 border border-danger/20 rounded-card text-danger text-sm flex items-center gap-3 text-left">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 text-left">
      {/* ─── DYNAMIC WELCOME BANNER ───────────────────────────────── */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-modal p-8 shadow-subtle-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
        <div className="relative z-10">
          <span className="px-2.5 py-0.5 rounded-full bg-white/15 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
            Active Workspace
          </span>
          <h2 className="text-3xl font-extrabold tracking-tight mt-2.5">
            Good Morning, Dr. {user?.lastName}!
          </h2>
          <p className="text-blue-100 text-xs mt-1 max-w-xl">
            You have {queue.filter(q => q.status === 'Waiting').length} patients waiting in the queue.
          </p>
        </div>
      </div>

      {/* ─── KPI METRICS GRID ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats?.kpis.map((kpi) => (
          <div
            key={kpi.title}
            className="bg-brand-card p-5 rounded-card border border-brand-border shadow-subtle-sm flex items-start justify-between hover:scale-[1.01] transition-transform duration-200"
          >
            <div className="space-y-2">
              <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary">
                {kpi.title}
              </p>
              <h3 className="text-2xl font-extrabold tracking-tight text-brand-text-primary">
                {kpi.value}
              </h3>
              <p className="text-[10px] text-brand-text-secondary flex items-center gap-1">
                <span className="font-semibold text-primary">{kpi.change}</span>
              </p>
            </div>
            <div className="w-10 h-10 rounded-btn bg-brand-surface border border-brand-border flex items-center justify-center">
              {getKpiIcon(kpi.type)}
            </div>
          </div>
        ))}
      </div>

      {/* ─── TIMELINE CHARTS GRID ─────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Appointment Trends Area Chart */}
        <div className="bg-brand-card p-6 rounded-card border border-brand-border shadow-subtle-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
              Appointments Timeline
            </h3>
            <span className="text-[10px] text-brand-text-secondary">Weekly analysis</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={stats?.appointmentTrend}>
                <defs>
                  <linearGradient id="colorAppt" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#2563EB" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#2563EB" strokeWidth={2} fillOpacity={1} fill="url(#colorAppt)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Revenue Timelines Bar Chart */}
        <div className="bg-brand-card p-6 rounded-card border border-brand-border shadow-subtle-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
              Revenue Metrics
            </h3>
            <span className="text-[10px] text-brand-text-secondary">Monthly totals</span>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats?.revenueTrend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="label" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="value" fill="#14B8A6" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── WAITING QUEUE & ACTIVITY FEEDS ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Waiting Queue list (Left Panel) */}
        <div className="lg:col-span-8 bg-brand-card p-6 rounded-card border border-brand-border shadow-subtle-sm space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
              Live Waiting Queue
            </h3>
            <span className="text-[10px] font-semibold px-2 py-0.5 bg-blue-50 text-primary rounded-full border border-blue-100">
              Interactive
            </span>
          </div>

          <div className="divide-y divide-brand-border border border-brand-border rounded-card overflow-hidden">
            {queue.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-brand-surface transition-colors">
                <div className="flex items-center gap-3 text-left">
                  <div className="w-8 h-8 rounded-full bg-brand-surface border border-brand-border flex items-center justify-center text-xs font-semibold">
                    {item.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-brand-text-primary">{item.name}</span>
                      <span className="text-[10px] text-brand-text-secondary">{item.gender} • Age {item.age}</span>
                    </div>
                    <span className="text-[10px] text-brand-text-secondary flex items-center gap-1.5 mt-0.5">
                      <Clock className="w-3.5 h-3.5" /> Scheduled: {item.time}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 justify-end">
                  {/* Status Badge */}
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-bold border ${
                      item.status === 'In Consultation'
                        ? 'bg-blue-50 text-primary border-blue-100'
                        : item.status === 'Completed'
                        ? 'bg-success/15 text-success border-success/20'
                        : item.status === 'Cancelled'
                        ? 'bg-danger/10 text-danger border-danger/20'
                        : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}
                  >
                    {item.status}
                  </span>

                  {/* Actions Toggle */}
                  <div className="flex items-center gap-1">
                    {item.status === 'Waiting' && (
                      <button
                        onClick={() => handleQueueStatusChange(item.id, 'In Consultation')}
                        className="w-7 h-7 bg-brand-surface border border-brand-border hover:bg-blue-50 hover:text-primary rounded-btn flex items-center justify-center transition-colors cursor-pointer"
                        title="Start Consultation"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    )}
                    {item.status === 'In Consultation' && (
                      <button
                        onClick={() => handleQueueStatusChange(item.id, 'Completed')}
                        className="w-7 h-7 bg-brand-surface border border-brand-border hover:bg-success/10 hover:text-success rounded-btn flex items-center justify-center transition-colors cursor-pointer"
                        title="Mark Completed"
                      >
                        <CheckCircle className="w-3 h-3" />
                      </button>
                    )}
                    {(item.status === 'Waiting' || item.status === 'In Consultation') && (
                      <button
                        onClick={() => handleQueueStatusChange(item.id, 'Cancelled')}
                        className="w-7 h-7 bg-brand-surface border border-brand-border hover:bg-danger/10 hover:text-danger rounded-btn flex items-center justify-center transition-colors cursor-pointer"
                        title="Cancel Appointment"
                      >
                        <XCircle className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activities Panel (Right Panel) */}
        <div className="lg:col-span-4 bg-brand-card p-6 rounded-card border border-brand-border shadow-subtle-sm space-y-4 text-left">
          <h3 className="text-sm font-bold text-brand-text-primary uppercase tracking-wider">
            Workspace Activity
          </h3>

          <div className="space-y-4 pt-2 relative before:absolute before:top-2 before:bottom-2 before:left-[11px] before:w-[1px] before:bg-brand-border">
            {activities.map((act) => (
              <div key={act.id} className="flex gap-3 items-start relative z-10">
                <div className="w-6 h-6 rounded-full bg-white border border-brand-border flex items-center justify-center shrink-0">
                  <FileText className="w-3 h-3 text-brand-text-secondary" />
                </div>
                <div className="space-y-0.5">
                  <p className="text-[11px] font-semibold text-brand-text-primary leading-tight">
                    {act.action.replace('_', ' ')}
                  </p>
                  <p className="text-[9px] text-brand-text-secondary">
                    {act.userName} • {new Date(act.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
export default DashboardPage;
