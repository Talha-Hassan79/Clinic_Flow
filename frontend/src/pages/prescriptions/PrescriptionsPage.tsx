import { useEffect, useState, useCallback } from "react";
import {
  FileText, Plus, Search, Printer, Trash2, Eye,
  ClipboardList, CalendarCheck, TrendingUp, X,
} from "lucide-react";
import {
  prescriptionsService,
  type Prescription,
  type PrescriptionStats,
  type PrescriptionItemInput,
  type CreatePrescriptionPayload,
} from "../../services/prescriptions.service";
import { api } from "../../services/api";
import type { Appointment } from "../../services/appointments.service";

function parseRoute(notes?: string | null): string {
  if (!notes) return "";
  const match = notes.match(/^route:([^|]*)/);
  return match ? match[1] : "";
}

function parseNotes(notes?: string | null): string {
  if (!notes) return "";
  return notes.replace(/^route:[^|]*\|?/, "");
}

function formatDate(d?: string | null): string {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-PK", { year: "numeric", month: "short", day: "numeric" });
}

const EMPTY_ITEM: PrescriptionItemInput = {
  medicineName: "",
  dosage: "",
  route: "Oral",
  frequency: "",
  duration: "",
  quantity: undefined,
  notes: "",
};

const ROUTES = ["Oral", "IV", "IM", "SC", "Topical", "Inhalation", "SL", "Rectal", "Nasal", "Ophthalmic"];
const FREQUENCIES = [
  "Once daily (OD)",
  "Twice daily (BD)",
  "Three times daily (TDS)",
  "Four times daily (QDS)",
  "Every 8 hours",
  "Every 6 hours",
  "As needed (SOS)",
  "At bedtime (HS)",
  "Every other day",
  "Weekly",
];

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
      <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6 text-white" /></div>
      <div>
        <p className="text-2xl font-bold text-gray-800">{value}</p>
        <p className="text-sm text-gray-500">{label}</p>
      </div>
    </div>
  );
}

function PrintModal({ rx, onClose }: { rx: Prescription; onClose: () => void }) {
  const patientName = rx.patientName || `${rx.patient?.firstName ?? ""} ${rx.patient?.lastName ?? ""}`.trim() || "Unknown Patient";
  const dob = rx.patient?.dateOfBirth ? formatDate(rx.patient.dateOfBirth) : "—";
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b no-print">
          <h2 className="font-semibold text-gray-700">Rx Slip Preview</h2>
          <div className="flex gap-2">
            <button onClick={() => window.print()} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"><X className="w-4 h-4 text-gray-500" /></button>
          </div>
        </div>
        <div id="rx-print" className="p-8 font-serif text-gray-800">
          <div className="text-center border-b-2 border-blue-700 pb-4 mb-6">
            <h1 className="text-2xl font-bold text-blue-800 tracking-wide">ClinicFlow Medical Centre</h1>
            <p className="text-sm text-gray-500 mt-1">123 Health Street, Lahore, Pakistan | Tel: +92-42-1234567</p>
            <p className="text-xs text-gray-400 mt-0.5">www.clinicflow.pk | info@clinicflow.pk</p>
          </div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Prescribing Physician</p>
              <p className="font-bold text-gray-800 text-lg">{rx.doctorName}</p>
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Date</p>
              <p className="font-semibold text-gray-700">{formatDate(rx.createdAt)}</p>
            </div>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 mb-6 grid grid-cols-2 gap-3 text-sm">
            <div><span className="text-gray-500">Patient: </span><span className="font-semibold">{patientName}</span></div>
            <div><span className="text-gray-500">DOB: </span><span>{dob}</span></div>
            <div><span className="text-gray-500">Gender: </span><span className="capitalize">{rx.patient?.gender ?? "—"}</span></div>
            <div><span className="text-gray-500">Phone: </span><span>{rx.patient?.phone ?? "—"}</span></div>
          </div>
          {rx.diagnosis && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">Diagnosis</p>
              <p className="text-gray-800 font-medium">{rx.diagnosis}</p>
            </div>
          )}
          <div className="mb-6">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-4xl font-bold text-blue-700 leading-none" style={{ fontFamily: "serif" }}>&#8478;</span>
              <span className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Prescription</span>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-blue-700 text-white">
                  <th className="text-left px-3 py-2 rounded-tl-lg">#</th>
                  <th className="text-left px-3 py-2">Medicine</th>
                  <th className="text-left px-3 py-2">Dosage</th>
                  <th className="text-left px-3 py-2">Route</th>
                  <th className="text-left px-3 py-2">Frequency</th>
                  <th className="text-left px-3 py-2 rounded-tr-lg">Duration</th>
                </tr>
              </thead>
              <tbody>
                {rx.items.map((item, i) => (
                  <tr key={item.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 text-gray-500">{i + 1}</td>
                    <td className="px-3 py-2 font-semibold">{item.medicine.name}</td>
                    <td className="px-3 py-2">{item.dosage ?? "—"}</td>
                    <td className="px-3 py-2">{parseRoute(item.notes) || "—"}</td>
                    <td className="px-3 py-2">{item.frequency ?? "—"}</td>
                    <td className="px-3 py-2">{item.duration ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rx.instructions && (
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-3 rounded">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Special Instructions</p>
              <p className="text-sm text-gray-700">{rx.instructions}</p>
            </div>
          )}
          {rx.followUpDate && (
            <div className="mb-6">
              <p className="text-sm"><span className="text-gray-500">Follow-up: </span><span className="font-semibold">{formatDate(rx.followUpDate)}</span></p>
            </div>
          )}
          <div className="border-t border-dashed border-gray-300 pt-6 flex justify-end">
            <div className="text-center">
              <div className="w-48 border-t-2 border-gray-600 mt-8 mb-2"></div>
              <p className="font-semibold text-gray-800">{rx.doctorName}</p>
              <p className="text-xs text-gray-500">Physician Signature &amp; Stamp</p>
            </div>
          </div>
          <div className="mt-6 pt-3 border-t border-gray-200 text-center text-xs text-gray-400">
            <p>This prescription is valid for 30 days from the date of issue.</p>
            <p className="mt-0.5">Generated by ClinicFlow HMS — {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>
      <style>{`@media print { body * { visibility: hidden; } #rx-print, #rx-print * { visibility: visible; } #rx-print { position: fixed; top: 0; left: 0; width: 100%; padding: 20px; } .no-print { display: none !important; } }`}</style>
    </div>
  );
}

function DetailModal({ rx, onClose, onPrint }: { rx: Prescription; onClose: () => void; onPrint: () => void }) {
  const patientName = rx.patientName || `${rx.patient?.firstName ?? ""} ${rx.patient?.lastName ?? ""}`.trim() || "Unknown Patient";
  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b rounded-t-2xl">
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Prescription Details</h2>
            <p className="text-sm text-gray-500">{patientName}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onPrint} className="flex items-center gap-1.5 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 text-sm cursor-pointer">
              <Printer className="w-4 h-4" /> Print Rx
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div><p className="text-gray-400 text-xs uppercase font-medium">Patient</p><p className="font-semibold text-gray-800">{patientName}</p></div>
            <div><p className="text-gray-400 text-xs uppercase font-medium">Doctor</p><p className="font-semibold text-gray-800">{rx.doctorName}</p></div>
            <div><p className="text-gray-400 text-xs uppercase font-medium">Date</p><p className="text-gray-700">{formatDate(rx.createdAt)}</p></div>
            <div><p className="text-gray-400 text-xs uppercase font-medium">Follow-up</p><p className="text-gray-700">{formatDate(rx.followUpDate)}</p></div>
            {rx.diagnosis && <div className="col-span-2"><p className="text-gray-400 text-xs uppercase font-medium">Diagnosis</p><p className="text-gray-700">{rx.diagnosis}</p></div>}
            {rx.instructions && <div className="col-span-2"><p className="text-gray-400 text-xs uppercase font-medium">Instructions</p><p className="text-gray-700">{rx.instructions}</p></div>}
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Medicines</p>
            <div className="space-y-2">
              {rx.items.map((item, i) => (
                <div key={item.id} className="bg-gray-50 rounded-lg p-3">
                  <p className="font-semibold text-gray-800 text-sm">{i + 1}. {item.medicine.name}</p>
                  <div className="flex flex-wrap gap-2 mt-1 text-xs text-gray-500">
                    {item.dosage && <span className="bg-white border rounded px-2 py-0.5">&#128138; {item.dosage}</span>}
                    {parseRoute(item.notes) && <span className="bg-white border rounded px-2 py-0.5">Route: {parseRoute(item.notes)}</span>}
                    {item.frequency && <span className="bg-white border rounded px-2 py-0.5">&#9201; {item.frequency}</span>}
                    {item.duration && <span className="bg-white border rounded px-2 py-0.5">&#128197; {item.duration}</span>}
                    {item.quantity && <span className="bg-white border rounded px-2 py-0.5">Qty: {item.quantity}</span>}
                  </div>
                  {parseNotes(item.notes) && <p className="text-xs text-gray-400 mt-1">{parseNotes(item.notes)}</p>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [step, setStep] = useState<1 | 2>(1);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [selectedAppt, setSelectedAppt] = useState<Appointment | null>(null);
  const [apptSearch, setApptSearch] = useState("");
  const [diagnosis, setDiagnosis] = useState("");
  const [instructions, setInstructions] = useState("");
  const [followUpDate, setFollowUpDate] = useState("");
  const [items, setItems] = useState<PrescriptionItemInput[]>([{ ...EMPTY_ITEM }]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    api.get<{ data: Appointment[] } | Appointment[]>("/appointments", { params: { limit: 200 } })
      .then((res: { data: { data?: Appointment[] } | Appointment[] }) => {
        const appts = Array.isArray(res.data) ? res.data : res.data?.data ?? [];
        setAppointments(appts);
      })
      .catch(() => {});
  }, []);

  const filteredAppts = appointments.filter((a) => {
    const name = `${a.patient?.firstName ?? ""} ${a.patient?.lastName ?? ""}`.toLowerCase();
    return !apptSearch || name.includes(apptSearch.toLowerCase());
  });

  const addItem = () => setItems((prev) => [...prev, { ...EMPTY_ITEM }]);
  const removeItem = (i: number) => setItems((prev) => prev.filter((_, idx) => idx !== i));
  const updateItem = (i: number, field: keyof PrescriptionItemInput, value: string | number) => {
    setItems((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  };

  const handleSubmit = async () => {
    if (!selectedAppt) { setError("Please select an appointment"); return; }
    const validItems = items.filter((it) => it.medicineName.trim());
    if (!validItems.length) { setError("Add at least one medicine"); return; }
    setLoading(true);
    setError("");
    try {
      const payload: CreatePrescriptionPayload = {
        patientId: selectedAppt.patientId,
        doctorId: selectedAppt.doctorId,
        appointmentId: selectedAppt.id,
        diagnosis: diagnosis || undefined,
        instructions: instructions || undefined,
        followUpDate: followUpDate || undefined,
        items: validItems,
      };
      await prescriptionsService.create(payload);
      onCreated();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      setError(err?.response?.data?.message ?? "Failed to create prescription");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-40 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-3xl max-h-[95vh] overflow-y-auto">
        <div className="sticky top-0 bg-white flex items-center justify-between p-5 border-b rounded-t-2xl z-10">
          <h2 className="font-bold text-gray-800 text-lg">New Prescription</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-lg cursor-pointer"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-5 space-y-5">
          {error && <div className="bg-red-50 border border-red-200 text-red-600 rounded-lg p-3 text-sm">{error}</div>}

          {step === 1 && (
            <div>
              <p className="text-sm font-semibold text-gray-600 mb-3">Step 1 — Select Appointment</p>
              <div className="relative mb-3">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input className="w-full border rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Search by patient name…" value={apptSearch} onChange={(e) => setApptSearch(e.target.value)} />
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 border rounded-xl p-2">
                {filteredAppts.length === 0 && <p className="text-center text-gray-400 text-sm py-6">No appointments found</p>}
                {filteredAppts.map((appt) => {
                  const pName = `${appt.patient?.firstName ?? ""} ${appt.patient?.lastName ?? ""}`.trim();
                  const dName = appt.doctor?.fullName || "Doctor";
                  const isSelected = selectedAppt?.id === appt.id;
                  return (
                    <button key={appt.id} onClick={() => setSelectedAppt(appt)} className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-blue-300"}`}>
                      <p className="font-semibold text-gray-800 text-sm">{pName || "Unknown Patient"}</p>
                      <p className="text-xs text-gray-500">{dName} — {formatDate(appt.appointmentDate)}</p>
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-end mt-4">
                <button disabled={!selectedAppt} onClick={() => setStep(2)} className="bg-blue-600 text-white px-5 py-2 rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 cursor-pointer">
                  Next: Write Prescription
                </button>
              </div>
            </div>
          )}

          {step === 2 && selectedAppt && (
            <div className="space-y-5">
              <button onClick={() => setStep(1)} className="text-sm text-blue-600 hover:underline cursor-pointer">&#8592; Change appointment</button>
              <div className="bg-blue-50 rounded-lg p-3 text-sm">
                <p className="font-semibold text-gray-800">{`${selectedAppt.patient?.firstName ?? ""} ${selectedAppt.patient?.lastName ?? ""}`.trim() || "Patient"}</p>
                <p className="text-gray-500">{selectedAppt.doctor?.fullName || "Doctor"} — {formatDate(selectedAppt.appointmentDate)}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Diagnosis</label>
                  <input className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Upper Respiratory Tract Infection" value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Special Instructions</label>
                  <textarea className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" rows={2} placeholder="e.g. Take with food, avoid driving…" value={instructions} onChange={(e) => setInstructions(e.target.value)} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Follow-up Date</label>
                  <input type="date" className="w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" value={followUpDate} onChange={(e) => setFollowUpDate(e.target.value)} />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-gray-700">Medicines</p>
                  <button onClick={addItem} className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium cursor-pointer"><Plus className="w-4 h-4" /> Add Medicine</button>
                </div>
                <div className="space-y-3">
                  {items.map((item, i) => (
                    <div key={i} className="border rounded-xl p-4 bg-gray-50 relative">
                      {items.length > 1 && <button onClick={() => removeItem(i)} className="absolute top-3 right-3 text-red-400 hover:text-red-600 cursor-pointer"><Trash2 className="w-4 h-4" /></button>}
                      <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Medicine #{i + 1}</p>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Medicine Name *</label>
                          <input className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Amoxicillin 500mg" value={item.medicineName} onChange={(e) => updateItem(i, "medicineName", e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Dosage</label>
                          <input className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 500mg" value={item.dosage ?? ""} onChange={(e) => updateItem(i, "dosage", e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Route</label>
                          <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={item.route ?? "Oral"} onChange={(e) => updateItem(i, "route", e.target.value)}>
                            {ROUTES.map((r) => <option key={r}>{r}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Frequency</label>
                          <select className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" value={item.frequency ?? ""} onChange={(e) => updateItem(i, "frequency", e.target.value)}>
                            <option value="">Select…</option>
                            {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Duration</label>
                          <input className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 7 days" value={item.duration ?? ""} onChange={(e) => updateItem(i, "duration", e.target.value)} />
                        </div>
                        <div>
                          <label className="block text-xs text-gray-500 mb-1">Qty</label>
                          <input type="number" min={1} className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. 14" value={item.quantity ?? ""} onChange={(e) => updateItem(i, "quantity", Number(e.target.value))} />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-gray-500 mb-1">Notes</label>
                          <input className="w-full border rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="e.g. Take after meals" value={item.notes ?? ""} onChange={(e) => updateItem(i, "notes", e.target.value)} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-2 border-t">
                <button onClick={onClose} className="px-4 py-2 text-sm text-gray-600 border rounded-lg hover:bg-gray-50 cursor-pointer">Cancel</button>
                <button disabled={loading} onClick={handleSubmit} className="px-5 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 cursor-pointer">
                  {loading ? "Saving…" : "Save Prescription"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function PrescriptionsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [stats, setStats] = useState<PrescriptionStats>({ total: 0, today: 0, thisMonth: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [detailRx, setDetailRx] = useState<Prescription | null>(null);
  const [printRx, setPrintRx] = useState<Prescription | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        prescriptionsService.list({ search: search || undefined }),
        prescriptionsService.getStats(),
      ]);
      setPrescriptions(list);
      setStats(s);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [search]);

  useEffect(() => { load(); }, [load]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this prescription?")) return;
    await prescriptionsService.remove(id);
    load();
  };

  const handleViewPrint = async (id: string) => {
    const full = await prescriptionsService.findOne(id);
    setPrintRx(full);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <FileText className="w-7 h-7 text-blue-600" /> Prescriptions
          </h1>
          <p className="text-gray-500 text-sm mt-1">Manage patient prescriptions and Rx slips</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-xl hover:bg-blue-700 font-medium text-sm shadow-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" /> New Prescription
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Total Prescriptions" value={stats.total} icon={ClipboardList} color="bg-blue-500" />
        <StatCard label="Today" value={stats.today} icon={CalendarCheck} color="bg-green-500" />
        <StatCard label="This Month" value={stats.thisMonth} icon={TrendingUp} color="bg-purple-500" />
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          className="w-full border rounded-xl pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
          placeholder="Search by patient, diagnosis…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-400 text-sm">Loading prescriptions…</div>
        ) : prescriptions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <FileText className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-medium">No prescriptions found</p>
            <p className="text-xs mt-1">Create your first prescription to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Patient</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Diagnosis</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Medicines</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wider">Follow-up</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {prescriptions.map((rx) => {
                  const patientName = rx.patientName || `${rx.patient?.firstName ?? ""} ${rx.patient?.lastName ?? ""}`.trim() || "Unknown Patient";
                  return (
                    <tr key={rx.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <p className="font-semibold text-gray-800">{patientName}</p>
                        <p className="text-xs text-gray-400">{rx.patient?.phone ?? ""}</p>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{rx.doctorName}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[200px] truncate">{rx.diagnosis ?? "—"}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 rounded-full px-2.5 py-0.5 text-xs font-medium">
                          {rx.items.length} med{rx.items.length !== 1 ? "s" : ""}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(rx.createdAt)}</td>
                      <td className="px-4 py-3 text-gray-500 text-xs">{formatDate(rx.followUpDate)}</td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          <button onClick={() => setDetailRx(rx)} title="View" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-blue-600 cursor-pointer">
                            <Eye className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleViewPrint(rx.id)} title="Print Rx" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-green-600 cursor-pointer">
                            <Printer className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleDelete(rx.id)} title="Delete" className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500 hover:text-red-500 cursor-pointer">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
      {detailRx && (
        <DetailModal
          rx={detailRx}
          onClose={() => setDetailRx(null)}
          onPrint={() => { setPrintRx(detailRx); setDetailRx(null); }}
        />
      )}
      {printRx && <PrintModal rx={printRx} onClose={() => setPrintRx(null)} />}
    </div>
  );
}
