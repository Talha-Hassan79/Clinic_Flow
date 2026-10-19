import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { LandingPage } from './pages/landing/LandingPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { ProtectedRoute } from './routes/ProtectedRoute';
import { DashboardLayout } from './layout/DashboardLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { UsersPage } from './pages/users/UsersPage';
import { PatientsPage } from './pages/patients/PatientsPage';
import { PatientDetailPage } from './pages/patients/PatientDetailPage';
import { LabPage } from './pages/lab/LabPage';
import { DoctorsPage } from './pages/doctors/DoctorsPage';
import { DoctorDetailPage } from './pages/doctors/DoctorDetailPage';
import { AppointmentsPage } from './pages/appointments/AppointmentsPage';
import { CalendarPage } from './pages/calendar/CalendarPage';
import { MedicalRecordsPage } from './pages/records/MedicalRecordsPage';
import PrescriptionsPage from './pages/prescriptions/PrescriptionsPage';
import BillingPage from './pages/billing/BillingPage';
import { LabCatalogPage } from './pages/lab/LabCatalogPage';
import { LabVerificationPage } from './pages/lab/LabVerificationPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Marketing Page */}
        <Route path="/" element={<LandingPage />} />

        {/* Public Diagnostic Verification via QR Code */}
        <Route path="/verify/lab/:id" element={<LabVerificationPage />} />

        {/* Public Auth Routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Protected Dashboard Routes */}
        <Route element={<ProtectedRoute />}>
          <Route element={<DashboardLayout />}>
            {/* Owner & Admin Only */}
            <Route element={<ProtectedRoute allowedRoles={['Clinic Owner', 'Super Admin']} />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/users" element={<UsersPage />} />
            </Route>

            {/* Admin, Doctor, Receptionist */}
            <Route element={<ProtectedRoute allowedRoles={['Clinic Owner', 'Super Admin', 'Doctor', 'Receptionist', 'Nurse']} />}>
              <Route path="/appointments" element={<AppointmentsPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/doctors" element={<DoctorsPage />} />
              <Route path="/doctors/:id" element={<DoctorDetailPage />} />
            </Route>

            {/* Clinical Notes & Prescriptions (Doctors & Nurses) */}
            <Route element={<ProtectedRoute allowedRoles={['Clinic Owner', 'Super Admin', 'Doctor']} />}>
              <Route path="/prescriptions" element={<PrescriptionsPage />} />
            </Route>
            <Route element={<ProtectedRoute allowedRoles={['Clinic Owner', 'Super Admin', 'Doctor', 'Nurse']} />}>
              <Route path="/records" element={<MedicalRecordsPage />} />
            </Route>

            {/* Financial / Billing (Admin, Accountant, Receptionist) */}
            <Route element={<ProtectedRoute allowedRoles={['Clinic Owner', 'Super Admin', 'Accountant', 'Receptionist']} />}>
              <Route path="/billing" element={<BillingPage />} />
            </Route>

            {/* Patients (All Clinical & Frontdesk Staff) */}
            <Route element={<ProtectedRoute allowedRoles={['Clinic Owner', 'Super Admin', 'Doctor', 'Receptionist', 'Nurse', 'Lab Technician', 'Pathologist']} />}>
              <Route path="/patients" element={<PatientsPage />} />
              <Route path="/patients/:id" element={<PatientDetailPage />} />
            </Route>

            {/* Lab & Diagnostics (Lab Tech, Pathologist, Doctor, Admin) */}
            <Route element={<ProtectedRoute allowedRoles={['Clinic Owner', 'Super Admin', 'Lab Technician', 'Pathologist', 'Doctor']} />}>
              <Route path="/lab" element={<LabPage />} />
              <Route path="/lab/catalog" element={<LabCatalogPage />} />
            </Route>
          </Route>
        </Route>

        {/* Default Redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
