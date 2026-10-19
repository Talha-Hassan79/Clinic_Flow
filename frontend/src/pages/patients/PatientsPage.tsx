import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { patientsService } from '../../services/patients.service';
import type {
  Patient,
  PatientStats,
  CreatePatientPayload,
} from '../../services/patients.service';
import {
  UserPlus,
  Search,
  Users,
  AlertCircle,
  X,
  Phone,
  Calendar,
  Trash2,
  ChevronRight,
  TestTube,
  Activity,
  Heart,
} from 'lucide-react';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const GENDERS = ['Male', 'Female', 'Other'];

export const PatientsPage: React.FC = () => {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [stats, setStats] = useState<PatientStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [genderFilter, setGenderFilter] = useState('');
  const [bloodGroupFilter, setBloodGroupFilter] = useState('');

  // Register Modal
  const [showModal, setShowModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState<CreatePatientPayload>({
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    cnic: '',
    gender: 'Male',
    dateOfBirth: '',
    bloodGroup: 'B+',
    address: '',
    city: '',
    emergencyContactName: '',
    emergencyContactPhone: '',
    allergies: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [listRes, statsRes] = await Promise.all([
        patientsService.listPatients({
          search: search || undefined,
          gender: genderFilter || undefined,
          bloodGroup: bloodGroupFilter || undefined,
        }),
        patientsService.getStats(),
      ]);
      setPatients(listRes.data);
      setStats(statsRes);
    } catch {
      setError('Failed to load patient records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, genderFilter, bloodGroupFilter]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSubmitting(true);
      setError(null);
      const newPatient = await patientsService.createPatient(form);
      setPatients((prev) => [newPatient, ...prev]);
      setShowModal(false);
      setForm({
        firstName: '',
        lastName: '',
        phone: '',
        email: '',
        cnic: '',
        gender: 'Male',
        dateOfBirth: '',
        bloodGroup: 'B+',
        address: '',
        city: '',
        emergencyContactName: '',
        emergencyContactPhone: '',
        allergies: '',
        notes: '',
      });
      // Refresh stats
      patientsService.getStats().then(setStats).catch(() => {});
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register patient.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to remove ${name} from the patient registry?`)) {
      return;
    }
    try {
      await patientsService.deletePatient(id);
      setPatients((prev) => prev.filter((p) => p.id !== id));
      patientsService.getStats().then(setStats).catch(() => {});
    } catch {
      setError('Failed to delete patient record.');
    }
  };

  const calculateAge = (dobString?: string | null) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text-primary">
            Patient Directory & Diagnostics
          </h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Register new patients, manage clinical profiles, and access lab test reports.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="h-10 px-4 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
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
            <Users className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">
              Total Patients
            </p>
            <p className="text-xl font-extrabold text-brand-text-primary">
              {stats?.total ?? '—'}
            </p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 shrink-0">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">
              New This Month
            </p>
            <p className="text-xl font-extrabold text-brand-text-primary">
              {stats?.newThisMonth ?? '—'}
            </p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-600 shrink-0">
            <Heart className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">
              Gender Demographics
            </p>
            <p className="text-xs font-bold text-brand-text-primary mt-0.5">
              {stats ? `♂ ${stats.maleCount} / ♀ ${stats.femaleCount}` : '—'}
            </p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <TestTube className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">
              Lab Tests Conducted
            </p>
            <p className="text-xl font-extrabold text-brand-text-primary">
              {stats?.totalLabTests ?? '—'}
            </p>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by patient name, phone, email, or CNIC…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-2">
          <select
            value={genderFilter}
            onChange={(e) => setGenderFilter(e.target.value)}
            className="h-10 px-3 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All Genders</option>
            {GENDERS.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>

          <select
            value={bloodGroupFilter}
            onChange={(e) => setBloodGroupFilter(e.target.value)}
            className="h-10 px-3 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All Blood Groups</option>
            {BLOOD_GROUPS.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Patient Directory Table */}
      <div className="bg-brand-card rounded-card border border-brand-border shadow-subtle-sm overflow-hidden">
        <div className="hidden md:grid grid-cols-12 px-5 py-3 bg-brand-surface border-b border-brand-border text-[10px] font-bold uppercase text-brand-text-secondary">
          <span className="col-span-4">Patient</span>
          <span className="col-span-2">Blood & Age</span>
          <span className="col-span-3">Contact</span>
          <span className="col-span-2">Records</span>
          <span className="col-span-1 text-right">Actions</span>
        </div>

        <div className="divide-y divide-brand-border">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-brand-text-secondary animate-pulse">
              Loading patient directory…
            </div>
          ) : patients.length === 0 ? (
            <div className="py-12 text-center text-xs text-brand-text-secondary space-y-2">
              <Users className="w-8 h-8 mx-auto opacity-30" />
              <p>No patient records found.</p>
              <button
                onClick={() => setShowModal(true)}
                className="text-primary hover:underline font-semibold"
              >
                Register a new patient now
              </button>
            </div>
          ) : (
            patients.map((p) => {
              const age = calculateAge(p.dateOfBirth);
              return (
                <div
                  key={p.id}
                  className="grid grid-cols-12 px-5 py-4 items-center text-xs hover:bg-brand-surface/50 transition-colors"
                >
                  {/* Name & MR Identifier */}
                  <div className="col-span-12 md:col-span-4 flex items-center gap-3 mb-2 md:mb-0">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                      {p.firstName.charAt(0)}
                      {p.lastName.charAt(0)}
                    </div>
                    <div>
                      <Link
                        to={`/patients/${p.id}`}
                        className="font-semibold text-brand-text-primary hover:text-primary transition-colors flex items-center gap-1 group"
                      >
                        <span>
                          {p.firstName} {p.lastName}
                        </span>
                        <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                      </Link>
                      <p className="text-[10px] text-brand-text-secondary font-mono">
                        {p.cnic || `ID: ${p.id.slice(0, 8)}`}
                      </p>
                    </div>
                  </div>

                  {/* Blood Group & Age/Gender */}
                  <div className="col-span-6 md:col-span-2 space-y-0.5">
                    {p.bloodGroup && (
                      <span className="inline-block px-2 py-0.5 rounded-btn bg-danger/10 text-danger border border-danger/20 text-[10px] font-bold">
                        {p.bloodGroup}
                      </span>
                    )}
                    <p className="text-[11px] text-brand-text-secondary">
                      {p.gender || '—'} {age ? `• ${age} yrs` : ''}
                    </p>
                  </div>

                  {/* Contact */}
                  <div className="col-span-6 md:col-span-3 space-y-0.5">
                    <p className="text-[11px] font-medium text-brand-text-primary flex items-center gap-1">
                      <Phone className="w-3 h-3 text-brand-text-secondary" />
                      {p.phone || 'No phone'}
                    </p>
                    {p.city && (
                      <p className="text-[10px] text-brand-text-secondary">{p.city}</p>
                    )}
                  </div>

                  {/* Activity/Record Badges */}
                  <div className="col-span-6 md:col-span-2 flex items-center gap-2">
                    <span
                      title="Appointments count"
                      className="px-2 py-0.5 rounded-btn bg-blue-50 text-primary border border-blue-100 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      {p._count?.appointments ?? 0}
                    </span>
                    <span
                      title="Lab reports count"
                      className="px-2 py-0.5 rounded-btn bg-purple-50 text-purple-700 border border-purple-100 text-[10px] font-semibold flex items-center gap-1"
                    >
                      <TestTube className="w-3 h-3" />
                      {p._count?.labReports ?? 0}
                    </span>
                  </div>

                  {/* Actions */}
                  <div className="col-span-6 md:col-span-1 flex items-center justify-end gap-2">
                    <Link
                      to={`/patients/${p.id}`}
                      className="h-7 px-2.5 rounded-btn bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-primary hover:text-white transition-all text-[11px] font-semibold flex items-center"
                    >
                      View
                    </Link>
                    <button
                      onClick={() =>
                        handleDelete(p.id, `${p.firstName} ${p.lastName}`)
                      }
                      title="Delete patient"
                      className="w-7 h-7 rounded-btn border border-danger/20 text-danger hover:bg-danger/10 flex items-center justify-center transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* ─── REGISTER PATIENT MODAL ──────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-2xl p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  Register New Patient
                </h3>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">
                  Enter patient demographics, emergency contact, and medical indicators.
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
              {/* Name Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    First Name *
                  </label>
                  <input
                    required
                    value={form.firstName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, firstName: e.target.value }))
                    }
                    placeholder="e.g. Tariq"
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
                    onChange={(e) =>
                      setForm((f) => ({ ...f, lastName: e.target.value }))
                    }
                    placeholder="e.g. Mehmood"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Contact & CNIC */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={form.phone || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, phone: e.target.value }))
                    }
                    placeholder="+92 300 1234567"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={form.email || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="patient@example.com"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    CNIC / National ID
                  </label>
                  <input
                    value={form.cnic || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, cnic: e.target.value }))
                    }
                    placeholder="35201-XXXXXXX-X"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Demographics & Blood Group */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={form.dateOfBirth || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, dateOfBirth: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Gender
                  </label>
                  <select
                    value={form.gender || 'Male'}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, gender: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none"
                  >
                    {GENDERS.map((g) => (
                      <option key={g} value={g}>
                        {g}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Blood Group
                  </label>
                  <select
                    value={form.bloodGroup || 'B+'}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, bloodGroup: e.target.value }))
                    }
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none"
                  >
                    {BLOOD_GROUPS.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Address */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Address
                  </label>
                  <input
                    value={form.address || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, address: e.target.value }))
                    }
                    placeholder="House / Street details"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    City
                  </label>
                  <input
                    value={form.city || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, city: e.target.value }))
                    }
                    placeholder="e.g. Islamabad"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Emergency Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Emergency Contact Name
                  </label>
                  <input
                    value={form.emergencyContactName || ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        emergencyContactName: e.target.value,
                      }))
                    }
                    placeholder="e.g. Dr. Asif (Spouse)"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Emergency Contact Phone
                  </label>
                  <input
                    type="tel"
                    value={form.emergencyContactPhone || ''}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        emergencyContactPhone: e.target.value,
                      }))
                    }
                    placeholder="+92 300 7654321"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              {/* Allergies & Clinical Notes */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Known Allergies
                  </label>
                  <input
                    value={form.allergies || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, allergies: e.target.value }))
                    }
                    placeholder="e.g. Penicillin, Sulfa, Peanuts"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Medical Notes
                  </label>
                  <input
                    value={form.notes || ''}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder="e.g. Diabetic, previous surgery"
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
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
                      <UserPlus className="w-4 h-4" />
                      <span>Register Patient</span>
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
export default PatientsPage;
