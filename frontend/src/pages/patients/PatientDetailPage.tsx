import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { patientsService } from '../../services/patients.service';
import type {
  PatientDetail,
  LabReport,
  CreateLabReportPayload,
} from '../../services/patients.service';
import {
  ArrowLeft,
  Calendar,
  CreditCard,
  FileText,
  Phone,
  Mail,
  MapPin,
  AlertTriangle,
  TestTube,
  Plus,
  Trash2,
  CheckCircle2,
  Clock,
  X,
  FileCheck,
  AlertCircle,
} from 'lucide-react';

interface TestPreset {
  name: string;
  type: string;
  parameters: { key: string; label: string; unit: string; normalRange: string; defaultValue: string }[];
}

const LAB_TEST_PRESETS: TestPreset[] = [
  {
    name: 'Complete Blood Count (CBC)',
    type: 'CBC',
    parameters: [
      { key: 'hemoglobin', label: 'Hemoglobin (Hb)', unit: 'g/dL', normalRange: '13.0 - 17.0', defaultValue: '14.2' },
      { key: 'wbc', label: 'WBC (Total Leukocyte Count)', unit: '/mcL', normalRange: '4,000 - 11,000', defaultValue: '7,400' },
      { key: 'rbc', label: 'RBC Count', unit: 'M/mcL', normalRange: '4.5 - 5.9', defaultValue: '4.8' },
      { key: 'platelets', label: 'Platelet Count', unit: '/mcL', normalRange: '150,000 - 450,000', defaultValue: '260,000' },
      { key: 'hematocrit', label: 'Hematocrit (PCV)', unit: '%', normalRange: '40 - 50', defaultValue: '42' },
    ],
  },
  {
    name: 'Lipid Profile',
    type: 'Lipid Profile',
    parameters: [
      { key: 'cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', normalRange: '< 200', defaultValue: '185' },
      { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', normalRange: '< 150', defaultValue: '140' },
      { key: 'hdl', label: 'HDL (Good Cholesterol)', unit: 'mg/dL', normalRange: '> 40', defaultValue: '48' },
      { key: 'ldl', label: 'LDL (Bad Cholesterol)', unit: 'mg/dL', normalRange: '< 100', defaultValue: '92' },
    ],
  },
  {
    name: 'Liver Function Test (LFT)',
    type: 'LFT',
    parameters: [
      { key: 'bilirubin', label: 'Total Bilirubin', unit: 'mg/dL', normalRange: '0.2 - 1.2', defaultValue: '0.8' },
      { key: 'sgpt', label: 'ALT / SGPT', unit: 'U/L', normalRange: '7 - 56', defaultValue: '28' },
      { key: 'sgot', label: 'AST / SGOT', unit: 'U/L', normalRange: '10 - 40', defaultValue: '24' },
      { key: 'alk_phos', label: 'Alkaline Phosphatase', unit: 'U/L', normalRange: '44 - 147', defaultValue: '88' },
    ],
  },
  {
    name: 'Renal / Kidney Function Test (RFT)',
    type: 'RFT',
    parameters: [
      { key: 'creatinine', label: 'Serum Creatinine', unit: 'mg/dL', normalRange: '0.7 - 1.3', defaultValue: '0.9' },
      { key: 'urea', label: 'Blood Urea', unit: 'mg/dL', normalRange: '15 - 45', defaultValue: '26' },
      { key: 'uric_acid', label: 'Serum Uric Acid', unit: 'mg/dL', normalRange: '3.5 - 7.2', defaultValue: '5.4' },
    ],
  },
  {
    name: 'Blood Glucose & Glycated Hb (HbA1c)',
    type: 'Diabetes',
    parameters: [
      { key: 'fasting_glucose', label: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL', normalRange: '70 - 99', defaultValue: '92' },
      { key: 'random_glucose', label: 'Random Blood Sugar (RBS)', unit: 'mg/dL', normalRange: '< 140', defaultValue: '115' },
      { key: 'hba1c', label: 'HbA1c', unit: '%', normalRange: '< 5.7', defaultValue: '5.4' },
    ],
  },
];

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [patient, setPatient] = useState<PatientDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'labs' | 'appointments' | 'billing'>('overview');

  // Add Lab Report Modal State
  const [showLabModal, setShowLabModal] = useState(false);
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);
  const [customReportName, setCustomReportName] = useState('');
  const [labValues, setLabValues] = useState<Record<string, string>>({});
  const [fileUrlInput, setFileUrlInput] = useState('');
  const [isAddingLab, setIsAddingLab] = useState(false);

  useEffect(() => {
    if (id) {
      loadPatient();
    }
  }, [id]);

  const loadPatient = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await patientsService.getPatientById(id!);
      setPatient(data);
    } catch {
      setError('Failed to load patient profile.');
    } finally {
      setIsLoading(false);
    }
  };

  // Preset selector
  useEffect(() => {
    const preset = LAB_TEST_PRESETS[selectedPresetIndex];
    if (preset) {
      const initialVals: Record<string, string> = {};
      preset.parameters.forEach((p) => {
        initialVals[p.key] = p.defaultValue;
      });
      setLabValues(initialVals);
      setCustomReportName(preset.name);
    }
  }, [selectedPresetIndex, showLabModal]);

  const handleAddLabReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    try {
      setIsAddingLab(true);
      const preset = LAB_TEST_PRESETS[selectedPresetIndex];
      const payload: CreateLabReportPayload = {
        reportName: customReportName || preset.name,
        testType: preset.type,
        testResults: labValues,
        fileUrl: fileUrlInput || undefined,
      };

      const newReport = await patientsService.addLabReport(id, payload);
      setPatient((prev) =>
        prev
          ? {
              ...prev,
              labReports: [newReport, ...(prev.labReports || [])],
            }
          : null
      );
      setShowLabModal(false);
    } catch {
      setError('Failed to record lab test report.');
    } finally {
      setIsAddingLab(false);
    }
  };

  const handleDeleteLabReport = async (reportId: string) => {
    if (!id || !window.confirm('Delete this lab test report?')) return;
    try {
      await patientsService.deleteLabReport(id, reportId);
      setPatient((prev) =>
        prev
          ? {
              ...prev,
              labReports: (prev.labReports || []).filter((r) => r.id !== reportId),
            }
          : null
      );
    } catch {
      setError('Failed to delete lab report.');
    }
  };

  const calculateAge = (dobString?: string | null) => {
    if (!dobString) return null;
    const dob = new Date(dobString);
    const diffMs = Date.now() - dob.getTime();
    const ageDt = new Date(diffMs);
    return Math.abs(ageDt.getUTCFullYear() - 1970);
  };

  // Helper to parse stored JSON lab report results
  const parseLabResults = (fileUrl?: string) => {
    if (!fileUrl) return null;
    try {
      if (fileUrl.startsWith('{')) {
        return JSON.parse(fileUrl);
      }
    } catch {
      return null;
    }
    return null;
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-6 bg-brand-border rounded-btn w-32" />
        <div className="h-40 bg-brand-border rounded-modal" />
        <div className="h-64 bg-brand-border rounded-card" />
      </div>
    );
  }

  if (error || !patient) {
    return (
      <div className="space-y-4 text-left">
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Patient Directory</span>
        </Link>
        <div className="p-6 bg-danger/10 border border-danger/20 rounded-card text-danger text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error || 'Patient profile could not be loaded.'}</span>
        </div>
      </div>
    );
  }

  const age = calculateAge(patient.dateOfBirth);

  return (
    <div className="space-y-6 text-left">
      {/* Breadcrumb Back Link */}
      <div>
        <Link
          to="/patients"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-text-secondary hover:text-primary transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Patient Directory</span>
        </Link>
      </div>

      {/* ─── PATIENT HEADER CARD ──────────────────────────────────── */}
      <div className="bg-brand-card p-6 rounded-modal border border-brand-border shadow-subtle-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-primary/10 text-primary flex items-center justify-center text-lg font-bold border-2 border-primary/20 shrink-0">
              {patient.firstName.charAt(0)}
              {patient.lastName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h1 className="text-xl font-bold text-brand-text-primary">
                  {patient.firstName} {patient.lastName}
                </h1>
                {patient.bloodGroup && (
                  <span className="px-2.5 py-0.5 rounded-full bg-danger/10 text-danger border border-danger/20 text-xs font-bold">
                    {patient.bloodGroup}
                  </span>
                )}
                <span className="text-xs text-brand-text-secondary font-mono bg-brand-surface px-2 py-0.5 rounded-btn border border-brand-border">
                  {patient.cnic || `ID: ${patient.id.slice(0, 8)}`}
                </span>
              </div>
              <p className="text-xs text-brand-text-secondary mt-1">
                {patient.gender || 'Not specified'} {age ? `• ${age} years old` : ''} • Registered on{' '}
                {new Date(patient.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('labs');
                setShowLabModal(true);
              }}
              className="h-9 px-3.5 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
            >
              <TestTube className="w-4 h-4" />
              <span>Add Lab Report</span>
            </button>
          </div>
        </div>

        {/* Quick Contact & Allergies Alerts */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-brand-border text-xs">
          <div className="flex items-center gap-2 text-brand-text-secondary">
            <Phone className="w-3.5 h-3.5 text-primary" />
            <span>{patient.phone || 'No phone recorded'}</span>
          </div>
          <div className="flex items-center gap-2 text-brand-text-secondary">
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span>{patient.email || 'No email recorded'}</span>
          </div>
          <div className="flex items-center gap-2 text-brand-text-secondary truncate">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span className="truncate">{patient.address ? `${patient.address}, ${patient.city || ''}` : 'No address'}</span>
          </div>
        </div>

        {/* Known Allergies Callout */}
        {patient.allergies && (
          <div className="p-3 rounded-card bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <div>
              <span className="font-bold">Known Allergies: </span>
              <span>{patient.allergies}</span>
            </div>
          </div>
        )}
      </div>

      {/* ─── TABS HEADER ──────────────────────────────────────────── */}
      <div className="flex border-b border-brand-border gap-2">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 border-b-2 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'overview'
              ? 'border-primary text-primary'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Clinical Overview</span>
        </button>

        <button
          onClick={() => setActiveTab('labs')}
          className={`px-4 py-2 border-b-2 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'labs'
              ? 'border-primary text-primary'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <TestTube className="w-4 h-4" />
          <span>Lab Test Reports ({patient.labReports?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('appointments')}
          className={`px-4 py-2 border-b-2 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'appointments'
              ? 'border-primary text-primary'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Visits & Appointments ({patient.appointments?.length || 0})</span>
        </button>

        <button
          onClick={() => setActiveTab('billing')}
          className={`px-4 py-2 border-b-2 text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'billing'
              ? 'border-primary text-primary'
              : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Invoices & Billing ({patient.invoices?.length || 0})</span>
        </button>
      </div>

      {/* ─── TAB 1: CLINICAL OVERVIEW ──────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Emergency Contact */}
          <div className="bg-brand-card p-5 rounded-card border border-brand-border shadow-subtle-sm space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-brand-text-secondary">
              Emergency Contact
            </h3>
            <div className="space-y-1.5 text-xs text-brand-text-primary">
              <p className="font-semibold text-sm">
                {patient.emergencyContactName || 'None specified'}
              </p>
              {patient.emergencyContactPhone && (
                <p className="text-brand-text-secondary flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" />
                  <span>{patient.emergencyContactPhone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Medical Notes */}
          <div className="bg-brand-card p-5 rounded-card border border-brand-border shadow-subtle-sm space-y-3">
            <h3 className="text-xs uppercase font-bold tracking-wider text-brand-text-secondary">
              Medical Notes & Chronic History
            </h3>
            <p className="text-xs text-brand-text-secondary leading-relaxed">
              {patient.notes || 'No general medical notes recorded for this patient.'}
            </p>
          </div>
        </div>
      )}

      {/* ─── TAB 2: LAB TEST REPORTS (CBC, LFT, RFT, ETC.) ───────── */}
      {activeTab === 'labs' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-brand-text-primary">
                Diagnostic & Laboratory Reports
              </h3>
              <p className="text-[11px] text-brand-text-secondary">
                Complete Blood Count (CBC), Metabolic Panels, Lipid Profiles, and urinalysis records.
              </p>
            </div>
            <button
              onClick={() => setShowLabModal(true)}
              className="h-8 px-3 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record New Lab Report</span>
            </button>
          </div>

          {/* Lab Reports List */}
          {patient.labReports && patient.labReports.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {patient.labReports.map((report: LabReport) => {
                const parsed = parseLabResults(report.fileUrl);
                return (
                  <div
                    key={report.id}
                    className="bg-brand-card p-5 rounded-card border border-brand-border shadow-subtle-sm space-y-4 text-left hover:border-primary/40 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-btn bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
                          <TestTube className="w-4.5 h-4.5" />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-brand-text-primary">
                            {report.reportName}
                          </h4>
                          <span className="text-[10px] text-brand-text-secondary flex items-center gap-1 mt-0.5">
                            <Clock className="w-3 h-3" />
                            {new Date(report.uploadedAt).toLocaleDateString()} at{' '}
                            {new Date(report.uploadedAt).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteLabReport(report.id)}
                        className="text-brand-text-secondary hover:text-danger p-1 cursor-pointer transition-colors"
                        title="Delete report"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Render Structured Test Parameter Grid */}
                    {parsed && parsed.results ? (
                      <div className="bg-brand-surface rounded-card p-3 border border-brand-border space-y-2">
                        <div className="grid grid-cols-2 gap-2 text-[11px]">
                          {Object.entries(parsed.results).map(([k, v]) => (
                            <div
                              key={k}
                              className="p-2 rounded-btn bg-white border border-brand-border"
                            >
                              <p className="text-[10px] uppercase font-bold text-brand-text-secondary truncate">
                                {k.replace('_', ' ')}
                              </p>
                              <p className="text-xs font-bold text-brand-text-primary mt-0.5">
                                {String(v)}
                              </p>
                            </div>
                          ))}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-brand-text-secondary pt-1">
                          <span className="flex items-center gap-1 text-success font-semibold">
                            <CheckCircle2 className="w-3 h-3" /> Verified Diagnostic
                          </span>
                          <span>Category: {parsed.testType || 'Laboratory'}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-brand-surface rounded-card border border-brand-border text-xs flex items-center justify-between">
                        <span className="text-brand-text-secondary flex items-center gap-1.5">
                          <FileCheck className="w-4 h-4 text-primary" /> Attached Document
                        </span>
                        <a
                          href={report.fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary hover:underline font-semibold"
                        >
                          View File
                        </a>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-12 text-center bg-brand-card rounded-card border border-brand-border space-y-3">
              <TestTube className="w-8 h-8 text-brand-text-secondary mx-auto opacity-30" />
              <p className="text-xs text-brand-text-secondary">
                No lab test reports recorded for this patient yet.
              </p>
              <button
                onClick={() => setShowLabModal(true)}
                className="h-8 px-4 bg-primary text-white text-xs font-semibold rounded-btn shadow-subtle-sm"
              >
                Add CBC or Other Lab Test
              </button>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 3: VISITS & APPOINTMENTS ─────────────────────────── */}
      {activeTab === 'appointments' && (
        <div className="bg-brand-card rounded-card border border-brand-border shadow-subtle-sm overflow-hidden">
          <div className="px-5 py-3 bg-brand-surface border-b border-brand-border text-[10px] font-bold uppercase text-brand-text-secondary">
            Patient Appointments Timeline
          </div>
          {patient.appointments && patient.appointments.length > 0 ? (
            <div className="divide-y divide-brand-border text-xs">
              {patient.appointments.map((a: any) => (
                <div key={a.id} className="p-4 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <p className="font-semibold text-brand-text-primary">
                      {new Date(a.appointmentDate).toLocaleDateString()} — {a.timeSlot || 'Scheduled'}
                    </p>
                    <p className="text-[10px] text-brand-text-secondary">
                      Doctor: {a.doctor?.specialization || 'Attending Physician'}
                    </p>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-primary border border-blue-100">
                    {a.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-brand-text-secondary">
              No appointments booked yet for this patient.
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 4: BILLING & INVOICES ────────────────────────────── */}
      {activeTab === 'billing' && (
        <div className="bg-brand-card rounded-card border border-brand-border shadow-subtle-sm overflow-hidden">
          <div className="px-5 py-3 bg-brand-surface border-b border-brand-border text-[10px] font-bold uppercase text-brand-text-secondary">
            Invoices History
          </div>
          {patient.invoices && patient.invoices.length > 0 ? (
            <div className="divide-y divide-brand-border text-xs">
              {patient.invoices.map((inv: any) => (
                <div key={inv.id} className="p-4 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-brand-text-primary">
                      Invoice #{inv.invoiceNumber || inv.id.slice(0, 8)}
                    </p>
                    <p className="text-[10px] text-brand-text-secondary">
                      {new Date(inv.invoiceDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-brand-text-primary">
                      PKR {inv.totalAmount || inv.total || '0'}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-success/10 text-success border border-success/20">
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-xs text-brand-text-secondary">
              No invoices generated for this patient yet.
            </div>
          )}
        </div>
      )}

      {/* ─── ADD LAB REPORT MODAL ─────────────────────────────────── */}
      {showLabModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-xl p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  Record Lab Test Report
                </h3>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">
                  Choose a standardized test preset (CBC, LFT, RFT, Lipid) or fill test values.
                </p>
              </div>
              <button
                onClick={() => setShowLabModal(false)}
                className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddLabReport} className="space-y-4">
              {/* Preset Selector */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Test Template Preset
                </label>
                <select
                  value={selectedPresetIndex}
                  onChange={(e) => setSelectedPresetIndex(Number(e.target.value))}
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  {LAB_TEST_PRESETS.map((p, idx) => (
                    <option key={p.name} value={idx}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Test Name Override */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Report Title
                </label>
                <input
                  required
                  value={customReportName}
                  onChange={(e) => setCustomReportName(e.target.value)}
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Dynamic Parameter Value Inputs */}
              <div className="space-y-3 bg-brand-surface p-4 rounded-card border border-brand-border">
                <p className="text-[10px] uppercase font-bold text-brand-text-secondary">
                  Test Parameters & Measured Values
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {LAB_TEST_PRESETS[selectedPresetIndex]?.parameters.map((param) => (
                    <div key={param.key}>
                      <div className="flex items-center justify-between text-[11px] font-semibold text-brand-text-primary mb-1">
                        <span>{param.label}</span>
                        <span className="text-[9px] text-brand-text-secondary font-normal">
                          Ref: {param.normalRange} {param.unit}
                        </span>
                      </div>
                      <div className="relative">
                        <input
                          required
                          value={labValues[param.key] || ''}
                          onChange={(e) =>
                            setLabValues((v) => ({ ...v, [param.key]: e.target.value }))
                          }
                          className="w-full h-9 px-3 pr-12 rounded-input bg-white border border-brand-border text-xs focus:outline-none focus:border-primary font-mono"
                        />
                        <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-brand-text-secondary pointer-events-none">
                          {param.unit}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Optional PDF File URL */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Attachment Document URL (Optional)
                </label>
                <input
                  type="url"
                  placeholder="https://storage.clinicflow.com/reports/..."
                  value={fileUrlInput}
                  onChange={(e) => setFileUrlInput(e.target.value)}
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowLabModal(false)}
                  className="flex-1 h-10 border border-brand-border rounded-btn text-xs font-semibold text-brand-text-secondary hover:bg-brand-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isAddingLab}
                  className="flex-1 h-10 bg-primary hover:bg-blue-700 text-white rounded-btn text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isAddingLab ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <TestTube className="w-4 h-4" />
                      <span>Save Lab Report</span>
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
export default PatientDetailPage;
