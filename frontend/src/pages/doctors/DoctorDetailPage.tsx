import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { doctorsService } from '../../services/doctors.service';
import type { DoctorDetail } from '../../services/doctors.service';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Sparkles,
  Building2,
  AlertCircle,
  Stethoscope,
  CheckCircle2,
  FileText,
  CreditCard,
} from 'lucide-react';

export const DoctorDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [doctor, setDoctor] = useState<DoctorDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      loadDoctor();
    }
  }, [id]);

  const loadDoctor = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await doctorsService.getDoctorById(id!);
      setDoctor(data);
    } catch {
      setError('Failed to load doctor profile.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggle = async () => {
    if (!id) return;
    try {
      const updated = await doctorsService.toggleAvailability(id);
      setDoctor((prev) => (prev ? { ...prev, isAvailable: updated.isAvailable } : null));
    } catch {
      setError('Failed to update availability status.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-6 bg-brand-border rounded-btn w-32" />
        <div className="h-44 bg-brand-border rounded-modal" />
        <div className="h-64 bg-brand-border rounded-card" />
      </div>
    );
  }

  if (error || !doctor) {
    return (
      <div className="space-y-4 text-left">
        <Link
          to="/doctors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Doctors Directory</span>
        </Link>
        <div className="p-6 bg-danger/10 border border-danger/20 rounded-card text-danger text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'Doctor profile could not be loaded.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Breadcrumb Back Link */}
      <div>
        <Link
          to="/doctors"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Doctors Directory</span>
        </Link>
      </div>

      {/* ─── DOCTOR PROFILE HEADER CARD ───────────────────────────── */}
      <div className="bg-brand-card p-6 rounded-modal border border-brand-border shadow-subtle-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-primary/10 text-primary border-2 border-primary/20 flex items-center justify-center text-xl font-bold shrink-0">
              {doctor.fullName.startsWith('Dr.') ? doctor.fullName.slice(4, 6) : doctor.fullName.slice(0, 2)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-brand-text-primary">
                  {doctor.fullName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                  {doctor.specialization || 'General Physician'}
                </span>
                <span className="text-xs text-brand-text-secondary font-mono bg-brand-surface px-2 py-0.5 rounded-btn border border-brand-border">
                  {doctor.licenseNumber || 'License: Verified'}
                </span>
              </div>
              <p className="text-xs text-brand-text-secondary mt-1 flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                <span>{doctor.department?.name || 'General Medical Department'}</span>
                <span>•</span>
                <span>{doctor.experienceYears ? `${doctor.experienceYears} Years Experience` : 'Experienced'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleToggle}
              className={`h-9 px-4 rounded-btn text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                doctor.isAvailable
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                  : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${doctor.isAvailable ? 'bg-emerald-600' : 'bg-amber-600'}`} />
              <span>{doctor.isAvailable ? 'Available for Appointments' : 'Currently On Leave'}</span>
            </button>
          </div>
        </div>

        {/* Quick Highlights Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-3 border-t border-brand-border text-xs">
          <div className="flex items-center gap-2 text-brand-text-secondary">
            <CreditCard className="w-3.5 h-3.5 text-primary" />
            <span>
              Consultation Fee:{' '}
              <strong className="text-brand-text-primary">
                PKR {doctor.consultationFee ? Number(doctor.consultationFee).toLocaleString() : '1,500'}
              </strong>
            </span>
          </div>
          <div className="flex items-center gap-2 text-brand-text-secondary">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">{doctor.qualification || 'MBBS'}</span>
          </div>
          <div className="flex items-center gap-2 text-brand-text-secondary">
            <Clock className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">{doctor.schedule}</span>
          </div>
        </div>
      </div>

      {/* ─── CREDENTIALS & SCHEDULE CARDS ─────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Weekly Schedule */}
        <div className="bg-brand-card p-5 rounded-card border border-brand-border shadow-subtle-sm space-y-3">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <h3 className="text-xs uppercase font-bold tracking-wider text-brand-text-secondary">
              Weekly Consultation Hours
            </h3>
          </div>
          <div className="p-3.5 bg-brand-surface rounded-card border border-brand-border space-y-2 text-xs">
            <div className="flex items-center justify-between font-semibold text-brand-text-primary">
              <span>Regular OPD Timings</span>
              <span className="text-emerald-700 flex items-center gap-1 text-[11px]">
                <CheckCircle2 className="w-3 h-3" /> Scheduled
              </span>
            </div>
            <p className="text-xs text-brand-text-secondary font-mono">{doctor.schedule}</p>
          </div>
        </div>

        {/* Biography & Clinical Profile */}
        <div className="bg-brand-card p-5 rounded-card border border-brand-border shadow-subtle-sm space-y-3">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-primary" />
            <h3 className="text-xs uppercase font-bold tracking-wider text-brand-text-secondary">
              Professional Biography
            </h3>
          </div>
          <p className="text-xs text-brand-text-secondary leading-relaxed">
            {doctor.cleanBio || 'Consultant specialist providing comprehensive diagnostic and treatment care in ClinicFlow.'}
          </p>
        </div>
      </div>

      {/* ─── RECENT CONSULTATIONS & APPOINTMENTS ────────────────────── */}
      <div className="bg-brand-card rounded-card border border-brand-border shadow-subtle-sm overflow-hidden">
        <div className="px-5 py-3 bg-brand-surface border-b border-brand-border text-[10px] font-bold uppercase text-brand-text-secondary flex items-center justify-between">
          <span>Recent Patient Consultations ({doctor.appointments?.length || 0})</span>
        </div>

        {doctor.appointments && doctor.appointments.length > 0 ? (
          <div className="divide-y divide-brand-border text-xs">
            {doctor.appointments.map((a: any) => (
              <div key={a.id} className="p-4 flex items-center justify-between">
                <div>
                  <p className="font-semibold text-brand-text-primary">
                    Patient: {a.patient?.firstName} {a.patient?.lastName}
                  </p>
                  <p className="text-[10px] text-brand-text-secondary flex items-center gap-1.5 mt-0.5">
                    <Calendar className="w-3 h-3" />
                    {new Date(a.appointmentDate).toLocaleDateString()} — {a.timeSlot || 'Consultation'}
                  </p>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-primary border border-blue-100">
                  {a.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-10 text-center text-xs text-brand-text-secondary space-y-2">
            <Stethoscope className="w-8 h-8 mx-auto opacity-30 text-brand-text-secondary" />
            <p>No recent appointments booked with this doctor yet.</p>
          </div>
        )}
      </div>
    </div>
  );
};
export default DoctorDetailPage;
