import React, { useEffect, useState } from 'react';
import { medicalRecordsService } from '../../services/medical-records.service';
import type {
  MedicalRecord,
  MedicalRecordStats,
  CreateMedicalRecordPayload,
} from '../../services/medical-records.service';
import { patientsService } from '../../services/patients.service';
import type { Patient } from '../../services/patients.service';
import { doctorsService } from '../../services/doctors.service';
import type { Doctor } from '../../services/doctors.service';
import {
  FileText,
  Search,
  Plus,
  Printer,
  Trash2,
  AlertCircle,
  X,
  Building2,
  Phone,
  Calendar,
  Activity,
  UserCheck,
  Stethoscope,
  HeartPulse,
} from 'lucide-react';

const COMMON_DIAGNOSES = [
  'Acute Tonsillitis',
  'Upper Respiratory Tract Infection (URTI)',
  'Essential Hypertension',
  'Type 2 Diabetes Mellitus',
  'Acute Gastroenteritis',
  'Bronchial Asthma',
  'Migraine Headache',
  'Urinary Tract Infection (UTI)',
  'Iron Deficiency Anemia',
  'Generalized Body Aches / Viral Syndrome',
];

export const MedicalRecordsPage: React.FC = () => {
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [stats, setStats] = useState<MedicalRecordStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Encounter Form
  const [form, setForm] = useState<CreateMedicalRecordPayload>({
    patientId: '',
    doctorId: '',
    visitDate: new Date().toISOString().split('T')[0],
    chiefComplaint: '',
    history: '',
    examination: '',
    diagnosis: 'Upper Respiratory Tract Infection (URTI)',
    treatment: '',
    vitals: {
      bp: '120/80',
      pulse: '76',
      temp: '98.6',
      weight: '70',
      spo2: '98',
    },
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [recordsRes, statsRes, patientsRes, docsRes] = await Promise.all([
        medicalRecordsService.listRecords({
          search: search || undefined,
          doctorId: doctorFilter || undefined,
        }),
        medicalRecordsService.getStats(),
        patientsService.listPatients({ limit: 100 }),
        doctorsService.listDoctors({ limit: 100 }),
      ]);
      setRecords(recordsRes.data);
      setStats(statsRes);
      setPatients(patientsRes.data);
      setDoctors(docsRes.data);
    } catch {
      setError('Failed to load clinic medical records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, doctorFilter]);

  const handleCreateEncounter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patientId || !form.doctorId) {
      setError('Please select both a patient and a consulting physician.');
      return;
    }
    try {
      setIsSubmitting(true);
      setError(null);
      await medicalRecordsService.createRecord(form);
      setShowCreateModal(false);
      setForm({
        patientId: '',
        doctorId: '',
        visitDate: new Date().toISOString().split('T')[0],
        chiefComplaint: '',
        history: '',
        examination: '',
        diagnosis: 'Upper Respiratory Tract Infection (URTI)',
        treatment: '',
        vitals: {
          bp: '120/80',
          pulse: '76',
          temp: '98.6',
          weight: '70',
          spo2: '98',
        },
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to record clinical encounter.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this medical record?')) return;
    try {
      await medicalRecordsService.deleteRecord(id);
      loadData();
    } catch {
      setError('Failed to delete medical record.');
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* ─── PAGE HEADER ─────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-primary" />
            <span>Electronic Medical Records (EMR)</span>
          </h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Log structured SOAP encounters, record patient vitals, manage diagnoses, and print consultation summaries.
          </p>
        </div>

        <button
          onClick={() => {
            if (patients.length > 0 && !form.patientId) {
              setForm((f) => ({ ...f, patientId: patients[0].id }));
            }
            if (doctors.length > 0 && !form.doctorId) {
              setForm((f) => ({ ...f, doctorId: doctors[0].id }));
            }
            setShowCreateModal(true);
          }}
          className="h-10 px-4 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>New Clinical Encounter</span>
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

      {/* ─── KPI METRICS STRIP ───────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shrink-0">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Total Encounters</p>
            <p className="text-xl font-extrabold text-brand-text-primary">{stats?.total ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <UserCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Patients Treated</p>
            <p className="text-xl font-extrabold text-brand-text-primary">{stats?.uniquePatientsCount ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Activity className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Today's Visits</p>
            <p className="text-xl font-extrabold text-brand-text-primary">{stats?.todayCount ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Stethoscope className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Top Diagnosis</p>
            <p className="text-xs font-bold text-brand-text-primary truncate max-w-36">
              {stats?.topDiagnoses?.[0]?.diagnosis || 'Clinical OPD'}
            </p>
          </div>
        </div>
      </div>

      {/* ─── SEARCH & FILTER BAR ─────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by diagnosis, chief complaint, treatment, or patient name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={doctorFilter}
          onChange={(e) => setDoctorFilter(e.target.value)}
          className="h-10 px-3 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Consulting Doctors</option>
          {doctors.map((d) => (
            <option key={d.id} value={d.id}>
              {d.fullName} ({d.specialization})
            </option>
          ))}
        </select>
      </div>

      {/* ─── CLINICAL ENCOUNTERS TABLE ───────────────────────────── */}
      <div className="bg-brand-card rounded-card border border-brand-border shadow-subtle-sm overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 px-5 py-3 bg-brand-surface border-b border-brand-border text-[10px] font-bold uppercase text-brand-text-secondary">
          <span className="col-span-3">Patient & Details</span>
          <span className="col-span-3">Diagnosis & Complaint</span>
          <span className="col-span-3">Doctor & Vitals</span>
          <span className="col-span-1">Date</span>
          <span className="col-span-2 text-right">Encounter Actions</span>
        </div>

        <div className="divide-y divide-brand-border">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-brand-text-secondary animate-pulse">
              Loading medical records directory…
            </div>
          ) : records.length === 0 ? (
            <div className="py-12 text-center text-xs text-brand-text-secondary space-y-2">
              <FileText className="w-8 h-8 mx-auto opacity-30 text-brand-text-secondary" />
              <p>No medical records found for the selected criteria.</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="text-primary hover:underline font-semibold text-xs"
              >
                Create your first clinical encounter
              </button>
            </div>
          ) : (
            records.map((r) => (
              <div
                key={r.id}
                className="grid grid-cols-12 px-5 py-4 items-center text-xs hover:bg-brand-surface/50 transition-colors"
              >
                {/* Patient Information */}
                <div className="col-span-12 lg:col-span-3 flex items-center gap-3 mb-2 lg:mb-0">
                  <div className="w-9 h-9 rounded-full bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold text-xs shrink-0">
                    {r.patient?.firstName.slice(0, 1)}
                    {r.patient?.lastName.slice(0, 1)}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-text-primary">
                      {r.patient?.firstName} {r.patient?.lastName}
                    </p>
                    <p className="text-[10px] text-brand-text-secondary flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3" />
                      <span>{r.patient?.phone || 'No phone recorded'}</span>
                      <span>•</span>
                      <span className="text-primary font-semibold">{r.patient?.bloodGroup || 'Blood: N/A'}</span>
                    </p>
                  </div>
                </div>

                {/* Diagnosis & Chief Complaint */}
                <div className="col-span-6 lg:col-span-3 space-y-1">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 font-bold text-[10px]">
                    {r.diagnosis}
                  </span>
                  <p className="text-[11px] text-brand-text-secondary line-clamp-1 italic">
                    "{r.chiefComplaint}"
                  </p>
                </div>

                {/* Doctor & Recorded Vitals */}
                <div className="col-span-6 lg:col-span-3 space-y-1">
                  <p className="font-semibold text-brand-text-primary flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-primary" />
                    <span>{r.doctor?.fullName}</span>
                  </p>
                  {r.vitals && (
                    <div className="flex items-center gap-1.5 flex-wrap text-[10px]">
                      {r.vitals.bp && (
                        <span className="px-1.5 py-0.2 bg-blue-50 text-blue-700 border border-blue-200 rounded font-mono">
                          BP: {r.vitals.bp}
                        </span>
                      )}
                      {r.vitals.pulse && (
                        <span className="px-1.5 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded font-mono">
                          HR: {r.vitals.pulse}
                        </span>
                      )}
                      {r.vitals.temp && (
                        <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 border border-amber-200 rounded font-mono">
                          {r.vitals.temp}°F
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Visit Date */}
                <div className="col-span-6 lg:col-span-1 space-y-0.5">
                  <p className="font-bold text-[11px] text-brand-text-primary flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-brand-text-secondary" />
                    <span>{new Date(r.visitDate).toLocaleDateString()}</span>
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="col-span-6 lg:col-span-2 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      setSelectedRecord(r);
                      setShowDetailModal(true);
                    }}
                    className="h-7 px-2.5 rounded-btn bg-brand-surface border border-brand-border text-brand-text-primary hover:bg-primary hover:text-white transition-all text-[11px] font-semibold cursor-pointer"
                  >
                    View
                  </button>

                  <button
                    onClick={() => {
                      setSelectedRecord(r);
                      setShowPrintModal(true);
                    }}
                    title="Print clinical encounter slip"
                    className="h-7 px-2 rounded-btn bg-blue-50 text-primary border border-blue-100 hover:bg-primary hover:text-white transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Print Slip</span>
                  </button>

                  <button
                    onClick={() => handleDelete(r.id)}
                    title="Delete record"
                    className="w-7 h-7 rounded-btn border border-danger/20 text-danger hover:bg-danger/10 flex items-center justify-center transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── 1. RECORD CLINICAL ENCOUNTER MODAL ───────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-2xl p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  New Clinical Encounter (EMR)
                </h3>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">
                  Record structured patient assessment, examination findings, vitals, and treatment plan.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEncounter} className="space-y-4">
              {/* Patient & Doctor Row */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Patient *
                  </label>
                  <select
                    required
                    value={form.patientId}
                    onChange={(e) => setForm((f) => ({ ...f, patientId: e.target.value }))}
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="">Select a patient…</option>
                    {patients.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.firstName} {p.lastName} — {p.phone || p.id.slice(0, 8)} ({p.bloodGroup || 'Blood: N/A'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Consulting Doctor *
                  </label>
                  <select
                    required
                    value={form.doctorId}
                    onChange={(e) => setForm((f) => ({ ...f, doctorId: e.target.value }))}
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="">Select a doctor…</option>
                    {doctors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.fullName} ({d.specialization})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Visit Date */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Encounter Date *
                </label>
                <input
                  type="date"
                  required
                  value={form.visitDate}
                  onChange={(e) => setForm((f) => ({ ...f, visitDate: e.target.value }))}
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Vitals Strip */}
              <div className="p-3.5 bg-blue-50/50 rounded-card border border-blue-100 space-y-2">
                <p className="text-[10px] font-bold uppercase text-primary flex items-center gap-1.5">
                  <HeartPulse className="w-3.5 h-3.5" />
                  <span>Patient Vital Signs</span>
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  <div>
                    <label className="block text-[9px] font-bold text-brand-text-secondary uppercase">BP (mmHg)</label>
                    <input
                      placeholder="120/80"
                      value={form.vitals?.bp || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, vitals: { ...f.vitals, bp: e.target.value } }))
                      }
                      className="w-full h-8 px-2 rounded-btn bg-white border border-brand-border text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-brand-text-secondary uppercase">Pulse (bpm)</label>
                    <input
                      placeholder="76"
                      value={form.vitals?.pulse || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, vitals: { ...f.vitals, pulse: e.target.value } }))
                      }
                      className="w-full h-8 px-2 rounded-btn bg-white border border-brand-border text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-brand-text-secondary uppercase">Temp (°F)</label>
                    <input
                      placeholder="98.6"
                      value={form.vitals?.temp || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, vitals: { ...f.vitals, temp: e.target.value } }))
                      }
                      className="w-full h-8 px-2 rounded-btn bg-white border border-brand-border text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-brand-text-secondary uppercase">Weight (kg)</label>
                    <input
                      placeholder="70"
                      value={form.vitals?.weight || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, vitals: { ...f.vitals, weight: e.target.value } }))
                      }
                      className="w-full h-8 px-2 rounded-btn bg-white border border-brand-border text-xs font-mono focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-brand-text-secondary uppercase">SpO2 (%)</label>
                    <input
                      placeholder="98"
                      value={form.vitals?.spo2 || ''}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, vitals: { ...f.vitals, spo2: e.target.value } }))
                      }
                      className="w-full h-8 px-2 rounded-btn bg-white border border-brand-border text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Chief Complaint (Subjective) */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Chief Complaint *
                </label>
                <input
                  required
                  placeholder="e.g. Severe headache, persistent cough for 4 days"
                  value={form.chiefComplaint}
                  onChange={(e) => setForm((f) => ({ ...f, chiefComplaint: e.target.value }))}
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* History of Present Illness (HPI) */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  History of Present Illness (HPI)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Patient notes symptoms began on Saturday with low-grade fever and fatigue…"
                  value={form.history || ''}
                  onChange={(e) => setForm((f) => ({ ...f, history: e.target.value }))}
                  className="w-full p-2.5 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Physical Examination & Findings (Objective) */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Physical Examination Findings
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Chest clear on auscultation, throat congested, bilateral wheezing absent…"
                  value={form.examination || ''}
                  onChange={(e) => setForm((f) => ({ ...f, examination: e.target.value }))}
                  className="w-full p-2.5 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Clinical Diagnosis (Assessment) */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Clinical Diagnosis (Assessment) *
                </label>
                <input
                  required
                  list="commonDiagnoses"
                  placeholder="e.g. Acute Tonsillitis"
                  value={form.diagnosis}
                  onChange={(e) => setForm((f) => ({ ...f, diagnosis: e.target.value }))}
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary font-semibold"
                />
                <datalist id="commonDiagnoses">
                  {COMMON_DIAGNOSES.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              {/* Treatment Plan & Advice (Plan) */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Treatment Plan, Medications & Advice *
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Tab Augmentin 625mg 1 tab BD x 5 days, Tab Panadol 500mg SOS, steam inhalation…"
                  value={form.treatment}
                  onChange={(e) => setForm((f) => ({ ...f, treatment: e.target.value }))}
                  className="w-full p-2.5 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Form Action Buttons */}
              <div className="flex gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 h-10 border border-brand-border rounded-btn text-xs font-semibold text-brand-text-secondary hover:bg-brand-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 h-10 bg-primary hover:bg-blue-700 text-white rounded-btn text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-subtle-sm"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <FileText className="w-4 h-4" />
                      <span>Save Clinical Record</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 2. ENCOUNTER DETAIL MODAL ───────────────────────────── */}
      {showDetailModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-xl p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-xs font-bold">
                  {selectedRecord.diagnosis}
                </span>
                <h3 className="text-sm font-bold text-brand-text-primary mt-1">
                  Encounter: {selectedRecord.patient?.firstName} {selectedRecord.patient?.lastName}
                </h3>
              </div>
              <button
                onClick={() => setShowDetailModal(false)}
                className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              {/* Vitals Summary */}
              {selectedRecord.vitals && (
                <div className="p-3 bg-brand-surface rounded-card border border-brand-border flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">Blood Pressure</span>
                    <span className="font-mono font-bold text-brand-text-primary">{selectedRecord.vitals.bp || '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">Heart Rate</span>
                    <span className="font-mono font-bold text-brand-text-primary">{selectedRecord.vitals.pulse ? `${selectedRecord.vitals.pulse} bpm` : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">Temperature</span>
                    <span className="font-mono font-bold text-brand-text-primary">{selectedRecord.vitals.temp ? `${selectedRecord.vitals.temp} °F` : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-brand-text-secondary block">Weight</span>
                    <span className="font-mono font-bold text-brand-text-primary">{selectedRecord.vitals.weight ? `${selectedRecord.vitals.weight} kg` : '—'}</span>
                  </div>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-brand-text-secondary">Chief Complaint</p>
                <p className="p-2.5 bg-brand-surface rounded border border-brand-border">{selectedRecord.chiefComplaint}</p>
              </div>

              {selectedRecord.history && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-brand-text-secondary">History of Present Illness (HPI)</p>
                  <p className="p-2.5 bg-brand-surface rounded border border-brand-border">{selectedRecord.history}</p>
                </div>
              )}

              {selectedRecord.examinationNotes && (
                <div className="space-y-1">
                  <p className="text-[10px] uppercase font-bold text-brand-text-secondary">Physical Examination Findings</p>
                  <p className="p-2.5 bg-brand-surface rounded border border-brand-border">{selectedRecord.examinationNotes}</p>
                </div>
              )}

              <div className="space-y-1">
                <p className="text-[10px] uppercase font-bold text-brand-text-secondary">Treatment Plan & Advice</p>
                <p className="p-2.5 bg-blue-50/50 rounded border border-blue-100 font-medium text-brand-text-primary whitespace-pre-line">
                  {selectedRecord.treatment}
                </p>
              </div>

              <div className="pt-2 flex items-center justify-between text-[11px] text-brand-text-secondary">
                <span>Attending: {selectedRecord.doctor?.fullName}</span>
                <span>Date: {new Date(selectedRecord.visitDate).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-brand-border flex gap-3">
              <button
                onClick={() => {
                  setShowDetailModal(false);
                  setShowPrintModal(true);
                }}
                className="flex-1 h-9 bg-primary text-white rounded-btn text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-subtle-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Slip</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. OFFICIAL PRINTABLE CLINICAL ENCOUNTER SLIP ────────── */}
      {showPrintModal && selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-2xl p-8 space-y-6 text-left max-h-[95vh] overflow-y-auto print:m-0 print:p-6 print:shadow-none print:max-w-none print:w-full">
            {/* Header / Print Controls */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-300 print:hidden">
              <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                Print Preview — Clinical Encounter Summary
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="h-8 px-4 bg-primary text-white rounded-btn text-xs font-bold flex items-center gap-1.5 cursor-pointer hover:bg-blue-700 shadow-subtle-sm"
                >
                  <Printer className="w-4 h-4" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="h-8 px-3 border border-gray-300 rounded-btn text-xs font-bold text-gray-600 hover:bg-gray-100 cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Official Clinic Letterhead */}
            <div className="border-b-2 border-primary pb-4 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black tracking-tight text-gray-900">
                  CLINIC<span className="text-primary">FLOW</span>
                </h1>
                <p className="text-xs text-gray-600 font-medium">Healthcare & Clinical Consultation Services</p>
                <p className="text-[11px] text-gray-500">Official Clinical Examination & Treatment Record</p>
              </div>
              <div className="text-right text-xs text-gray-600">
                <p className="font-bold text-gray-900">Medical Record ID: {selectedRecord.id.slice(0, 8).toUpperCase()}</p>
                <p>Encounter Date: {new Date(selectedRecord.visitDate).toLocaleDateString()}</p>
              </div>
            </div>

            {/* Patient & Doctor Demographics */}
            <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 rounded-lg text-xs border border-gray-200">
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500">Patient Details</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">
                  {selectedRecord.patient?.firstName} {selectedRecord.patient?.lastName}
                </p>
                <p className="text-gray-600 mt-0.5">
                  Phone: {selectedRecord.patient?.phone || 'N/A'} • Blood: {selectedRecord.patient?.bloodGroup || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase font-bold text-gray-500">Attending Physician</p>
                <p className="text-sm font-bold text-gray-900 mt-0.5">{selectedRecord.doctor?.fullName}</p>
                <p className="text-gray-600 mt-0.5">
                  {selectedRecord.doctor?.specialization} • {selectedRecord.doctor?.qualification}
                </p>
              </div>
            </div>

            {/* Vitals Strip */}
            {selectedRecord.vitals && (
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-lg flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">BP</span>
                  <span className="font-bold text-gray-900">{selectedRecord.vitals.bp || '120/80'} mmHg</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Pulse</span>
                  <span className="font-bold text-gray-900">{selectedRecord.vitals.pulse || '72'} bpm</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Temperature</span>
                  <span className="font-bold text-gray-900">{selectedRecord.vitals.temp || '98.6'} °F</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Weight</span>
                  <span className="font-bold text-gray-900">{selectedRecord.vitals.weight || '—'} kg</span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">SpO2</span>
                  <span className="font-bold text-gray-900">{selectedRecord.vitals.spo2 || '98'} %</span>
                </div>
              </div>
            )}

            {/* SOAP Content */}
            <div className="space-y-4 text-xs">
              <div>
                <h4 className="font-bold text-gray-900 uppercase text-[11px] border-b border-gray-200 pb-1">
                  1. Chief Complaint & Subjective History
                </h4>
                <p className="mt-1 text-gray-800 font-semibold">{selectedRecord.chiefComplaint}</p>
                {selectedRecord.history && <p className="mt-0.5 text-gray-600">{selectedRecord.history}</p>}
              </div>

              {selectedRecord.examinationNotes && (
                <div>
                  <h4 className="font-bold text-gray-900 uppercase text-[11px] border-b border-gray-200 pb-1">
                    2. Physical Examination & Findings (Objective)
                  </h4>
                  <p className="mt-1 text-gray-800">{selectedRecord.examinationNotes}</p>
                </div>
              )}

              <div>
                <h4 className="font-bold text-gray-900 uppercase text-[11px] border-b border-gray-200 pb-1">
                  3. Clinical Diagnosis (Assessment)
                </h4>
                <p className="mt-1 text-sm font-extrabold text-primary">{selectedRecord.diagnosis}</p>
              </div>

              <div>
                <h4 className="font-bold text-gray-900 uppercase text-[11px] border-b border-gray-200 pb-1">
                  4. Treatment Plan, Clinical Advice & Medications (Plan)
                </h4>
                <p className="mt-1 text-gray-800 whitespace-pre-line leading-relaxed font-medium">
                  {selectedRecord.treatment}
                </p>
              </div>
            </div>

            {/* Doctor Signature Block */}
            <div className="pt-10 flex items-end justify-between border-t border-gray-300">
              <div className="text-[10px] text-gray-500">
                <p>Generated by ClinicFlow EMR System</p>
                <p>Confidential Medical Record</p>
              </div>
              <div className="text-center w-56">
                <div className="border-b border-gray-800 pb-8" />
                <p className="text-xs font-bold text-gray-900 mt-1">{selectedRecord.doctor?.fullName}</p>
                <p className="text-[10px] text-gray-500">Authorized Physician Signature</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default MedicalRecordsPage;
