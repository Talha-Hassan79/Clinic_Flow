import React, { useEffect, useState } from 'react';
import { appointmentsService } from '../../services/appointments.service';
import type {
  Appointment,
  AppointmentStatus,
  TimeSlot,
  CreateAppointmentPayload,
} from '../../services/appointments.service';
import { doctorsService } from '../../services/doctors.service';
import type { Doctor } from '../../services/doctors.service';
import { patientsService } from '../../services/patients.service';
import type { Patient } from '../../services/patients.service';
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Building2,
  Phone,
  AlertCircle,
  X,
  UserCheck,
  Play,
  CheckCircle2,
} from 'lucide-react';

type CalendarViewMode = 'month' | 'week' | 'day';

export const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<CalendarViewMode>('month');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Inspection Modal
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);

  // Book Modal Triggered from Calendar
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookDateInput, setBookDateInput] = useState<string>(new Date().toISOString().split('T')[0]);
  const [bookDoctorId, setBookDoctorId] = useState<string>('');
  const [bookPatientId, setBookPatientId] = useState<string>('');
  const [bookTimeInput, setBookTimeInput] = useState<string>('10:00 AM');
  const [bookTypeInput, setBookTypeInput] = useState<string>('General Consultation');
  const [bookReasonInput, setBookReasonInput] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<TimeSlot[]>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);
  const [isBooking, setIsBooking] = useState(false);

  // Calculate Date Range based on viewMode & currentDate
  const getDateRange = () => {
    const y = currentDate.getFullYear();
    const m = currentDate.getMonth();

    if (viewMode === 'month') {
      const firstDay = new Date(y, m, 1);
      const lastDay = new Date(y, m + 1, 0);
      return {
        startDate: firstDay.toISOString().split('T')[0],
        endDate: lastDay.toISOString().split('T')[0],
      };
    } else if (viewMode === 'week') {
      const curr = new Date(currentDate);
      const day = curr.getDay(); // 0 is Sunday
      const first = new Date(curr);
      first.setDate(curr.getDate() - day);
      const last = new Date(first);
      last.setDate(first.getDate() + 6);
      return {
        startDate: first.toISOString().split('T')[0],
        endDate: last.toISOString().split('T')[0],
      };
    } else {
      const d = currentDate.toISOString().split('T')[0];
      return { startDate: d, endDate: d };
    }
  };

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const range = getDateRange();
      const [aptRes, docsRes, patientsRes] = await Promise.all([
        appointmentsService.listAppointments({
          doctorId: selectedDoctorId || undefined,
          startDate: range.startDate,
          endDate: range.endDate,
          limit: 300,
        }),
        doctorsService.listDoctors({ limit: 100 }),
        patientsService.listPatients({ limit: 100 }),
      ]);
      setAppointments(aptRes.data);
      setDoctors(docsRes.data);
      setPatients(patientsRes.data);
    } catch {
      setError('Failed to load clinic calendar events.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate, viewMode, selectedDoctorId]);

  // Navigate Prev / Next / Today
  const handlePrev = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() - 1);
    else if (viewMode === 'week') next.setDate(next.getDate() - 7);
    else next.setDate(next.getDate() - 1);
    setCurrentDate(next);
  };

  const handleNext = () => {
    const next = new Date(currentDate);
    if (viewMode === 'month') next.setMonth(next.getMonth() + 1);
    else if (viewMode === 'week') next.setDate(next.getDate() + 7);
    else next.setDate(next.getDate() + 1);
    setCurrentDate(next);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Open booking modal pre-filled for a date
  const openBookForDate = (dateStr: string, timeStr?: string) => {
    setBookDateInput(dateStr);
    if (timeStr) setBookTimeInput(timeStr);
    if (selectedDoctorId) setBookDoctorId(selectedDoctorId);
    else if (doctors.length > 0) setBookDoctorId(doctors[0].id);
    if (patients.length > 0) setBookPatientId(patients[0].id);
    setShowBookModal(true);
  };

  // Load available time slots when doctor or date changes in booking modal
  useEffect(() => {
    if (bookDoctorId && bookDateInput) {
      setIsLoadingSlots(true);
      appointmentsService
        .getAvailableSlots(bookDoctorId, bookDateInput)
        .then((slots) => {
          setAvailableSlots(slots);
          const firstFree = slots.find((s) => !s.isBooked);
          if (firstFree) setBookTimeInput(firstFree.time);
        })
        .catch(() => {})
        .finally(() => setIsLoadingSlots(false));
    }
  }, [bookDoctorId, bookDateInput]);

  const handleConfirmBooking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookPatientId || !bookDoctorId) {
      setError('Please select both a patient and a doctor.');
      return;
    }
    try {
      setIsBooking(true);
      setError(null);
      const payload: CreateAppointmentPayload = {
        patientId: bookPatientId,
        doctorId: bookDoctorId,
        appointmentDate: bookDateInput,
        appointmentTime: bookTimeInput,
        type: bookTypeInput,
        reason: bookReasonInput,
      };
      await appointmentsService.createAppointment(payload);
      setShowBookModal(false);
      setBookReasonInput('');
      loadData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to book appointment.');
    } finally {
      setIsBooking(false);
    }
  };

  // Quick Status Transition inside Inspection Modal
  const handleStatusUpdate = async (id: string, newStatus: AppointmentStatus) => {
    try {
      await appointmentsService.updateStatus(id, newStatus);
      setAppointments((prev) => prev.map((a) => (a.id === id ? { ...a, status: newStatus } : a)));
      if (selectedAppointment && selectedAppointment.id === id) {
        setSelectedAppointment({ ...selectedAppointment, status: newStatus });
      }
    } catch {
      setError('Failed to update status.');
    }
  };

  // Status colors helper
  const getStatusColor = (status: AppointmentStatus) => {
    switch (status) {
      case 'WAITING':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'IN_CONSULTATION':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'CANCELLED':
        return 'bg-gray-100 text-gray-500 border-gray-200 line-through';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  // Helper for Title header
  const getTitleLabel = () => {
    const mNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    if (viewMode === 'month') {
      return `${mNames[currentDate.getMonth()]} ${currentDate.getFullYear()}`;
    } else if (viewMode === 'week') {
      const r = getDateRange();
      return `Week: ${r.startDate} to ${r.endDate}`;
    } else {
      return currentDate.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    }
  };

  // ─── MONTH VIEW BUILDER ──────────────────────────────────────────
  const renderMonthView = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun
    const totalDays = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days: { dayNumber: number; dateStr: string; isCurrentMonth: boolean }[] = [];

    // Previous month padding days
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      const prevD = daysInPrevMonth - i;
      const dStr = new Date(year, month - 1, prevD).toISOString().split('T')[0];
      days.push({ dayNumber: prevD, dateStr: dStr, isCurrentMonth: false });
    }

    // Current month days
    for (let d = 1; d <= totalDays; d++) {
      const dStr = new Date(year, month, d).toISOString().split('T')[0];
      days.push({ dayNumber: d, dateStr: dStr, isCurrentMonth: true });
    }

    // Next month padding days to complete 35 or 42 grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const dStr = new Date(year, month + 1, d).toISOString().split('T')[0];
      days.push({ dayNumber: d, dateStr: dStr, isCurrentMonth: false });
    }

    const todayStr = new Date().toISOString().split('T')[0];

    return (
      <div className="bg-brand-card rounded-modal border border-brand-border shadow-subtle-sm overflow-hidden">
        {/* Days Header */}
        <div className="grid grid-cols-7 bg-brand-surface border-b border-brand-border text-center text-[10px] font-bold uppercase text-brand-text-secondary py-2.5">
          <span>Sun</span>
          <span>Mon</span>
          <span>Tue</span>
          <span>Wed</span>
          <span>Thu</span>
          <span>Fri</span>
          <span>Sat</span>
        </div>

        {/* Days Grid */}
        <div className="grid grid-cols-7 divide-x divide-y divide-brand-border">
          {days.map((d, index) => {
            const dayApts = appointments.filter((a) => {
              const aDateStr = new Date(a.appointmentDate).toISOString().split('T')[0];
              return aDateStr === d.dateStr;
            });
            const isToday = d.dateStr === todayStr;

            return (
              <div
                key={index}
                onClick={() => openBookForDate(d.dateStr)}
                className={`min-h-28 p-1.5 flex flex-col justify-between transition-colors cursor-pointer hover:bg-brand-surface/40 ${
                  !d.isCurrentMonth ? 'opacity-35 bg-brand-surface/20' : 'bg-white'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isToday ? 'bg-primary text-white' : 'text-brand-text-primary'
                    }`}
                  >
                    {d.dayNumber}
                  </span>
                  {dayApts.length > 0 && (
                    <span className="text-[10px] font-bold text-brand-text-secondary bg-brand-surface px-1.5 py-0.2 rounded-btn border border-brand-border">
                      {dayApts.length}
                    </span>
                  )}
                </div>

                {/* Appointment Chips inside Day Cell */}
                <div className="space-y-1 mt-1 flex-1 overflow-hidden">
                  {dayApts.slice(0, 3).map((apt) => (
                    <div
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(apt);
                      }}
                      className={`text-[10px] p-1 rounded border font-medium truncate flex items-center justify-between transition-transform hover:scale-[1.02] cursor-pointer ${getStatusColor(
                        apt.status
                      )}`}
                    >
                      <span className="font-bold truncate">
                        {apt.token ? apt.token.replace('Token ', '') : ''} {apt.patient?.firstName} {apt.patient?.lastName}
                      </span>
                      <span className="text-[9px] opacity-75 font-mono ml-1 shrink-0">{apt.appointmentTime}</span>
                    </div>
                  ))}

                  {dayApts.length > 3 && (
                    <p className="text-[9px] font-bold text-primary pl-1">
                      +{dayApts.length - 3} more
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── WEEK VIEW BUILDER ───────────────────────────────────────────
  const renderWeekView = () => {
    const r = getDateRange();
    const start = new Date(r.startDate);
    const weekDays: { label: string; dateStr: string; dayNum: number }[] = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      weekDays.push({
        label: dayNames[d.getDay()],
        dateStr: d.toISOString().split('T')[0],
        dayNum: d.getDate(),
      });
    }

    return (
      <div className="bg-brand-card rounded-modal border border-brand-border shadow-subtle-sm overflow-hidden">
        <div className="grid grid-cols-7 bg-brand-surface border-b border-brand-border text-center py-3 divide-x divide-brand-border">
          {weekDays.map((wd) => (
            <div key={wd.dateStr} className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-brand-text-secondary">{wd.label}</span>
              <p className="text-base font-extrabold text-brand-text-primary">{wd.dayNum}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 divide-x divide-brand-border min-h-96">
          {weekDays.map((wd) => {
            const dayApts = appointments.filter((a) => {
              const aDateStr = new Date(a.appointmentDate).toISOString().split('T')[0];
              return aDateStr === wd.dateStr;
            });

            return (
              <div
                key={wd.dateStr}
                onClick={() => openBookForDate(wd.dateStr)}
                className="p-2 space-y-2 hover:bg-brand-surface/30 transition-colors cursor-pointer"
              >
                {dayApts.length === 0 ? (
                  <p className="text-[10px] text-brand-text-secondary/50 text-center pt-8">No visits</p>
                ) : (
                  dayApts.map((apt) => (
                    <div
                      key={apt.id}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAppointment(apt);
                      }}
                      className={`p-2 rounded-card border text-xs space-y-1 hover:shadow-subtle-sm transition-all cursor-pointer ${getStatusColor(
                        apt.status
                      )}`}
                    >
                      <div className="flex items-center justify-between font-bold text-[11px]">
                        <span>{apt.appointmentTime}</span>
                        <span className="text-[9px] uppercase font-mono">{apt.token}</span>
                      </div>
                      <p className="font-bold text-brand-text-primary truncate">
                        {apt.patient?.firstName} {apt.patient?.lastName}
                      </p>
                      <p className="text-[10px] truncate opacity-80">{apt.doctor?.fullName}</p>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ─── DAY VIEW BUILDER ────────────────────────────────────────────
  const renderDayView = () => {
    const dayStr = currentDate.toISOString().split('T')[0];
    const dayApts = appointments.filter((a) => {
      const aDateStr = new Date(a.appointmentDate).toISOString().split('T')[0];
      return aDateStr === dayStr;
    });

    return (
      <div className="bg-brand-card rounded-modal border border-brand-border shadow-subtle-sm p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-brand-border pb-3">
          <div>
            <h3 className="text-base font-bold text-brand-text-primary">
              Scheduled Patient Consultations for {dayStr}
            </h3>
            <p className="text-xs text-brand-text-secondary">
              Total {dayApts.length} appointments booked on this date.
            </p>
          </div>
          <button
            onClick={() => openBookForDate(dayStr)}
            className="h-8 px-3 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn flex items-center gap-1.5 cursor-pointer shadow-subtle-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Book for Today</span>
          </button>
        </div>

        {dayApts.length === 0 ? (
          <div className="py-16 text-center space-y-2">
            <CalendarDays className="w-10 h-10 mx-auto opacity-30 text-brand-text-secondary" />
            <p className="text-xs text-brand-text-secondary">No consultations scheduled for this date.</p>
          </div>
        ) : (
          <div className="divide-y divide-brand-border">
            {dayApts.map((apt) => (
              <div
                key={apt.id}
                onClick={() => setSelectedAppointment(apt)}
                className="py-3.5 flex items-center justify-between hover:bg-brand-surface/40 p-2 rounded-card transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-btn bg-primary/10 text-primary border border-primary/20 flex flex-col items-center justify-center font-mono font-bold shrink-0">
                    <span className="text-[9px] uppercase">Token</span>
                    <span className="text-xs">{apt.token ? apt.token.replace('Token #', '#') : '#01'}</span>
                  </div>
                  <div>
                    <p className="font-bold text-xs text-brand-text-primary">
                      {apt.patient?.firstName} {apt.patient?.lastName}
                    </p>
                    <p className="text-[10px] text-brand-text-secondary flex items-center gap-1 mt-0.5">
                      <Clock className="w-3 h-3" />
                      <span>{apt.appointmentTime}</span>
                      <span>•</span>
                      <span>{apt.doctor?.fullName} ({apt.doctor?.specialization})</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${getStatusColor(apt.status)}`}>
                    {apt.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6 text-left">
      {/* ─── CALENDAR TOP CONTROLS ───────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text-primary flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-primary" />
            <span>Interactive Clinic Calendar</span>
          </h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">
            Visualize physician schedules, inspect daily consultations, and schedule visits on calendar slots.
          </p>
        </div>

        {/* Actions & View Toggle */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Doctor Filter */}
          <select
            value={selectedDoctorId}
            onChange={(e) => setSelectedDoctorId(e.target.value)}
            className="h-9 px-3 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none appearance-none cursor-pointer"
          >
            <option value="">All Doctors (Overlay)</option>
            {doctors.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fullName} — {d.specialization}
              </option>
            ))}
          </select>

          {/* View Modes */}
          <div className="flex bg-brand-surface rounded-input border border-brand-border p-0.5">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 h-7 rounded-btn text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'month' ? 'bg-white shadow-subtle-sm text-primary' : 'text-brand-text-secondary'
              }`}
            >
              Month
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 h-7 rounded-btn text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'week' ? 'bg-white shadow-subtle-sm text-primary' : 'text-brand-text-secondary'
              }`}
            >
              Week
            </button>
            <button
              onClick={() => setViewMode('day')}
              className={`px-3 h-7 rounded-btn text-xs font-semibold transition-colors cursor-pointer ${
                viewMode === 'day' ? 'bg-white shadow-subtle-sm text-primary' : 'text-brand-text-secondary'
              }`}
            >
              Day
            </button>
          </div>

          <button
            onClick={() => openBookForDate(new Date().toISOString().split('T')[0])}
            className="h-9 px-3.5 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-1.5 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <Plus className="w-4 h-4" />
            <span>Book Visit</span>
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

      {/* ─── DATE NAVIGATION HEADER ──────────────────────────────── */}
      <div className="bg-brand-card p-3.5 rounded-card border border-brand-border shadow-subtle-sm flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrev}
            className="w-8 h-8 rounded-btn border border-brand-border flex items-center justify-center text-brand-text-secondary hover:bg-brand-surface cursor-pointer"
            title="Previous"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="w-8 h-8 rounded-btn border border-brand-border flex items-center justify-center text-brand-text-secondary hover:bg-brand-surface cursor-pointer"
            title="Next"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            onClick={handleToday}
            className="h-8 px-3 rounded-btn border border-brand-border text-xs font-semibold text-brand-text-primary hover:bg-brand-surface cursor-pointer"
          >
            Today
          </button>
        </div>

        <h3 className="text-sm font-extrabold text-brand-text-primary">{getTitleLabel()}</h3>

        <div className="flex items-center gap-2 text-[11px] text-brand-text-secondary">
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500" /> Confirmed</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> Waiting</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-purple-500" /> In Visit</span>
          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Done</span>
        </div>
      </div>

      {/* ─── CALENDAR BODY ───────────────────────────────────────── */}
      {isLoading ? (
        <div className="p-16 text-center text-xs text-brand-text-secondary animate-pulse">
          Loading calendar appointments…
        </div>
      ) : viewMode === 'month' ? (
        renderMonthView()
      ) : viewMode === 'week' ? (
        renderWeekView()
      ) : (
        renderDayView()
      )}

      {/* ─── 1. APPOINTMENT QUICK INSPECTION MODAL ────────────────── */}
      {selectedAppointment && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-md p-6 space-y-5 text-left">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2.5">
                <div className="px-2.5 py-1 rounded-btn bg-primary text-white font-mono font-bold text-xs">
                  {selectedAppointment.token || 'Token #01'}
                </div>
                <div>
                  <h3 className="text-sm font-bold text-brand-text-primary">
                    Appointment Details
                  </h3>
                  <span className={`px-2 py-0.2 rounded-full text-[9px] font-bold border ${getStatusColor(selectedAppointment.status)}`}>
                    {selectedAppointment.status}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Details */}
            <div className="space-y-3 text-xs">
              <div className="p-3 bg-brand-surface rounded-card border border-brand-border space-y-1">
                <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Patient</p>
                <p className="text-sm font-bold text-brand-text-primary">
                  {selectedAppointment.patient?.firstName} {selectedAppointment.patient?.lastName}
                </p>
                <p className="text-brand-text-secondary flex items-center gap-1">
                  <Phone className="w-3 h-3 text-primary" />
                  <span>{selectedAppointment.patient?.phone || 'No phone recorded'}</span>
                </p>
              </div>

              <div className="p-3 bg-brand-surface rounded-card border border-brand-border space-y-1">
                <p className="text-[10px] font-bold uppercase text-brand-text-secondary">Consulting Physician</p>
                <p className="font-bold text-brand-text-primary">{selectedAppointment.doctor?.fullName}</p>
                <p className="text-brand-text-secondary flex items-center gap-1">
                  <Building2 className="w-3 h-3 text-primary" />
                  <span>{selectedAppointment.doctor?.specialization || 'General Physician'}</span>
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-2.5 bg-brand-surface rounded-card border border-brand-border">
                  <p className="text-[10px] uppercase font-bold text-brand-text-secondary">Scheduled Date</p>
                  <p className="font-bold mt-0.5">{new Date(selectedAppointment.appointmentDate).toLocaleDateString()}</p>
                </div>
                <div className="p-2.5 bg-brand-surface rounded-card border border-brand-border">
                  <p className="text-[10px] uppercase font-bold text-brand-text-secondary">Time Slot</p>
                  <p className="font-bold mt-0.5">{selectedAppointment.appointmentTime}</p>
                </div>
              </div>

              {selectedAppointment.reason && (
                <div className="p-2.5 bg-brand-surface rounded-card border border-brand-border">
                  <p className="text-[10px] uppercase font-bold text-brand-text-secondary">Reason / Complaint</p>
                  <p className="mt-0.5">{selectedAppointment.reason}</p>
                </div>
              )}
            </div>

            {/* Quick Status Action Triggers */}
            <div className="pt-3 border-t border-brand-border space-y-2">
              <p className="text-[10px] uppercase font-bold text-brand-text-secondary">Quick Status Action:</p>
              <div className="flex gap-2">
                {selectedAppointment.status !== 'WAITING' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'WAITING')}
                    className="flex-1 h-8 rounded-btn bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Check In</span>
                  </button>
                )}

                {selectedAppointment.status !== 'IN_CONSULTATION' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'IN_CONSULTATION')}
                    className="flex-1 h-8 rounded-btn bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Play className="w-3.5 h-3.5" />
                    <span>Call In</span>
                  </button>
                )}

                {selectedAppointment.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleStatusUpdate(selectedAppointment.id, 'COMPLETED')}
                    className="flex-1 h-8 rounded-btn bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Complete</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── 2. BOOK APPOINTMENT MODAL (PRE-FILLED FOR CLICKED DATE) ── */}
      {showBookModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-xl p-6 space-y-5 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-brand-border">
              <div>
                <h3 className="text-base font-bold text-brand-text-primary">
                  Book Appointment for {bookDateInput}
                </h3>
                <p className="text-[11px] text-brand-text-secondary mt-0.5">
                  Select a patient, doctor, and time slot to assign an OPD queue token.
                </p>
              </div>
              <button
                onClick={() => setShowBookModal(false)}
                className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="space-y-4">
              {/* Select Patient */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Patient *
                </label>
                <select
                  required
                  value={bookPatientId}
                  onChange={(e) => setBookPatientId(e.target.value)}
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                >
                  <option value="">Select a patient…</option>
                  {patients.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.firstName} {p.lastName} — {p.phone || p.id.slice(0, 8)}
                    </option>
                  ))}
                </select>
              </div>

              {/* Select Doctor */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Doctor *
                </label>
                <select
                  required
                  value={bookDoctorId}
                  onChange={(e) => setBookDoctorId(e.target.value)}
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

              {/* Date & Visit Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={bookDateInput}
                    onChange={(e) => setBookDateInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                    Visit Type
                  </label>
                  <select
                    value={bookTypeInput}
                    onChange={(e) => setBookTypeInput(e.target.value)}
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none cursor-pointer"
                  >
                    <option value="General Consultation">General Consultation</option>
                    <option value="Follow-up Visit">Follow-up Visit</option>
                    <option value="Routine Checkup">Routine Checkup</option>
                    <option value="Urgent / Emergency">Urgent / Emergency</option>
                  </select>
                </div>
              </div>

              {/* Available Time Slots Selection */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Available Slots
                </label>
                {isLoadingSlots ? (
                  <div className="p-3 text-center text-xs text-brand-text-secondary animate-pulse">
                    Checking doctor availability…
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 max-h-36 overflow-y-auto p-1">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={slot.isBooked}
                        onClick={() => setBookTimeInput(slot.time)}
                        className={`py-1.5 px-2 rounded-btn text-xs font-semibold border transition-all cursor-pointer ${
                          slot.isBooked
                            ? 'opacity-30 bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed line-through'
                            : bookTimeInput === slot.time
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

              {/* Reason */}
              <div>
                <label className="block text-[11px] font-bold uppercase mb-1 text-brand-text-primary">
                  Chief Complaint / Reason
                </label>
                <textarea
                  rows={2}
                  value={bookReasonInput}
                  onChange={(e) => setBookReasonInput(e.target.value)}
                  placeholder="e.g. Fever, persistent cough"
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
                      <CalendarDays className="w-4 h-4" />
                      <span>Confirm Appointment</span>
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
export default CalendarPage;
