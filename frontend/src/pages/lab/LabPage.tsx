import React, { useEffect, useState } from 'react';
import { labService } from '../../services/lab.service';
import type {
  LabOrder,
  LabStats,
  CreateLabOrderPayload,
  LabOrderStatus,
  LabCatalogItem,
} from '../../services/lab.service';
import { patientsService } from '../../services/patients.service';
import type { Patient } from '../../services/patients.service';
import {
  TestTube,
  Search,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  Printer,
  FileCheck2,
  Plus,
  Trash2,
  Flame,
  Activity,
  ClipboardList,
  QrCode,
  ShieldCheck,
  Layers,
  Barcode,
  Check,
} from 'lucide-react';
import { Link } from 'react-router';
import QRCode from 'qrcode';

interface TestPresetDef {
  name: string;
  category: string;
  parameters: { key: string; label: string; unit: string; normalRange: string; min: number; max: number; defaultValue: string }[];
}

const DEFAULT_PRESETS: TestPresetDef[] = [
  {
    name: 'Complete Blood Count (CBC)',
    category: 'Hematology',
    parameters: [
      { key: 'hemoglobin', label: 'Hemoglobin (Hb)', unit: 'g/dL', normalRange: '13.0 - 17.0', min: 13.0, max: 17.0, defaultValue: '14.2' },
      { key: 'wbc', label: 'Total Leukocyte Count (WBC)', unit: '/mcL', normalRange: '4,000 - 11,000', min: 4000, max: 11000, defaultValue: '7400' },
      { key: 'rbc', label: 'Red Blood Cells (RBC)', unit: 'M/mcL', normalRange: '4.5 - 5.9', min: 4.5, max: 5.9, defaultValue: '4.8' },
      { key: 'platelets', label: 'Platelet Count', unit: '/mcL', normalRange: '150,000 - 450,000', min: 150000, max: 450000, defaultValue: '260000' },
      { key: 'hematocrit', label: 'Hematocrit (PCV)', unit: '%', normalRange: '40 - 50', min: 40, max: 50, defaultValue: '42' },
    ],
  },
  {
    name: 'Lipid Profile',
    category: 'Biochemistry',
    parameters: [
      { key: 'cholesterol', label: 'Total Cholesterol', unit: 'mg/dL', normalRange: '< 200', min: 0, max: 200, defaultValue: '185' },
      { key: 'triglycerides', label: 'Triglycerides', unit: 'mg/dL', normalRange: '< 150', min: 0, max: 150, defaultValue: '140' },
      { key: 'hdl', label: 'HDL (Good Cholesterol)', unit: 'mg/dL', normalRange: '> 40', min: 40, max: 100, defaultValue: '48' },
      { key: 'ldl', label: 'LDL (Bad Cholesterol)', unit: 'mg/dL', normalRange: '< 100', min: 0, max: 100, defaultValue: '92' },
    ],
  },
  {
    name: 'Liver Function Test (LFT)',
    category: 'Biochemistry',
    parameters: [
      { key: 'bilirubin', label: 'Total Bilirubin', unit: 'mg/dL', normalRange: '0.2 - 1.2', min: 0.2, max: 1.2, defaultValue: '0.8' },
      { key: 'sgpt', label: 'ALT / SGPT', unit: 'U/L', normalRange: '7 - 56', min: 7, max: 56, defaultValue: '28' },
      { key: 'sgot', label: 'AST / SGOT', unit: 'U/L', normalRange: '10 - 40', min: 10, max: 40, defaultValue: '24' },
      { key: 'alk_phos', label: 'Alkaline Phosphatase', unit: 'U/L', normalRange: '44 - 147', min: 44, max: 147, defaultValue: '88' },
    ],
  },
  {
    name: 'Renal / Kidney Function Test (RFT)',
    category: 'Biochemistry',
    parameters: [
      { key: 'creatinine', label: 'Serum Creatinine', unit: 'mg/dL', normalRange: '0.7 - 1.3', min: 0.7, max: 1.3, defaultValue: '0.9' },
      { key: 'urea', label: 'Blood Urea', unit: 'mg/dL', normalRange: '15 - 45', min: 15, max: 45, defaultValue: '26' },
      { key: 'uric_acid', label: 'Serum Uric Acid', unit: 'mg/dL', normalRange: '3.5 - 7.2', min: 3.5, max: 7.2, defaultValue: '5.4' },
    ],
  },
  {
    name: 'Blood Glucose & Glycated Hb (HbA1c)',
    category: 'Endocrinology',
    parameters: [
      { key: 'fasting_glucose', label: 'Fasting Blood Sugar (FBS)', unit: 'mg/dL', normalRange: '70 - 99', min: 70, max: 99, defaultValue: '92' },
      { key: 'random_glucose', label: 'Random Blood Sugar (RBS)', unit: 'mg/dL', normalRange: '< 140', min: 0, max: 140, defaultValue: '115' },
      { key: 'hba1c', label: 'HbA1c', unit: '%', normalRange: '< 5.7', min: 0, max: 5.7, defaultValue: '5.4' },
    ],
  },
];

export const LabPage: React.FC = () => {
  const [orders, setOrders] = useState<LabOrder[]>([]);
  const [stats, setStats] = useState<LabStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [customCatalog, setCustomCatalog] = useState<LabCatalogItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Combined Presets (Built-in + Custom Catalog items)
  const allPresets: TestPresetDef[] = [
    ...DEFAULT_PRESETS,
    ...customCatalog.map((c) => ({
      name: c.name,
      category: c.category,
      parameters: (c.parameters || []).map((p) => ({
        key: p.paramKey,
        label: p.paramLabel,
        unit: p.unit,
        normalRange: p.normalRange,
        min: 0,
        max: 100,
        defaultValue: '',
      })),
    })),
  ];

  // Order Test Modal
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedPatientId, setSelectedPatientId] = useState('');
  const [selectedPresetIdx, setSelectedPresetIdx] = useState(0);
  const [testNameInput, setTestNameInput] = useState(DEFAULT_PRESETS[0].name);
  const [clinicalNotesInput, setClinicalNotesInput] = useState('');
  const [priorityInput, setPriorityInput] = useState<'ROUTINE' | 'URGENT'>('ROUTINE');
  const [isOrdering, setIsOrdering] = useState(false);

  // Sample Collection Slip Modal
  const [showSampleSlipModal, setShowSampleSlipModal] = useState(false);
  const [activeOrderForSample, setActiveOrderForSample] = useState<LabOrder | null>(null);
  const [sampleTypeInput, setSampleTypeInput] = useState('EDTA Whole Blood (Lavender Top)');
  const [isCollecting, setIsCollecting] = useState(false);

  // Enter Results Modal (Lab Technician Step)
  const [showResultsModal, setShowResultsModal] = useState(false);
  const [activeOrderForResults, setActiveOrderForResults] = useState<LabOrder | null>(null);
  const [resultParamInputs, setResultParamInputs] = useState<
    Record<string, { value: string; unit: string; normalRange: string; flag: 'NORMAL' | 'HIGH' | 'LOW' }>
  >({});
  const [technicianRemarks, setTechnicianRemarks] = useState('');
  const [isSavingResults, setIsSavingResults] = useState(false);

  // Pathologist Sign-Off Modal (Doctor Approval Step)
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [activeOrderForApprove, setActiveOrderForApprove] = useState<LabOrder | null>(null);
  const [pathologistName, setPathologistName] = useState('Dr. Tariq Mahmood (FCPS Path)');
  const [pathologistRemarks, setPathologistRemarks] = useState('All findings verified and authorized for diagnostic release.');
  const [isApproving, setIsApproving] = useState(false);

  // Official Report Print Modal
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [activeReportForPrint, setActiveReportForPrint] = useState<LabOrder | null>(null);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [ordersRes, statsRes, patientsRes, catalogRes] = await Promise.all([
        labService.listOrders({ search: search || undefined, status: statusFilter || undefined }),
        labService.getStats(),
        patientsService.listPatients({ limit: 100 }),
        labService.listCatalog().catch(() => []),
      ]);
      setOrders(ordersRes.data);
      setStats(statsRes);
      setPatients(patientsRes.data);
      setCustomCatalog(catalogRes || []);
    } catch {
      setError('Failed to load clinic laboratory records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  // Handle Preset select
  const handlePresetSelect = (idx: number) => {
    setSelectedPresetIdx(idx);
    const p = allPresets[idx];
    if (p) {
      setTestNameInput(p.name);
    }
  };

  // Submit Order Lab Test
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPatientId) {
      setError('Please select a patient.');
      return;
    }
    try {
      setIsOrdering(true);
      setError(null);
      const preset = allPresets[selectedPresetIdx];
      const payload: CreateLabOrderPayload = {
        patientId: selectedPatientId,
        testName: testNameInput || preset.name,
        testCategory: preset?.category || 'General Pathology',
        clinicalNotes: clinicalNotesInput,
        priority: priorityInput,
      };
      await labService.createOrder(payload);
      setShowOrderModal(false);
      setClinicalNotesInput('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to order lab test.');
    } finally {
      setIsOrdering(false);
    }
  };

  // Open Sample Collection Slip
  const openSampleSlip = (order: LabOrder) => {
    setActiveOrderForSample(order);
    setSampleTypeInput('EDTA Whole Blood (Lavender Top)');
    setShowSampleSlipModal(true);
  };

  // Confirm Sample Collection
  const handleConfirmSampleCollection = async () => {
    if (!activeOrderForSample) return;
    try {
      setIsCollecting(true);
      await labService.collectSample(activeOrderForSample.id, {
        sampleType: sampleTypeInput,
      });
      setShowSampleSlipModal(false);
      loadData();
    } catch {
      setError('Failed to update sample collection state.');
    } finally {
      setIsCollecting(false);
    }
  };

  // Open Results Modal (Tech)
  const openEnterResults = (order: LabOrder) => {
    setActiveOrderForResults(order);
    const matchedPreset =
      allPresets.find((p) => p.name.toLowerCase().includes(order.reportName.toLowerCase())) ||
      allPresets[0];

    const initialParams: Record<string, { value: string; unit: string; normalRange: string; flag: 'NORMAL' | 'HIGH' | 'LOW' }> = {};
    if (order.results && Object.keys(order.results).length > 0) {
      Object.entries(order.results).forEach(([k, v]: [string, any]) => {
        initialParams[k] = {
          value: v.value || v,
          unit: v.unit || '',
          normalRange: v.normalRange || '',
          flag: v.flag || 'NORMAL',
        };
      });
    } else {
      matchedPreset.parameters.forEach((p) => {
        initialParams[p.key] = {
          value: p.defaultValue,
          unit: p.unit,
          normalRange: p.normalRange,
          flag: 'NORMAL',
        };
      });
    }

    setResultParamInputs(initialParams);
    setTechnicianRemarks(order.technicianNotes || '');
    setShowResultsModal(true);
  };

  // Submit Results Entry (Advances to PENDING_APPROVAL)
  const handleSaveResults = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrderForResults) return;
    try {
      setIsSavingResults(true);
      await labService.updateResults(activeOrderForResults.id, {
        status: 'PENDING_APPROVAL',
        results: resultParamInputs,
        technicianNotes: technicianRemarks,
      });
      setShowResultsModal(false);
      loadData();
    } catch {
      setError('Failed to record lab results.');
    } finally {
      setIsSavingResults(false);
    }
  };

  // Open Pathologist Sign-off Modal
  const openApproveModal = (order: LabOrder) => {
    setActiveOrderForApprove(order);
    setShowApproveModal(true);
  };

  // Confirm Pathologist Approval
  const handleApproveReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeOrderForApprove) return;
    try {
      setIsApproving(true);
      await labService.approveOrder(activeOrderForApprove.id, {
        pathologistName,
        pathologistNotes: pathologistRemarks,
      });
      setShowApproveModal(false);
      loadData();
    } catch {
      setError('Failed to authorize lab report.');
    } finally {
      setIsApproving(false);
    }
  };

  // Open Print Modal with Dynamic QR Code
  const openPrintModal = async (order: LabOrder) => {
    setActiveReportForPrint(order);
    try {
      const verifyUrl = `${window.location.origin}/verify/lab/${order.id}`;
      const qrUrl = await QRCode.toDataURL(verifyUrl, {
        width: 140,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      });
      setQrCodeDataUrl(qrUrl);
    } catch (e) {
      console.error('Failed to generate QR Code:', e);
    }
    setShowPrintModal(true);
  };

  // Status Badge Helper
  const getStatusBadge = (status: LabOrderStatus) => {
    switch (status) {
      case 'ORDERED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold">
            Ordered (Awaiting Sample)
          </span>
        );
      case 'SAMPLE_COLLECTED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200 text-[10px] font-bold">
            Sample Collected
          </span>
        );
      case 'IN_PROGRESS':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">
            Testing in Progress
          </span>
        );
      case 'PENDING_APPROVAL':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold flex items-center gap-1 w-fit">
            <Clock className="w-3 h-3" />
            <span>Pending Pathologist Sign-off</span>
          </span>
        );
      case 'COMPLETED':
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold flex items-center gap-1 w-fit">
            <CheckCircle2 className="w-3 h-3" />
            <span>Approved & Signed</span>
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 text-[10px] font-bold">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text-primary flex items-center gap-2">
            <TestTube className="w-5 h-5 text-primary" />
            <span>Laboratory Information System (LIMS)</span>
          </h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Two-step technician entry, pathologist sign-off, printable barcode slips, QR verification, and custom test catalogs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/lab/catalog"
            className="h-10 px-3.5 bg-brand-card hover:bg-brand-bg text-brand-text-primary border border-brand-border text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-1.5 cursor-pointer transition-all"
          >
            <Layers className="w-4 h-4 text-primary" />
            <span>Test Catalog</span>
          </Link>

          <button
            onClick={() => {
              if (patients.length > 0) setSelectedPatientId(patients[0].id);
              setShowOrderModal(true);
            }}
            className="h-10 px-4 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Order Lab Test</span>
          </button>
        </div>
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

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        <div className="bg-brand-card p-3.5 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-btn bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shrink-0">
            <ClipboardList className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Total Orders</p>
            <p className="text-lg font-extrabold text-brand-text-primary">{stats?.totalOrders ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-3.5 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-btn bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Barcode className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Pending Samples</p>
            <p className="text-lg font-extrabold text-brand-text-primary">{stats?.pendingSamples ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-3.5 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-btn bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Activity className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">In Progress</p>
            <p className="text-lg font-extrabold text-brand-text-primary">{stats?.inProgress ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-3.5 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-btn bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Pending Sign-off</p>
            <p className="text-lg font-extrabold text-brand-text-primary">{stats?.pendingApproval ?? 0}</p>
          </div>
        </div>

        <div className="bg-brand-card p-3.5 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-8 h-8 rounded-btn bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Released Today</p>
            <p className="text-lg font-extrabold text-brand-text-primary">{stats?.completedToday ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by patient name, barcode token (SMP-...), or test name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-10 px-3 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="ORDERED">Ordered (Pending Sample)</option>
          <option value="SAMPLE_COLLECTED">Sample Collected</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="PENDING_APPROVAL">Pending Pathologist Sign-off</option>
          <option value="COMPLETED">Approved & Released</option>
        </select>
      </div>

      {/* Orders Queue Table */}
      <div className="bg-brand-card rounded-card border border-brand-border shadow-subtle-sm overflow-hidden">
        <div className="divide-y divide-brand-border">
          {isLoading ? (
            <div className="p-12 text-center text-xs text-brand-text-secondary">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Loading lab orders...</span>
            </div>
          ) : orders.length === 0 ? (
            <div className="p-12 text-center text-xs text-brand-text-secondary">
              <TestTube className="w-8 h-8 mx-auto text-brand-text-secondary/40 mb-2" />
              <p className="font-semibold text-brand-text-primary">No laboratory test orders found</p>
              <p className="mt-0.5">Click "Order Lab Test" above to initiate a clinical investigation.</p>
            </div>
          ) : (
            orders.map((o) => (
              <div
                key={o.id}
                className="grid grid-cols-12 px-5 py-4 items-center text-xs hover:bg-brand-surface/50 transition-colors gap-y-2 md:gap-y-0"
              >
                {/* Patient Details */}
                <div className="col-span-12 md:col-span-3 flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-purple-50 text-purple-700 border border-purple-200 flex items-center justify-center text-xs font-bold shrink-0">
                    {o.patient?.firstName.charAt(0) || 'P'}
                  </div>
                  <div>
                    <p className="font-semibold text-brand-text-primary">
                      {o.patient?.firstName} {o.patient?.lastName}
                    </p>
                    <p className="text-[10px] text-brand-text-secondary font-mono">
                      {o.patient?.cnic || `ID: ${o.patientId.slice(0, 8)}`} • {o.patient?.bloodGroup || 'Blood: N/A'}
                    </p>
                  </div>
                </div>

                {/* Test Name & Barcode Token */}
                <div className="col-span-12 md:col-span-3 space-y-0.5">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="font-bold text-brand-text-primary">{o.reportName}</span>
                    {o.priority === 'URGENT' && (
                      <span className="px-1.5 py-0.2 rounded-btn bg-danger/10 text-danger border border-danger/20 text-[9px] font-bold flex items-center gap-0.5">
                        <Flame className="w-2.5 h-2.5" /> URGENT
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-[10px] text-brand-text-secondary">
                    {o.sampleToken && (
                      <span className="font-mono bg-brand-bg px-1.5 py-0.5 rounded text-brand-text-primary border border-brand-border/60">
                        {o.sampleToken}
                      </span>
                    )}
                    <span>{o.testCategory || 'Diagnostics'}</span>
                  </div>
                </div>

                {/* Status Badge */}
                <div className="col-span-6 md:col-span-3">
                  {getStatusBadge(o.status)}
                </div>

                {/* Actions Pipeline */}
                <div className="col-span-6 md:col-span-3 flex items-center justify-end gap-1.5 flex-wrap">
                  {/* Step 1: Collect Sample & Print Sticker */}
                  <button
                    onClick={() => openSampleSlip(o)}
                    className="h-7 px-2 rounded-btn bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                    title="Print sample collection sticker / barcode"
                  >
                    <Barcode className="w-3.5 h-3.5" />
                    <span className="hidden lg:inline">Vial Slip</span>
                  </button>

                  {/* Step 2: Enter Results (Technician) */}
                  {o.status !== 'COMPLETED' && (
                    <button
                      onClick={() => openEnterResults(o)}
                      className="h-7 px-2 rounded-btn bg-primary hover:bg-blue-700 text-white transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-subtle-sm"
                      title="Technician enters parameters"
                    >
                      <FileCheck2 className="w-3.5 h-3.5" />
                      <span className="hidden lg:inline">Enter Findings</span>
                    </button>
                  )}

                  {/* Step 3: Approve & Sign (Pathologist) */}
                  {o.status === 'PENDING_APPROVAL' && (
                    <button
                      onClick={() => openApproveModal(o)}
                      className="h-7 px-2 rounded-btn bg-indigo-600 hover:bg-indigo-700 text-white transition-all text-[11px] font-bold flex items-center gap-1 cursor-pointer shadow-subtle-sm"
                      title="Pathologist Sign-off"
                    >
                      <ShieldCheck className="w-3.5 h-3.5" />
                      <span>Approve & Sign</span>
                    </button>
                  )}

                  {/* Step 4: Official Report Print (with QR Code) */}
                  {o.status === 'COMPLETED' && (
                    <button
                      onClick={() => openPrintModal(o)}
                      className="h-7 px-2.5 rounded-btn bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Print Official Report with QR verification"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Report</span>
                    </button>
                  )}

                  <button
                    onClick={async () => {
                      if (window.confirm('Delete this test order?')) {
                        await labService.deleteOrder(o.id);
                        loadData();
                      }
                    }}
                    title="Delete order"
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

      {/* ─── 1. ORDER LAB TEST MODAL ──────────────────────────────── */}
      {showOrderModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-lg p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  Order Laboratory Test for Patient
                </h3>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">
                  Select predefined profile or custom clinic test panel
                </p>
              </div>
              <button
                onClick={() => setShowOrderModal(false)}
                className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                  Select Patient *
                </label>
                <select
                  required
                  value={selectedPatientId}
                  onChange={(e) => setSelectedPatientId(e.target.value)}
                  className="w-full h-9 px-3 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                >
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} ({p.cnic || 'No CNIC'} • {p.phone || 'No Phone'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                  Investigation Profile / Preset *
                </label>
                <select
                  value={selectedPresetIdx}
                  onChange={(e) => handlePresetSelect(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                >
                  {allPresets.map((preset, idx) => (
                    <option key={idx} value={idx}>
                      {preset.name} ({preset.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                  Order Priority
                </label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center gap-1.5 text-xs text-brand-text-primary cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value="ROUTINE"
                      checked={priorityInput === 'ROUTINE'}
                      onChange={() => setPriorityInput('ROUTINE')}
                      className="text-primary"
                    />
                    <span>Routine (Standard TAT)</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs text-danger font-semibold cursor-pointer">
                    <input
                      type="radio"
                      name="priority"
                      value="URGENT"
                      checked={priorityInput === 'URGENT'}
                      onChange={() => setPriorityInput('URGENT')}
                      className="text-danger"
                    />
                    <span>Urgent / STAT (Priority Processing)</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                  Clinical Indication / Diagnosis Notes
                </label>
                <textarea
                  rows={2}
                  value={clinicalNotesInput}
                  onChange={(e) => setClinicalNotesInput(e.target.value)}
                  placeholder="e.g. Patient presents with high fever and rash. Rule out Dengue."
                  className="w-full p-2.5 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowOrderModal(false)}
                  className="h-9 px-4 rounded-btn border border-brand-border text-xs font-semibold text-brand-text-secondary hover:bg-brand-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isOrdering}
                  className="h-9 px-4 rounded-btn bg-primary hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isOrdering ? 'Generating Order…' : 'Generate Lab Order'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 2. SAMPLE COLLECTION & BARCODE TOKEN SLIP MODAL ──────── */}
      {showSampleSlipModal && activeOrderForSample && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-md p-6 space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <Barcode className="w-5 h-5 text-amber-600" />
                <h3 className="text-base font-bold text-brand-text-primary">
                  Sample Collection & Vial Sticker
                </h3>
              </div>
              <button
                onClick={() => setShowSampleSlipModal(false)}
                className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Vial Sticker Container */}
            <div
              id="vial-sticker"
              className="p-4 rounded-xl border-2 border-dashed border-slate-300 bg-amber-50/40 text-slate-900 space-y-2 font-mono"
            >
              <div className="flex justify-between items-start border-b border-slate-200 pb-2">
                <div>
                  <p className="text-xs font-bold uppercase">{activeOrderForSample.patient?.firstName} {activeOrderForSample.patient?.lastName}</p>
                  <p className="text-[10px] text-slate-500">
                    MRN: {activeOrderForSample.patient?.cnic || activeOrderForSample.patientId.slice(0, 8)}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs font-extrabold text-amber-800">
                    {activeOrderForSample.sampleToken || 'SMP-PENDING'}
                  </span>
                  <p className="text-[9px] text-slate-400">CLINICFLOW LIMS</p>
                </div>
              </div>

              <div className="text-xs space-y-0.5">
                <p className="font-semibold text-slate-800">{activeOrderForSample.reportName}</p>
                <p className="text-[10px] text-slate-600">Container: {sampleTypeInput}</p>
                <p className="text-[9px] text-slate-400">
                  Collected: {new Date().toLocaleDateString()} {new Date().toLocaleTimeString()}
                </p>
              </div>

              {/* Pseudo Barcode Representation */}
              <div className="pt-2 flex flex-col items-center justify-center">
                <div className="h-8 w-full flex items-stretch justify-center gap-0.5 bg-white p-1 rounded border border-slate-200">
                  {Array.from({ length: 36 }).map((_, i) => (
                    <div
                      key={i}
                      className="bg-black flex-1"
                      style={{
                        opacity: (i * 7) % 3 === 0 ? 0.9 : (i * 5) % 2 === 0 ? 0.4 : 0.8,
                        maxWidth: (i % 4 === 0) ? '3px' : '1.5px',
                      }}
                    />
                  ))}
                </div>
                <span className="text-[9px] font-mono tracking-widest text-slate-600 mt-0.5">
                  *{activeOrderForSample.sampleToken || activeOrderForSample.id.slice(0, 8)}*
                </span>
              </div>
            </div>

            {/* Container Selector */}
            <div>
              <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                Sample Type / Vial Tube
              </label>
              <select
                value={sampleTypeInput}
                onChange={(e) => setSampleTypeInput(e.target.value)}
                className="w-full h-9 px-3 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
              >
                <option value="EDTA Whole Blood (Lavender Top)">EDTA Whole Blood (Lavender Top)</option>
                <option value="Serum / Plain Clot Activator (Red Top)">Serum / Plain Clot Activator (Red Top)</option>
                <option value="Fluoride Oxalate (Grey Top - Glucose)">Fluoride Oxalate (Grey Top - Glucose)</option>
                <option value="Sodium Citrate (Blue Top - Coagulation)">Sodium Citrate (Blue Top - Coagulation)</option>
                <option value="Clean Catch Midstream Urine Container">Clean Catch Midstream Urine Container</option>
                <option value="Sterile Swab / Sputum Cup">Sterile Swab / Sputum Cup</option>
              </select>
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-brand-border">
              <button
                type="button"
                onClick={() => window.print()}
                className="h-9 px-3 rounded-btn border border-brand-border text-xs font-semibold text-brand-text-secondary hover:bg-brand-surface cursor-pointer flex items-center gap-1.5"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Sticker</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowSampleSlipModal(false)}
                  className="h-9 px-3 rounded-btn text-xs font-semibold text-brand-text-secondary hover:bg-brand-surface cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSampleCollection}
                  disabled={isCollecting}
                  className="h-9 px-4 rounded-btn bg-primary hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isCollecting ? 'Saving...' : 'Mark Collected'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 3. ENTER RESULTS MODAL (LAB TECH ENTRY) ──────────────── */}
      {showResultsModal && activeOrderForResults && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-2xl p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  Step 1: Enter Measured Findings — {activeOrderForResults.reportName}
                </h3>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">
                  Patient: {activeOrderForResults.patient?.firstName} {activeOrderForResults.patient?.lastName} • Token: {activeOrderForResults.sampleToken || 'N/A'}
                </p>
              </div>
              <button
                onClick={() => setShowResultsModal(false)}
                className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResults} className="space-y-4">
              <div className="border border-brand-border rounded-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-surface text-[10px] uppercase font-bold text-brand-text-secondary border-b border-brand-border">
                    <tr>
                      <th className="p-3">Investigation Parameter</th>
                      <th className="p-3">Observed Value</th>
                      <th className="p-3">Reference Range</th>
                      <th className="p-3">Flag</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border">
                    {Object.entries(resultParamInputs).map(([key, item]) => (
                      <tr key={key} className="hover:bg-brand-surface/30">
                        <td className="p-3 font-semibold text-brand-text-primary capitalize">
                          {key.replace(/([A-Z])/g, ' $1')}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              value={item.value}
                              onChange={(e) =>
                                setResultParamInputs({
                                  ...resultParamInputs,
                                  [key]: { ...item, value: e.target.value },
                                })
                              }
                              className="w-24 h-8 px-2 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                            />
                            <span className="text-[10px] text-brand-text-secondary font-mono">{item.unit}</span>
                          </div>
                        </td>
                        <td className="p-3 text-brand-text-secondary font-mono text-[11px]">
                          {item.normalRange}
                        </td>
                        <td className="p-3">
                          <select
                            value={item.flag}
                            onChange={(e) =>
                              setResultParamInputs({
                                ...resultParamInputs,
                                [key]: { ...item, flag: e.target.value as any },
                              })
                            }
                            className={`h-8 px-2 rounded-input border text-[11px] font-bold focus:outline-none ${
                              item.flag === 'HIGH'
                                ? 'bg-danger/10 text-danger border-danger/30'
                                : item.flag === 'LOW'
                                ? 'bg-amber-100 text-amber-800 border-amber-300'
                                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            }`}
                          >
                            <option value="NORMAL">NORMAL</option>
                            <option value="HIGH">HIGH ↑</option>
                            <option value="LOW">LOW ↓</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                  Technician Observations / Bench Remarks
                </label>
                <textarea
                  rows={2}
                  value={technicianRemarks}
                  onChange={(e) => setTechnicianRemarks(e.target.value)}
                  placeholder="e.g. Sample was clear, automated analyzer run checked against control."
                  className="w-full p-2.5 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 text-xs flex items-center gap-2.5">
                <ShieldCheck className="w-4 h-4 shrink-0 text-indigo-600" />
                <span>
                  Submitting values will transition this report to <strong>Pending Pathologist Sign-off</strong> for consultant authorization.
                </span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowResultsModal(false)}
                  className="h-9 px-4 rounded-btn border border-brand-border text-xs font-semibold text-brand-text-secondary hover:bg-brand-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingResults}
                  className="h-9 px-4 rounded-btn bg-primary hover:bg-blue-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <FileCheck2 className="w-4 h-4" />
                  <span>{isSavingResults ? 'Submitting…' : 'Submit for Pathologist Review'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 4. PATHOLOGIST SIGN-OFF MODAL (DOCTOR APPROVAL) ──────── */}
      {showApproveModal && activeOrderForApprove && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-lg p-6 space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-brand-text-primary">
                  Step 2: Pathologist Sign-off & Release
                </h3>
              </div>
              <button
                onClick={() => setShowApproveModal(false)}
                className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleApproveReport} className="space-y-4">
              <div className="p-3 bg-brand-surface rounded-card border border-brand-border text-xs space-y-1">
                <p><span className="font-semibold text-brand-text-secondary">Investigation: </span><span className="font-bold text-brand-text-primary">{activeOrderForApprove.reportName}</span></p>
                <p><span className="font-semibold text-brand-text-secondary">Patient: </span>{activeOrderForApprove.patient?.firstName} {activeOrderForApprove.patient?.lastName}</p>
                <p><span className="font-semibold text-brand-text-secondary">Vial Token: </span><span className="font-mono">{activeOrderForApprove.sampleToken || 'SMP-2026'}</span></p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                  Certifying Pathologist Name / Credential *
                </label>
                <input
                  type="text"
                  required
                  value={pathologistName}
                  onChange={(e) => setPathologistName(e.target.value)}
                  className="w-full h-9 px-3 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-text-secondary mb-1">
                  Consultant Pathologist Remarks & Clinical Impression
                </label>
                <textarea
                  rows={2}
                  value={pathologistRemarks}
                  onChange={(e) => setPathologistRemarks(e.target.value)}
                  className="w-full p-2.5 rounded-input bg-brand-bg border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowApproveModal(false)}
                  className="h-9 px-4 rounded-btn border border-brand-border text-xs font-semibold text-brand-text-secondary hover:bg-brand-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isApproving}
                  className="h-9 px-4 rounded-btn bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>{isApproving ? 'Signing...' : 'Approve & Release Report'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── 5. OFFICIAL PRINTABLE CLINIC LAB REPORT MODAL (WITH QR) ─ */}
      {showPrintModal && activeReportForPrint && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-2xl p-8 space-y-6 text-left max-h-[90vh] overflow-y-auto">
            {/* Modal Actions Bar (hidden when printing) */}
            <div className="flex items-center justify-between pb-4 border-b border-brand-border">
              <span className="text-xs font-bold text-brand-text-secondary uppercase">
                Official Laboratory Diagnostic Slip
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="h-8 px-3.5 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Document</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer p-1"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* ─── OFFICIAL CLINIC SLIP CONTENT ─────────────────────── */}
            <div className="space-y-6 border border-brand-border rounded-card p-6 bg-white">
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b-2 border-primary">
                <div>
                  <h2 className="text-xl font-extrabold text-primary tracking-tight">
                    CLINICFLOW DIAGNOSTICS & PATHOLOGY LAB
                  </h2>
                  <p className="text-[11px] text-brand-text-secondary">
                    Sector G-8, Blue Area, Islamabad • Tel: +92 51 9876543
                  </p>
                </div>
                <div className="text-right">
                  <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">
                    VERIFIED & RELEASED
                  </span>
                  <p className="text-[10px] text-brand-text-secondary font-mono mt-1">
                    TOKEN: {activeReportForPrint.sampleToken || activeReportForPrint.id.slice(0, 8).toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Patient & Doctor Demographics Bar */}
              <div className="grid grid-cols-2 gap-4 text-xs bg-brand-surface p-3.5 rounded-card border border-brand-border">
                <div className="space-y-1">
                  <p><span className="font-bold text-brand-text-secondary">Patient Name: </span><span className="font-bold text-brand-text-primary">{activeReportForPrint.patient?.firstName} {activeReportForPrint.patient?.lastName}</span></p>
                  <p><span className="font-bold text-brand-text-secondary">Gender / Age: </span>{activeReportForPrint.patient?.gender || '—'}</p>
                  <p><span className="font-bold text-brand-text-secondary">CNIC / MR: </span><span className="font-mono">{activeReportForPrint.patient?.cnic || activeReportForPrint.patientId.slice(0, 8)}</span></p>
                </div>
                <div className="space-y-1 text-right">
                  <p><span className="font-bold text-brand-text-secondary">Referring Doctor: </span>{activeReportForPrint.doctor?.specialization || 'Attending Physician'}</p>
                  <p><span className="font-bold text-brand-text-secondary">Collection Date: </span>{new Date(activeReportForPrint.uploadedAt).toLocaleDateString()}</p>
                  <p><span className="font-bold text-brand-text-secondary">Report Date: </span>{new Date().toLocaleDateString()}</p>
                </div>
              </div>

              {/* Test Name Banner */}
              <div className="text-center py-2 bg-primary/5 rounded-btn border border-primary/20">
                <h3 className="text-sm font-extrabold text-primary uppercase tracking-wider">
                  {activeReportForPrint.reportName}
                </h3>
              </div>

              {/* Parameters Table */}
              <div className="border border-brand-border rounded-card overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-brand-surface text-[10px] uppercase font-bold text-brand-text-secondary border-b border-brand-border">
                    <tr>
                      <th className="p-3">Investigation</th>
                      <th className="p-3 text-center">Observed Result</th>
                      <th className="p-3 text-center">Reference Range</th>
                      <th className="p-3 text-right">Units</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border font-medium">
                    {activeReportForPrint.results ? (
                      Object.entries(activeReportForPrint.results).map(([key, val]: [string, any]) => (
                        <tr key={key} className="hover:bg-brand-surface/30">
                          <td className="p-3 font-semibold text-brand-text-primary capitalize">
                            {key.replace(/([A-Z])/g, ' $1')}
                          </td>
                          <td className="p-3 text-center">
                            <span className={`inline-flex items-center gap-1 font-bold ${val.flag === 'HIGH' ? 'text-danger font-extrabold' : val.flag === 'LOW' ? 'text-amber-600 font-extrabold' : 'text-brand-text-primary'}`}>
                              {val.value || val}
                              {val.flag === 'HIGH' && <span className="text-[9px] px-1 py-0.2 bg-danger/10 text-danger rounded">HIGH</span>}
                              {val.flag === 'LOW' && <span className="text-[9px] px-1 py-0.2 bg-amber-100 text-amber-800 rounded">LOW</span>}
                            </span>
                          </td>
                          <td className="p-3 text-center text-brand-text-secondary text-[11px] font-mono">
                            {val.normalRange || '—'}
                          </td>
                          <td className="p-3 text-right text-brand-text-secondary font-mono text-[11px]">
                            {val.unit || '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="p-4 text-center text-brand-text-secondary">
                          Standard report findings completed and verified.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pathologist Comments */}
              <div className="pt-2 space-y-3">
                {activeReportForPrint.pathologistNotes && (
                  <div className="text-xs bg-indigo-50/50 p-3 rounded-card border border-indigo-200">
                    <p className="font-bold text-indigo-900 text-[10px] uppercase">Pathologist Remarks & Impression:</p>
                    <p className="text-brand-text-primary mt-0.5 italic">"{activeReportForPrint.pathologistNotes}"</p>
                  </div>
                )}

                {/* Footer with QR Code Verification and Signatures */}
                <div className="flex items-center justify-between pt-4 border-t border-brand-border">
                  {/* Scannable QR Code */}
                  <div className="flex items-center gap-3">
                    {qrCodeDataUrl ? (
                      <img
                        src={qrCodeDataUrl}
                        alt="Verification QR Code"
                        className="w-20 h-20 border border-slate-200 rounded p-1"
                      />
                    ) : (
                      <div className="w-20 h-20 bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400">
                        <QrCode className="w-8 h-8" />
                      </div>
                    )}
                    <div>
                      <p className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Scan to Verify Authenticity</span>
                      </p>
                      <p className="text-[10px] text-slate-500 max-w-[200px]">
                        Scan with any smartphone camera to view cryptographic verification record.
                      </p>
                    </div>
                  </div>

                  {/* Pathologist Sign-off Box */}
                  <div className="text-center w-48 border-t border-brand-border pt-2">
                    <p className="font-bold text-brand-text-primary text-xs">
                      {activeReportForPrint.pathologistName || 'Dr. Tariq Mahmood'}
                    </p>
                    <p className="text-[10px] text-brand-text-secondary">
                      Consultant Pathologist, MBBS, FCPS
                    </p>
                    <p className="text-[9px] text-emerald-600 font-mono mt-0.5">
                      Digitally Signed & Released
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default LabPage;
