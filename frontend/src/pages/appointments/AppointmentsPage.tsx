import React, { useEffect, useState } from 'react';
import { appointmentsService } from '../../services/appointments.service';
import type {
  Appointment,
  AppointmentStats,
  AppointmentStatus,
  TimeSlot,
  CreateAppointmentPayload,
} from '../../services/appointments.service';
import { patientsService } from '../../services/patients.service';
import type { Patient } from '../../services/patients.service';
import { doctorsService } from '../../services/doctors.service';
import type { Doctor } from '../../services/doctors.service';
import {
  Calendar,
  Search,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Play,
  UserCheck,
  Building2,
  Phone,
} from 'lucide-react';

const VISIT_TYPES = [
  'General Consultation',
  'Follow-up Visit',
  'Routine Checkup',
  'Urgent / Emergency',
  'Report Review',
];

export const AppointmentsPage: React.FC = () => {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [stats, setStats] = useState<AppointmentStats | null>(null);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [doctorFilter, setDoctorFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Booking Modal
  const [showBookModal, setShowBookModal] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  const [bookingForm, setBookingForm] = useState<CreateAppointmentPayload>({
    patientId: '',
    doctorId: '',
    appointmentDate: new Date().toISOString().split('T')[0],
    appointmentTime: '10:00 AM',
    type: 'General Consultation',
    reason: '',
    notes: '',
  });

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [aptRes, statsRes, patientsRes, docsRes] = await Promise.all([
        appointmentsService.listAppointments({
          search: search || undefined,
          doctorId: doctorFilter || undefined,
          status: statusFilter || undefined,
          date: dateFilter || undefined,
        }),
        appointmentsService.getStats(),
        patientsService.listPatients({ limit: 100 }),
        doctorsService.listDoctors({ limit: 100 }),
      ]);
      setAppointments(aptRes.data);
      setStats(statsRes);
      setPatients(patientsRes.data);
      setDoctors(docsRes.data);
    } catch {
      setError('Failed to load clinic appointments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 250);
    return () => clearTimeout(timer);
  }, [search, doctorFilter, statusFilter, dateFilter]);

  // Load available time slots when doctor or date changes in booking modal
  useEffect(() => {
    if (bookingForm.doctorId && bookingForm.appointmentDate) {
      setIsLoadingSlots(true);
      appointmentsService
        .getAvailableSlots(bookingForm.doctorId, bookingForm.appointmentDate)
        .then((slots) => {
          setAvailableSlots(slots);
          const firstFree = slots.find((s) => !s.isBooked);
          if (firstFree) {
            setBookingForm((prev) => ({ ...prev, appointmentTime: firstFree.time }));
          }
        })
        .catch(() => {})
        .finally(() => setIsLoadingSlots(false));
    }
  }, [bookingForm.doctorId, bookingForm.appointmentDate]);

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.patientId || !bookingForm.doctorId) {
      setError('Please select both a patient and a doctor.');
      return;
    }
    try {
      setIsBooking(true);
      setError(null);
      await appointmentsService.createAppointment(bookingForm);
      setShowBookModal(false);
      setBookingForm({
        patientId: '',
        doctorId: '',
        appointmentDate: new Date().toISOString().split('T')[0],
        appointmentTime: '10:00 AM',
        type: 'General Consultation',
        reason: '',
        notes: '',
      });
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setIsBooking(false);
    }
  };

  const handleStatusTransition = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await appointmentsService.updateStatus(id, newStatus);
      setAppointments((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a))
      );
      appointmentsService.getStats().then(setStats).catch(() => {});
    } catch {
      setError('Failed to update appointment status.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Cancel and remove this appointment?')) return;
    try {
      await appointmentsService.deleteAppointment(id);
      loadData();
    } catch {
      setError('Failed to cancel appointment.');
    }
  };

  const getStatusBadge = (status: AppointmentStatus) => {
    switch (status) {
      case 'CONFIRMED':
      case 'SCHEDULED':
        return <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-bold">Confirmed</span>;
      case 'WAITING':
        return <span className="px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold animate-pulse">Waiting in Clinic</span>;
      case 'IN_CONSULTATION':
        return <span className="px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-[10px] font-bold">In Consultation</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold">Completed</span>;
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-600 border border-gray-200 text-[10px] font-bold">Cancelled</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full bg-gray-50 text-gray-700 border border-gray-200 text-[10px] font-bold">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text-primary flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <span>Appointment Scheduling & OPD Queue</span>
          </h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Book patient visits, assign queue tokens, and manage live consultation status workflows.
          </p>
        </div>

        <button
          onClick={() => {
            if (patients.length > 0 && !bookingForm.patientId) {
              setBookingForm((f) => ({ ...f, patientId: patients[0].id }));
            }
            if (doctors.length > 0 && !bookingForm.doctorId) {
              setBookingForm((f) => ({ ...f, doctorId: doctors[0].id }));
            }
            setShowBookModal(true);
          }}
          className="h-10 px-4 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
        >
          <Plus className="w-4 h-4" />
          <span>Book Appointment</span>
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

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shrink-0">
            <Calendar className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Today's Visits</p>
            <p className="text-xl font-extrabold text-brand-text-primary">{stats?.todayCount ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 shrink-0">
            <Clock className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Waiting in Clinic</p>
            <p className="text-xl font-extrabold text-brand-text-primary">{stats?.waitingCount ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 shrink-0">
            <Play className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">In Consultation</p>
            <p className="text-xl font-extrabold text-brand-text-primary">{stats?.inConsultationCount ?? '—'}</p>
          </div>
        </div>

        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Completed Today</p>
            <p className="text-xl font-extrabold text-brand-text-primary">{stats?.completedToday ?? '—'}</p>
          </div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by patient name, phone, or reason…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
          />
        </div>

        <div className="flex gap-2 flex-wrap sm:flex-nowrap">
          {/* Quick Date Toggle */}
          <div className="flex bg-brand-surface rounded-input border border-brand-border p-0.5">
            <button
              onClick={() => setDateFilter('')}
              className={`px-3 h-8 rounded-btn text-xs font-semibold transition-colors cursor-pointer ${
                dateFilter === '' ? 'bg-white shadow-subtle-sm text-primary' : 'text-brand-text-secondary'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setDateFilter(new Date().toISOString().split('T')[0])}
              className={`px-3 h-8 rounded-btn text-xs font-semibold transition-colors cursor-pointer ${
                dateFilter === new Date().toISOString().split('T')[0]
                  ? 'bg-white shadow-subtle-sm text-primary'
                  : 'text-brand-text-secondary'
              }`}
            >
              Today
            </button>
          </div>

          {/* Doctor Filter */}
          <select
            value={doctorFilter}
            onChange={(e) => setDoctorFilter(e.target.value)}
            className="h-10 px-3 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All Doctors</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} ({d.specialization})
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-10 px-3 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="WAITING">Waiting in Clinic</option>
            <option value="IN_CONSULTATION">In Consultation</option>
            <option value="CONFIRMED">Confirmed</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Appointments Queue Table */}
      <div className="bg-brand-card rounded-card border border-brand-border shadow-subtle-sm overflow-hidden">
        <div className="hidden lg:grid grid-cols-12 px-5 py-3 bg-brand-surface border-b border-brand-border text-[10px] font-bold uppercase text-brand-text-secondary">
          <span className="col-span-3">Token & Patient</span>
          <span className="col-span-3">Doctor & Department</span>
          <span className="col-span-2">Date & Time</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2 text-right">Queue Actions</span>
        </div>

        <div className="divide-y divide-brand-border">
          {isLoading ? (
            <div className="p-8 text-center text-xs text-brand-text-secondary animate-pulse">
              Loading appointment queue…
            </div>
          ) : appointments.length === 0 ? (
            <div className="py-12 text-center text-xs text-brand-text-secondary space-y-2">
              <Calendar className="w-8 h-8 mx-auto opacity-30 text-brand-text-secondary" />
              <p>No appointments found for the selected criteria.</p>
              <button
                onClick={() => setShowBookModal(true)}
                className="text-primary hover:underline font-semibold text-xs"
              >
                Book an appointment now
              </button>
            </div>
          ) : (
            appointments.map((apt) => (
              <div
                key={apt.id}
                className="grid grid-cols-12 px-5 py-4 items-center text-xs hover:bg-brand-surface/50 transition-colors"
              >
                {/* Token & Patient Details */}
                <div className="col-span-12 lg:col-span-3 flex items-center gap-3 mb-2 lg:mb-0">
                  <div className="w-10 h-10 rounded-btn bg-primary/10 text-primary border border-primary/20 flex flex-col items-center justify-center font-mono font-bold shrink-0">
                    <span className="text-[9px] uppercase tracking-tighter">Token</span>
                    <span className="text-xs">{apt.token ? apt.token.replace('Token #', '#') : '#01'}</span>
                  </div>
                  <div>
                    <p className="font-semibold text-brand-text-primary">
                      {apt.patient?.firstName} {apt.patient?.lastName}
                    </p>
                    <p className="text-[10px] text-brand-text-secondary flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-brand-text-secondary" />
                      {apt.patient?.phone || 'No phone'} • {apt.patient?.bloodGroup || 'Blood: N/A'}
                    </p>
                  </div>
                </div>

                {/* Doctor & Department */}
                <div className="col-span-6 lg:col-span-3 space-y-0.5">
                  <p className="font-semibold text-brand-text-primary">{apt.doctor?.fullName}</p>
                  <p className="text-[10px] text-brand-text-secondary flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-primary" />
                    <span>{apt.doctor?.specialization || 'General Physician'}</span>
                  </p>
                </div>

                {/* Date & Time */}
                <div className="col-span-6 lg:col-span-2 space-y-0.5">
                  <p className="font-bold text-brand-text-primary flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-primary" />
                    <span>{apt.appointmentTime}</span>
                  </p>
                  <p className="text-[10px] text-brand-text-secondary">
                    {new Date(apt.appointmentDate).toLocaleDateString()}
                  </p>
                </div>

                {/* Status Badge */}
                <div className="col-span-6 lg:col-span-2">
                  {getStatusBadge(apt.status)}
                </div>

                {/* Actions & Lifecycle Transitions */}
                <div className="col-span-6 lg:col-span-2 flex items-center justify-end gap-2">
                  {/* Status Progression Workflow */}
                  {(apt.status === 'CONFIRMED' || apt.status === 'SCHEDULED') && (
                    <button
                      onClick={() => handleStatusTransition(apt.id, 'WAITING')}
                      className="h-7 px-2.5 rounded-btn bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-600 hover:text-white transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Mark as arrived & waiting in clinic"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Check In</span>
                    </button>
                  )}

                  {apt.status === 'WAITING' && (
                    <button
                      onClick={() => handleStatusTransition(apt.id, 'IN_CONSULTATION')}
                      className="h-7 px-2.5 rounded-btn bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-600 hover:text-white transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Doctor calls patient into consultation room"
                    >
                      <Play className="w-3.5 h-3.5" />
                      <span>Call In</span>
                    </button>
                  )}

                  {apt.status === 'IN_CONSULTATION' && (
                    <button
                      onClick={() => handleStatusTransition(apt.id, 'COMPLETED')}
                      className="h-7 px-2.5 rounded-btn bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-600 hover:text-white transition-all text-[11px] font-semibold flex items-center gap-1 cursor-pointer"
                      title="Finish consultation"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Complete</span>
                    </button>
                  )}

                  <button
                    onClick={() => handleDelete(apt.id)}
                    title="Cancel appointment"
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

      {/* ─── BOOK APPOINTMENT MODAL ──────────────────────────────── */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-xl p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  Book Patient Appointment
                </h3>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">
                  Select a patient, doctor, date, and available time slot to generate a queue token.
                </p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleBookAppointment} className="space-y-4">
              {/* Select Patient */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Select Patient *
                </label>
                <select
                  required
                  value={bookingForm.patientId}
                  onChange={(e) => setBookingForm((f) => ({ ...f, patientId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="">Select a patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} — {p.phone || p.cnic || p.id.slice(0, 8)} ({p.bloodGroup || 'Blood: N/A'})
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Doctor */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Select Consulting Doctor *
                </label>
                <select
                  required
                  value={bookingForm.doctorId}
                  onChange={(e) => setBookingForm((f) => ({ ...f, doctorId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="">Select a doctor…</option>
                  {doctors.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.fullName} — {d.specialization} (Fee: PKR {Number(d.consultationFee || 1500).toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              {/* Date & Visit Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Appointment Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookingForm.appointmentDate}
                    onChange={(e) => setBookingForm((f) => ({ ...f, appointmentDate: e.target.value }))}
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Visit Type
                  </label>
                  <select
                    value={bookingForm.type}
                    onChange={(e) => setBookingForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    {VISIT_TYPES.map((vt) => (
                      <option key={vt} value={vt}>
                        {vt}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Available Time Slots Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1.5 text-brand-text-primary">
                  Available Time Slots
                </label>
                {isLoadingSlots ? (
                  <div className="p-4 text-center text-xs text-brand-text-secondary animate-pulse">
                    Checking doctor availability…
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="p-3 rounded-card bg-brand-surface border border-brand-border text-xs text-brand-text-secondary">
                    Select a doctor and date to view consultation slots.
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-40 overflow-y-auto p-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={slot.isBooked}
                        onClick={() => setBookingForm((f) => ({ ...f, appointmentTime: slot.time }))}
                        className={`py-1.5 px-2 rounded-btn text-xs font-semibold border transition-all cursor-pointer ${
                          slot.isBooked
                            ? 'opacity-40 bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                            : bookingForm.appointmentTime === slot.time
                            ? 'bg-primary text-white border-primary shadow-subtle-sm'
                            : 'bg-white text-brand-text-primary border-brand-border hover:border-primary/50'
                        }`}
                      >
                        {slot.time}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Reason / Chief Complaint */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Reason for Visit / Chief Complaint
                </label>
                <textarea
                  rows={2}
                  value={bookingForm.reason || ''}
                  onChange={(e) => setBookingForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="e.g. Follow-up for chest pain, blood test review"
                  className="w-full p-2.5 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-3 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="flex-1 h-10 border border-brand-border rounded-btn text-xs font-semibold text-brand-text-secondary hover:bg-brand-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isBooking}
                  className="flex-1 h-10 bg-primary hover:bg-blue-700 text-white rounded-btn text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60 shadow-subtle-sm"
                >
                  {isBooking ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <Calendar className="w-4 h-4" />
                      <span>Confirm Booking</span>
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
export default AppointmentsPage;
