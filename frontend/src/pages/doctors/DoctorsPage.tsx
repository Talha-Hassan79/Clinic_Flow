import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { doctorsService } from '../../services/doctors.service';
import type {
  Doctor,
  Department,
  DoctorStats,
  CreateDoctorPayload,
} from '../../services/doctors.service';
import {
  Stethoscope,
  Search,
  AlertCircle,
  X,
  UserCheck,
  UserX,
  Clock,
  Plus,
  Trash2,
  ChevronRight,
  Sparkles,
  Building2,
  Calendar,
} from 'lucide-react';

const COMMON_SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Pediatrician',
  'Dermatologist',
  'Dental Surgeon',
  'Orthopedic Surgeon',
  'Gynecologist',
  'Neurologist',
  'ENT Specialist',
  'Ophthalmologist',
];

export const DoctorsPage: React.FC = () => {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [stats, setStats] = useState<DoctorStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [availabilityFilter, setAvailabilityFilter] = useState<string>('');

  // Register Modal
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreateDoctorPayload>({
    firstName: '',
    lastName: '',
    specialization: 'General Physician',
    departmentName: 'General Medicine',
    licenseNumber: '',
    qualification: 'MBBS',
    experienceYears: 5,
    consultationFee: 2000,
    schedule: 'Mon - Fri: 09:00 AM - 02:00 PM',
    bio: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const isAvail = availabilityFilter === '' ? undefined : availabilityFilter === 'true';
      const [docsRes, deptsRes, statsRes] = await Promise.all([
        doctorsService.listDoctors({
          search: search || undefined,
          departmentId: departmentFilter || undefined,
          isAvailable: isAvail,
        }),
        doctorsService.listDepartments(),
        doctorsService.getStats(),
      ]);
      setDoctors(docsRes.data);
      setDepartments(deptsRes);
      setStats(statsRes);
    } catch {
      setError('Failed to load clinic doctor directory.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, departmentFilter, availabilityFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      await doctorsService.createDoctor(form);
      setShowModal(false);
      setForm({
        firstName: '',
        lastName: '',
        specialization: 'General Physician',
        departmentName: 'General Medicine',
        licenseNumber: '',
        qualification: 'MBBS',
        experienceYears: 5,
        consultationFee: 2000,
        schedule: 'Mon - Fri: 09:00 AM - 02:00 PM',
        bio: '',
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register doctor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await doctorsService.toggleAvailability(id);
      setDoctors((prev) =>
        prev.map((d) => (d.id === id ? { ...d, isAvailable: updated.isAvailable } : d))
      );
      doctorsService.getStats().then(setStats).catch(() => {});
    } catch {
      setError('Failed to update doctor availability status.');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the doctor registry?`)) {
      return;
    }
    try {
      await doctorsService.deleteDoctor(id);
      setDoctors((prev) => prev.filter((d) => d.id !== id));
      doctorsService.getStats().then(setStats).catch(() => {});
    } catch {
      setError('Failed to delete doctor profile.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text-primary flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-primary" />
            <span>Doctors & Specialists Directory</span>
          </h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Manage physician profiles, medical departments, consultation fees, and weekly consultation schedules.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Register New Doctor</span>
        </button>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="p-3.5 rounded-btn bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto cursor-pointer">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shrink-0">
            <Stethoscope className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Total Physicians</p>
            <p className="text-xl font-extrabold text-brand-text-primary">{stats?.total ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Available Now</p>
            <p className="text-xl font-extrabold text-brand-text-primary">{stats?.availableCount ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <UserX className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">On Leave</p>
            <p className="text-xl font-extrabold text-brand-text-primary">{stats?.onLeaveCount ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Building2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Departments</p>
            <p className="text-xl font-extrabold text-brand-text-primary">{stats?.departmentsCount ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by doctor name, qualification, or specialization…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
            className="h-10 px-3 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          <select
            value={availabilityFilter}
            onChange={(e) => setAvailabilityFilter(e.target.value)}
            className="h-10 px-3 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="true">Available</option>
            <option value="false">On Leave</option>
          </select>
        </div>
      </div>

      {/* Doctor Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full p-12 text-center text-xs text-brand-text-secondary animate-pulse">
            Loading doctor directory…
          </div>
        ) : doctors.length === 0 ? (
          <div className="col-span-full p-12 text-center bg-brand-card rounded-card border border-brand-border space-y-2">
            <Stethoscope className="w-8 h-8 mx-auto opacity-30 text-brand-text-secondary" />
            <p className="text-xs text-brand-text-secondary">No doctors found.</p>
            <button
              onClick={() => setShowModal(true)}
              className="text-primary hover:underline font-semibold text-xs"
            >
              Register your first doctor profile now
            </button>
          </div>
        ) : (
          doctors.map((doc) => (
            <div
              key={doc.id}
              className="bg-brand-card p-5 rounded-modal border border-brand-border shadow-subtle-sm space-y-4 hover:border-primary/40 transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                {/* Header & Avatar */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 text-primary border-2 border-primary/20 flex items-center justify-center font-bold text-sm shrink-0">
                      {doc.fullName.startsWith('Dr.') ? doc.fullName.slice(4, 6) : doc.fullName.slice(0, 2)}
                    </div>
                    <div>
                      <Link
                        to={`/doctors/${doc.id}`}
                        className="font-bold text-sm text-brand-text-primary hover:text-primary transition-colors flex items-center gap-1 group"
                      >
                        <span>{doc.fullName}</span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </Link>
                      <p className="text-[11px] font-semibold text-primary">
                        {doc.specialization || 'General Physician'}
                      </p>
                    </div>
                  </div>

                  {/* Availability Badge Button */}
                  <button
                    onClick={() => handleToggle(doc.id)}
                    title="Click to toggle availability"
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                      doc.isAvailable
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    {doc.isAvailable ? '● Available' : '○ On Leave'}
                  </button>
                </div>

                {/* Department & Qualifications */}
                <div className="space-y-1 text-xs">
                  <div className="flex items-center gap-1.5 text-brand-text-secondary">
                    <Building2 className="w-3.5 h-3.5 text-primary" />
                    <span>{doc.department?.name || 'General Department'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-brand-text-secondary">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <span className="truncate">{doc.qualification || 'MBBS'} {doc.experienceYears ? `• ${doc.experienceYears} yrs exp` : ''}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-brand-text-secondary">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span className="text-[11px] truncate">{doc.schedule}</span>
                  </div>
                </div>
              </div>

              {/* Footer: Fee & Actions */}
              <div className="pt-3 border-t border-brand-border flex items-center justify-between">
                <div>
                  <p className="text-[9px] uppercase font-bold text-brand-text-secondary">Consultation Fee</p>
                  <p className="text-xs font-bold text-brand-text-primary">
                    PKR {doc.consultationFee ? Number(doc.consultationFee).toLocaleString() : '1,500'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span
                    title="Appointments conducted"
                    className="px-2 py-0.5 rounded-btn bg-blue-50 text-primary border border-blue-100 text-[10px] font-semibold flex items-center gap-1"
                  >
                    <Calendar className="w-3 h-3" />
                    {doc._count?.appointments ?? 0}
                  </span>

                  <Link
                    to={`/doctors/${doc.id}`}
                    className="h-7 px-2.5 rounded-btn bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-primary hover:text-white transition-all text-[11px] font-semibold flex items-center"
                  >
                    Profile
                  </Link>

                  <button
                    onClick={() => handleDelete(doc.id, doc.fullName)}
                    title="Delete doctor"
                    className="w-7 h-7 rounded-btn border border-danger/20 text-danger hover:bg-danger/10 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ─── REGISTER DOCTOR MODAL ───────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-xl p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  Register Physician / Specialist
                </h3>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">
                  Enter credentials, medical license, department, fee, and consultation hours.
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              {/* Doctor Name */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    First Name *
                  </label>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) => setForm((f) => ({ ...f, firstName: e.target.value }))}
                    placeholder="e.g. Dr. Asif"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Last Name *
                  </label>
                  <input
                    required
                    value={form.lastName}
                    onChange={(e) => setForm((f) => ({ ...f, lastName: e.target.value }))}
                    placeholder="e.g. Jameel"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Specialization & Department */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Specialization *
                  </label>
                  <select
                    value={form.specialization}
                    onChange={(e) => setForm((f) => ({ ...f, specialization: e.target.value }))}
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    {COMMON_SPECIALIZATIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Department
                  </label>
                  <select
                    value={form.departmentName}
                    onChange={(e) => setForm((f) => ({ ...f, departmentName: e.target.value }))}
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Qualifications & License */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Qualifications
                  </label>
                  <input
                    value={form.qualification || ''}
                    onChange={(e) => setForm((f) => ({ ...f, qualification: e.target.value }))}
                    placeholder="e.g. MBBS, FCPS (Cardiology), MRCP"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    License / PMDC Number
                  </label>
                  <input
                    value={form.licenseNumber || ''}
                    onChange={(e) => setForm((f) => ({ ...f, licenseNumber: e.target.value }))}
                    placeholder="e.g. PMDC-87654-P"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Fee & Experience */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Consultation Fee (PKR)
                  </label>
                  <input
                    type="number"
                    value={form.consultationFee || 2000}
                    onChange={(e) => setForm((f) => ({ ...f, consultationFee: Number(e.target.value) }))}
                    placeholder="2500"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Experience (Years)
                  </label>
                  <input
                    type="number"
                    value={form.experienceYears || 5}
                    onChange={(e) => setForm((f) => ({ ...f, experienceYears: Number(e.target.value) }))}
                    placeholder="8"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary font-mono"
                  />
                </div>
              </div>

              {/* Weekly Consultation Schedule */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Weekly Consultation Timings
                </label>
                <input
                  value={form.schedule || ''}
                  onChange={(e) => setForm((f) => ({ ...f, schedule: e.target.value }))}
                  placeholder="e.g. Mon - Fri: 09:00 AM - 02:00 PM, Sat: 11:00 AM - 03:00 PM"
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Bio */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Short Professional Biography
                </label>
                <textarea
                  rows={2}
                  value={form.bio || ''}
                  onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                  placeholder="e.g. Specialist in pediatric cardiology and neonatal care."
                  className="w-full p-2.5 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 h-10 border border-brand-border rounded-btn text-xs font-semibold text-brand-text-secondary hover:bg-brand-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-10 bg-primary hover:bg-blue-700 text-white rounded-btn text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Register Doctor</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default DoctorsPage;
