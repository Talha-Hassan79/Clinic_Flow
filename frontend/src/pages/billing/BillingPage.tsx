import { useEffect, useState, useCallback } from "react";
import {
  CreditCard,
  Plus,
  Search,
  Printer,
  Trash2,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  X,
  Receipt,
  FileCheck,
  AlertCircle
} from "lucide-react";
import {
  billingService,
  type Invoice,
  type BillingStats,
  type InvoiceStatus,
  type PaymentMethod,
  type CreateInvoicePayload,
  type RecordPaymentPayload,
} from "../../services/billing.service";
import { api } from "../../services/api";
import type { Appointment } from "../../services/appointments.service";
import type { Patient } from "../../services/patients.service";

function formatDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatCurrency(val?: number | null): string {
  return `Rs. ${(val || 0).toLocaleString("en-PK")}`;
}

const PAYMENT_METHODS: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "CASH" },
  { label: "Debit/Credit Card", value: "CARD" },
  { label: "Bank Transfer", value: "BANK_TRANSFER" },
  { label: "JazzCash", value: "JAZZ_CASH" },
  { label: "EasyPaisa", value: "EASY_PAISA" },
  { label: "Online Gateway", value: "ONLINE" },
];

function getStatusBadge(status: InvoiceStatus) {
  switch (status) {
    case "PAID":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">
          <CheckCircle className="w-3.5 h-3.5" /> Paid
        </span>
      );
    case "PARTIALLY_PAID":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
          <Clock className="w-3.5 h-3.5" /> Partially Paid
        </span>
      );
    case "PENDING":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
          <Clock className="w-3.5 h-3.5" /> Pending
        </span>
      );
    case "CANCELLED":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">
          <AlertCircle className="w-3.5 h-3.5" /> Cancelled
        </span>
      );
  }
}

function StatCard({
  label,
  value,
  subtext,
  icon: Icon,
  color,
}: {
  label: string;
  value: string | number;
  subtext?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
        {subtext && <p className="text-xs text-gray-400 mt-0.5">{subtext}</p>}
      </div>
      <div className={`p-3.5 rounded-xl ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  );
}

function PrintInvoiceModal({
  invoice,
  onClose,
}: {
  invoice: Invoice;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="font-semibold text-gray-700">Invoice Printable Slip</h2>
          <div className="flex gap-2">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm cursor-pointer"
            >
              <Printer className="w-4 h-4" /> Print Invoice
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
            >
              <X className="w-4 h-4 text-gray-500" />
            </button>
          </div>
        </div>

        <div id="invoice-print" className="p-8 text-gray-800 font-sans">
          {/* Clinic Header */}
          <div className="border-b-2 border-primary pb-4 mb-6 flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-blue-900">
                {invoice.clinic?.name || "ClinicFlow Medical Centre"}
              </h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {invoice.clinic?.address || "123 Health Street, Lahore, Pakistan"}
              </p>
              <p className="text-xs text-gray-400">
                Phone: {invoice.clinic?.phone || "+92-42-1234567"} | Email:{" "}
                {invoice.clinic?.email || "billing@clinicflow.pk"}
              </p>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold uppercase tracking-widest text-primary bg-blue-50 px-2.5 py-1 rounded-md border border-blue-200">
                OFFICIAL INVOICE
              </span>
              <p className="text-lg font-bold text-gray-900 mt-2">
                {invoice.invoiceNumber}
              </p>
              <p className="text-xs text-gray-500">Date: {formatDate(invoice.issuedAt)}</p>
            </div>
          </div>

          {/* Billed To & Service Details */}
          <div className="grid grid-cols-2 gap-6 bg-gray-50 p-4 rounded-xl mb-6 text-sm">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Billed To (Patient)
              </p>
              <p className="font-bold text-gray-900 text-base">{invoice.patientName}</p>
              <p className="text-xs text-gray-600">Phone: {invoice.patient?.phone || "—"}</p>
              <p className="text-xs text-gray-600">CNIC: {invoice.patient?.cnic || "—"}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">
                Consultation / Service Details
              </p>
              <p className="font-semibold text-gray-800">
                {invoice.doctorName ? `Physician: Dr. ${invoice.doctorName}` : "General Clinical Services"}
              </p>
              {invoice.appointment?.appointmentDate && (
                <p className="text-xs text-gray-600">
                  Appointment: {formatDate(invoice.appointment.appointmentDate)}{" "}
                  {invoice.appointment.appointmentTime || ""}
                </p>
              )}
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-500">Status:</span>
                {getStatusBadge(invoice.status)}
              </div>
            </div>
          </div>

          {/* Line Items */}
          <table className="w-full text-sm mb-6 border-collapse">
            <thead>
              <tr className="bg-blue-900 text-white">
                <th className="text-left px-3 py-2.5 rounded-tl-lg">Description</th>
                <th className="text-right px-3 py-2.5">Rate</th>
                <th className="text-right px-3 py-2.5 rounded-tr-lg">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-3 py-3">
                  <p className="font-semibold text-gray-800">Clinical Consultation / Diagnostics</p>
                  <p className="text-xs text-gray-500">
                    Comprehensive patient evaluation & care administration
                  </p>
                </td>
                <td className="px-3 py-3 text-right text-gray-700">
                  {formatCurrency(invoice.subtotal)}
                </td>
                <td className="px-3 py-3 text-right font-medium text-gray-800">
                  {formatCurrency(invoice.subtotal)}
                </td>
              </tr>
            </tbody>
          </table>

          {/* Totals Breakdown */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span>{formatCurrency(invoice.subtotal)}</span>
              </div>
              {invoice.discount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>- {formatCurrency(invoice.discount)}</span>
                </div>
              )}
              {invoice.tax > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Tax:</span>
                  <span>+ {formatCurrency(invoice.tax)}</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between text-base font-bold text-gray-900">
                <span>Total:</span>
                <span>{formatCurrency(invoice.total)}</span>
              </div>
              <div className="flex justify-between text-green-700 font-semibold">
                <span>Amount Paid:</span>
                <span>{formatCurrency(invoice.amountPaid)}</span>
              </div>
              <div className="flex justify-between text-red-600 font-bold border-t pt-1">
                <span>Balance Due:</span>
                <span>{formatCurrency(invoice.amountRemaining)}</span>
              </div>
            </div>
          </div>

          {/* Payment Receipts History */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mb-6 border-t pt-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Payment History
              </p>
              <div className="space-y-1.5">
                {invoice.payments.map((pm) => (
                  <div
                    key={pm.id}
                    className="flex justify-between text-xs bg-gray-50 p-2 rounded border border-gray-100"
                  >
                    <span>
                      {formatDate(pm.paymentDate)} — <strong className="uppercase">{pm.paymentMethod}</strong>
                      {pm.transactionReference ? ` (Ref: ${pm.transactionReference})` : ""}
                    </span>
                    <span className="font-semibold text-gray-800">
                      {formatCurrency(pm.amount)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer & Signature */}
          <div className="border-t border-dashed border-gray-300 pt-6 flex justify-between items-end">
            <div className="text-xs text-gray-400">
              <p>Thank you for choosing ClinicFlow.</p>
              <p>For billing queries, email finance@clinicflow.pk</p>
            </div>
            <div className="text-center">
              <div className="w-44 border-t-2 border-gray-600 mb-1"></div>
              <p className="text-xs font-semibold text-gray-700">Accounts & Billing Officer</p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body * { visibility: hidden; }
          #invoice-print, #invoice-print * { visibility: visible; }
          #invoice-print { position: fixed; top: 0; left: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>
    </div>
  );
}

function RecordPaymentModal({
  invoice,
  onClose,
  onRecorded,
}: {
  invoice: Invoice;
  onClose: () => void;
  onRecorded: () => void;
}) {
  const [method, setMethod] = useState<PaymentMethod>("CASH");
  const [amount, setAmount] = useState(invoice.amountRemaining.toString());
  const [ref, setRef] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError("Please enter a valid positive payment amount");
      return;
    }
    if (numAmount > invoice.amountRemaining) {
      setError(`Amount cannot exceed the remaining balance (${formatCurrency(invoice.amountRemaining)})`);
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload: RecordPaymentPayload = {
        paymentMethod: method,
        amount: numAmount,
        transactionReference: ref.trim() || undefined,
        notes: notes.trim() || undefined,
      };
      await billingService.recordPayment(invoice.id, payload);
      onRecorded();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Failed to record payment");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Record Payment</h2>
            <p className="text-xs text-gray-400">{invoice.invoiceNumber} — {invoice.patientName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs">
              {error}
            </div>
          )}

          <div className="bg-blue-50/70 p-3.5 rounded-xl flex justify-between items-center text-sm">
            <div>
              <p className="text-xs text-gray-500">Remaining Balance</p>
              <p className="text-lg font-bold text-blue-900">{formatCurrency(invoice.amountRemaining)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Total Bill</p>
              <p className="text-sm font-semibold text-gray-700">{formatCurrency(invoice.total)}</p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Payment Method *
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={method}
              onChange={(e) => setMethod(e.target.value as PaymentMethod)}
            >
              {PAYMENT_METHODS.map((pm) => (
                <option key={pm.value} value={pm.value}>
                  {pm.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Amount (PKR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-gray-400">
                Rs.
              </span>
              <input
                type="number"
                min="0.01"
                step="any"
                className="w-full border rounded-lg pl-10 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Transaction Reference / Slip No.
            </label>
            <input
              type="text"
              placeholder="e.g. TXN-94821 or Cash Slip"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={ref}
              onChange={(e) => setRef(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Internal Notes
            </label>
            <textarea
              rows={2}
              placeholder="e.g. Paid at reception counter"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="px-5 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              {loading ? "Recording…" : "Confirm Payment"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateInvoiceModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState("");
  const [selectedAppointmentId, setSelectedAppointmentId] = useState("");
  const [subtotal, setSubtotal] = useState("1500");
  const [discount, setDiscount] = useState("0");
  const [tax, setTax] = useState("0");
  const [dueDate, setDueDate] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: Patient[] } | Patient[]>("/patients", { params: { limit: 100 } })
      .then((r: { data: { data?: Patient[] } | Patient[] }) => {
        const pts = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setPatients(pts);
      })
      .catch(() => {});

    api.get<{ data: Appointment[] } | Appointment[]>("/appointments", { params: { limit: 100 } })
      .then((r: { data: { data?: Appointment[] } | Appointment[] }) => {
        const apts = Array.isArray(r.data) ? r.data : r.data?.data ?? [];
        setAppointments(apts);
      })
      .catch(() => {});
  }, []);

  const handleAppointmentChange = (aptId: string) => {
    setSelectedAppointmentId(aptId);
    if (!aptId) return;
    const apt = appointments.find((a) => a.id === aptId);
    if (apt) {
      setSelectedPatientId(apt.patientId);
      if (apt.doctor?.consultationFee) {
        setSubtotal(apt.doctor.consultationFee.toString());
      }
    }
  };

  const calculatedTotal = Math.max(
    0,
    (parseFloat(subtotal) || 0) - (parseFloat(discount) || 0) + (parseFloat(tax) || 0)
  );

  const handleSubmit = async () => {
    if (!selectedPatientId) {
      setError("Please select a patient");
      return;
    }
    const sub = parseFloat(subtotal);
    if (isNaN(sub) || sub < 0) {
      setError("Please enter a valid subtotal amount");
      return;
    }

    setLoading(true);
    setError("");
    try {
      const payload: CreateInvoicePayload = {
        patientId: selectedPatientId,
        appointmentId: selectedAppointmentId || undefined,
        subtotal: sub,
        discount: parseFloat(discount) || 0,
        tax: parseFloat(tax) || 0,
        dueDate: dueDate || undefined,
      };
      await billingService.create(payload);
      onCreated();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e?.response?.data?.message || "Failed to create invoice");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex items-center justify-between p-5 border-b">
          <h2 className="font-bold text-gray-800 text-lg">Generate New Invoice</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-xs">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Link Appointment (Optional)
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedAppointmentId}
              onChange={(e) => handleAppointmentChange(e.target.value)}
            >
              <option value="">No appointment (Ad-hoc Service/Diagnostics)</option>
              {appointments.map((apt) => (
                <option key={apt.id} value={apt.id}>
                  {apt.patient?.firstName} {apt.patient?.lastName} — {apt.doctor?.fullName} ({formatDate(apt.appointmentDate)})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Select Patient *
            </label>
            <select
              className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedPatientId}
              onChange={(e) => setSelectedPatientId(e.target.value)}
            >
              <option value="">Choose Patient…</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.firstName} {p.lastName} {p.phone ? `(${p.phone})` : ""}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Subtotal (PKR) *
              </label>
              <input
                type="number"
                min="0"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={subtotal}
                onChange={(e) => setSubtotal(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Discount
              </label>
              <input
                type="number"
                min="0"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={discount}
                onChange={(e) => setDiscount(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
                Tax
              </label>
              <input
                type="number"
                min="0"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={tax}
                onChange={(e) => setTax(e.target.value)}
              />
            </div>
          </div>

          <div className="bg-gray-50 p-3.5 rounded-xl flex justify-between items-center text-sm">
            <span className="font-semibold text-gray-700">Total Calculated Invoice:</span>
            <span className="text-lg font-bold text-blue-900">{formatCurrency(calculatedTotal)}</span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase mb-1">
              Due Date (Optional)
            </label>
            <input
              type="date"
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              disabled={loading}
              onClick={handleSubmit}
              className="px-5 py-2 text-sm bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              {loading ? "Generating…" : "Generate Invoice"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [stats, setStats] = useState<BillingStats>({
    totalInvoices: 0,
    pendingCount: 0,
    paidCount: 0,
    revenueToday: 0,
    revenueThisMonth: 0,
    totalRevenue: 0,
  });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [activePaymentInvoice, setActivePaymentInvoice] = useState<Invoice | null>(null);
  const [printInvoice, setPrintInvoice] = useState<Invoice | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        billingService.list({
          search: search || undefined,
          status: statusFilter !== "ALL" ? (statusFilter as InvoiceStatus) : undefined,
        }),
        billingService.getStats(),
      ]);
      setInvoices(list);
      setStats(s);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to cancel and archive this invoice?")) return;
    await billingService.remove(id);
    loadData();
  };

  const handlePrint = async (id: string) => {
    const inv = await billingService.findOne(id);
    setPrintInvoice(inv);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Receipt className="w-7 h-7 text-blue-600" /> Billing &amp; Invoices
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Manage patient invoices, payment collections, and revenue insights
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium text-sm shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> Create Invoice
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Today's Revenue"
          value={formatCurrency(stats.revenueToday)}
          icon={DollarSign}
          color="bg-emerald-500"
        />
        <StatCard
          label="This Month"
          value={formatCurrency(stats.revenueThisMonth)}
          icon={TrendingUp}
          color="bg-blue-600"
        />
        <StatCard
          label="Pending Invoices"
          value={stats.pendingCount}
          subtext="Awaiting full settlement"
          icon={Clock}
          color="bg-amber-500"
        />
        <StatCard
          label="Total Collected"
          value={formatCurrency(stats.totalRevenue)}
          subtext={`${stats.paidCount} fully paid`}
          icon={FileCheck}
          color="bg-indigo-600"
        />
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
            placeholder="Search invoice number, patient…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {["ALL", "PENDING", "PARTIALLY_PAID", "PAID", "CANCELLED"].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                statusFilter === st
                  ? "bg-blue-600 text-white"
                  : "bg-white border text-gray-600 hover:bg-gray-50"
              }`}
            >
              {st.replace("_", " ")}
            </button>
          ))}
        </div>
      </div>

      {/* Invoices Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">
            Loading invoices…
          </div>
        ) : invoices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <CreditCard className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No invoices found</p>
            <p className="text-xs mt-1">Generate your first invoice to begin tracking billing</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Invoice #
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Doctor / Appt
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="text-right px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Balance
                  </th>
                  <th className="text-center px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {invoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 font-semibold text-blue-900">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-semibold text-gray-800">{inv.patientName}</p>
                      <p className="text-xs text-gray-400">{inv.patient?.phone || ""}</p>
                    </td>
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {inv.doctorName ? `Dr. ${inv.doctorName}` : "General"}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-gray-900">
                      {formatCurrency(inv.total)}
                    </td>
                    <td className="px-4 py-3 text-right font-medium text-green-700">
                      {formatCurrency(inv.amountPaid)}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-red-600">
                      {formatCurrency(inv.amountRemaining)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {getStatusBadge(inv.status)}
                    </td>
                    <td className="px-4 py-3 text-xs text-gray-500">
                      {formatDate(inv.issuedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1.5">
                        {inv.status !== "PAID" && inv.status !== "CANCELLED" && (
                          <button
                            onClick={() => setActivePaymentInvoice(inv)}
                            className="flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-md font-semibold cursor-pointer"
                          >
                            <DollarSign className="w-3.5 h-3.5" /> Pay
                          </button>
                        )}
                        <button
                          onClick={() => handlePrint(inv.id)}
                          title="Print Official Invoice"
                          className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 cursor-pointer"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                        {inv.status !== "CANCELLED" && (
                          <button
                            onClick={() => handleDelete(inv.id)}
                            title="Cancel Invoice"
                            className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-500 cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modals */}
      {showCreate && (
        <CreateInvoiceModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            loadData();
          }}
        />
      )}

      {activePaymentInvoice && (
        <RecordPaymentModal
          invoice={activePaymentInvoice}
          onClose={() => setActivePaymentInvoice(null)}
          onRecorded={() => {
            setActivePaymentInvoice(null);
            loadData();
          }}
        />
      )}

      {printInvoice && (
        <PrintInvoiceModal
          invoice={printInvoice}
          onClose={() => setPrintInvoice(null)}
        />
      )}
    </div>
  );
}
