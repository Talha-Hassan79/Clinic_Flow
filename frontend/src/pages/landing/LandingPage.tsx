import React, { useState } from 'react';
import { Link } from 'react-router';
import {
  HeartPulse,
  Calendar,
  CreditCard,
  FileText,
  Users,
  CheckCircle,
  HelpCircle,
  ChevronDown,
  ArrowRight,
  Clock,
  Sparkles,
  Check
} from 'lucide-react';

interface FAQItem {
  question: string;
  answer: string;
}

export const LandingPage: React.FC = () => {
  const [isAnnual, setIsAnnual] = useState(false);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);
  const [dashboardTab, setDashboardTab] = useState<'appointments' | 'billing' | 'records'>('appointments');

  const faqs: FAQItem[] = [
    {
      question: 'What is ClinicFlow and who is it for?',
      answer: 'ClinicFlow is a secure, cloud-based Clinic Management SaaS designed for small to medium-sized clinics. It helps doctors, receptionists, and owners manage scheduling, patient records, prescriptions, and billing in one central workspace.',
    },
    {
      question: 'Is patient data secure and private?',
      answer: 'Yes, security is our primary focus. We use strict multi-tenant database isolation, JWT access control, and bank-grade data encryption to ensure that patient records are fully private and accessible only by authorized clinic staff.',
    },
    {
      question: 'Can I use it on mobile or tablet?',
      answer: 'Absolutely. ClinicFlow is built with a responsive interface that adapts seamlessly to desktops, tablets, and mobile devices, allowing you to access records from anywhere.',
    },
    {
      question: 'How does the 14-day free trial work?',
      answer: 'You can sign up instantly without a credit card. You will have full access to all Professional tier features for 14 days, after which you can select a subscription plan that fits your clinic.',
    },
  ];

  const toggleFaq = (index: number) => {
    setExpandedFaq(expandedFaq === index ? null : index);
  };

  return (
    <div className="bg-brand-surface text-brand-text-primary min-h-screen font-sans antialiased">
      {/* ─── STICKY TOP NAVBAR ────────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-brand-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-btn bg-primary flex items-center justify-center text-white shadow-subtle-sm">
              <HeartPulse className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold tracking-tight text-brand-text-primary">ClinicFlow</span>
          </div>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-brand-text-secondary">
            <a href="#features" className="hover:text-primary transition-colors">Features</a>
            <a href="#preview" className="hover:text-primary transition-colors">Preview</a>
            <a href="#pricing" className="hover:text-primary transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-primary transition-colors">FAQ</a>
          </div>

          <div className="flex items-center gap-4">
            <Link
              to="/login"
              className="text-sm font-semibold text-brand-text-secondary hover:text-brand-text-primary transition-colors"
            >
              Sign In
            </Link>
            <Link
              to="/register"
              className="h-10 px-4 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </nav>

      {/* ─── HERO SECTION ─────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 px-6 overflow-hidden">
        <div className="max-w-5xl mx-auto text-center space-y-6 relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Introducing ClinicFlow 1.0 MVP</span>
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold text-brand-text-primary tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Manage your clinic <span className="text-primary">smarter</span> and care faster.
          </h1>

          <p className="text-lg text-brand-text-secondary max-w-2xl mx-auto leading-relaxed">
            Replace paperwork, messy spreadsheets, and slow record-keeping with a secure, beautiful workspace designed specifically for medical practitioners.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <Link
              to="/register"
              className="w-full sm:w-auto h-12 px-6 bg-primary hover:bg-blue-700 text-white font-semibold rounded-btn shadow-subtle-md flex items-center justify-center gap-2 transition-all hover:scale-[1.03] active:scale-[0.97]"
            >
              <span>Start Free Trial</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <a
              href="#preview"
              className="w-full sm:w-auto h-12 px-6 bg-white hover:bg-brand-surface text-brand-text-primary border border-brand-border font-semibold rounded-btn shadow-subtle-sm flex items-center justify-center gap-2 transition-all"
            >
              <span>Book a Demo</span>
            </a>
          </div>

          {/* Quick Stats banner */}
          <div className="pt-10 flex flex-wrap items-center justify-center gap-x-12 gap-y-6 text-brand-text-secondary text-sm font-medium">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-success" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-success" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4.5 h-4.5 text-success" />
              <span>HIPAA Compliant Security</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── INTERACTIVE DASHBOARD PREVIEW ────────────────────────── */}
      <section id="preview" className="py-12 px-6 bg-brand-surface border-y border-brand-border">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Sleek User Interface</h2>
            <p className="text-brand-text-secondary text-sm max-w-lg mx-auto">
              Clean dashboard layouts built with modern standards for optimal viewing on desktop and tablets.
            </p>
          </div>

          {/* Tabs */}
          <div className="flex items-center justify-center gap-2 max-w-md mx-auto bg-brand-surface p-1 rounded-input border border-brand-border shadow-subtle-sm">
            <button
              onClick={() => setDashboardTab('appointments')}
              className={`flex-1 h-9 rounded-btn text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                dashboardTab === 'appointments' ? 'bg-white text-primary shadow-subtle-sm border border-brand-border' : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Appointments</span>
            </button>
            <button
              onClick={() => setDashboardTab('billing')}
              className={`flex-1 h-9 rounded-btn text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                dashboardTab === 'billing' ? 'bg-white text-primary shadow-subtle-sm border border-brand-border' : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Billing Workspace</span>
            </button>
            <button
              onClick={() => setDashboardTab('records')}
              className={`flex-1 h-9 rounded-btn text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                dashboardTab === 'records' ? 'bg-white text-primary shadow-subtle-sm border border-brand-border' : 'text-brand-text-secondary hover:text-brand-text-primary'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Medical Records</span>
            </button>
          </div>

          {/* Interactive CSS Mockup */}
          <div className="w-full bg-white rounded-modal border border-brand-border shadow-subtle-lg overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            {/* Sidebar Mockup */}
            <div className="w-full md:w-56 bg-brand-surface border-r border-brand-border p-4 space-y-5 shrink-0 hidden md:block text-left">
              <div className="flex items-center gap-2 px-2">
                <div className="w-7 h-7 rounded-btn bg-primary flex items-center justify-center text-white">
                  <HeartPulse className="w-4 h-4" />
                </div>
                <span className="text-sm font-bold tracking-tight">ClinicFlow</span>
              </div>

              <div className="space-y-1">
                {['Dashboard', 'Patients', 'Appointments', 'Billing', 'Prescriptions', 'Reports', 'Settings'].map((item, idx) => (
                  <div
                    key={item}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-btn text-xs font-medium ${
                      idx === 0 ? 'bg-primary/10 text-primary' : 'text-brand-text-secondary'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-current opacity-70" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Content Mockup */}
            <div className="flex-1 p-6 sm:p-8 bg-brand-card flex flex-col justify-between">
              {dashboardTab === 'appointments' && (
                <div className="space-y-6 text-left">
                  {/* Top Stats Banner */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-brand-surface border border-brand-border rounded-card">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary">Today's Visits</p>
                      <h4 className="text-xl font-bold mt-1 text-brand-text-primary">18 Patients</h4>
                    </div>
                    <div className="p-4 bg-brand-surface border border-brand-border rounded-card">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary">Waiting Queue</p>
                      <h4 className="text-xl font-bold mt-1 text-orange-500">4 Patients</h4>
                    </div>
                    <div className="p-4 bg-brand-surface border border-brand-border rounded-card">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary">Completed</p>
                      <h4 className="text-xl font-bold mt-1 text-success">12 Visits</h4>
                    </div>
                  </div>

                  {/* Appointments Queue Table */}
                  <div className="border border-brand-border rounded-card overflow-hidden">
                    <div className="bg-brand-surface px-4 py-3 border-b border-brand-border flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Active Queue</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-100">Live Updating</span>
                    </div>

                    <div className="divide-y divide-brand-border">
                      <div className="px-4 py-3.5 flex items-center justify-between text-xs hover:bg-brand-surface transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-brand-text-primary">Zainab Bibi</span>
                          <span className="text-brand-text-secondary text-[11px]">Age 34 • F</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-brand-text-secondary flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 10:15 AM
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-semibold">Waiting</span>
                        </div>
                      </div>

                      <div className="px-4 py-3.5 flex items-center justify-between text-xs hover:bg-brand-surface transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-brand-text-primary">Muhammad Ali</span>
                          <span className="text-brand-text-secondary text-[11px]">Age 45 • M</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-brand-text-secondary flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 10:30 AM
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-blue-50 text-primary border border-blue-100 text-[10px] font-semibold">In Consultation</span>
                        </div>
                      </div>

                      <div className="px-4 py-3.5 flex items-center justify-between text-xs hover:bg-brand-surface transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-brand-text-primary">Ayesha Begum</span>
                          <span className="text-brand-text-secondary text-[11px]">Age 28 • F</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[11px] text-brand-text-secondary flex items-center gap-1">
                            <Clock className="w-3 h-3" /> 11:00 AM
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-gray-50 text-brand-text-secondary border border-brand-border text-[10px] font-semibold">Scheduled</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {dashboardTab === 'billing' && (
                <div className="space-y-6 text-left">
                  {/* Financial Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    <div className="p-4 bg-brand-surface border border-brand-border rounded-card">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary">Today's Revenue</p>
                      <h4 className="text-xl font-bold mt-1 text-success">PKR 45,000</h4>
                    </div>
                    <div className="p-4 bg-brand-surface border border-brand-border rounded-card">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary">Pending Invoices</p>
                      <h4 className="text-xl font-bold mt-1 text-orange-500">5 Bills</h4>
                    </div>
                    <div className="p-4 bg-brand-surface border border-brand-border rounded-card">
                      <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary">Paid Ratio</p>
                      <h4 className="text-xl font-bold mt-1 text-brand-text-primary">94%</h4>
                    </div>
                  </div>

                  {/* Billing Invoices Mockup */}
                  <div className="border border-brand-border rounded-card overflow-hidden">
                    <div className="bg-brand-surface px-4 py-3 border-b border-brand-border flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-brand-text-primary">Recent Invoices</span>
                      <span className="text-xs text-primary font-semibold hover:underline cursor-pointer">Generate Invoice</span>
                    </div>

                    <div className="divide-y divide-brand-border">
                      <div className="px-4 py-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-brand-text-primary">INV-2026-0042</p>
                          <p className="text-[10px] text-brand-text-secondary">Patient: Muhammad Ali</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-brand-text-primary">PKR 3,500</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-success/15 text-success border border-success/20 text-[10px] font-semibold">Paid</span>
                        </div>
                      </div>

                      <div className="px-4 py-3 flex items-center justify-between text-xs">
                        <div className="space-y-0.5">
                          <p className="font-semibold text-brand-text-primary">INV-2026-0043</p>
                          <p className="text-[10px] text-brand-text-secondary">Patient: Zainab Bibi</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="font-semibold text-brand-text-primary">PKR 5,000</span>
                          <span className="px-2.5 py-0.5 rounded-full bg-orange-50 text-orange-600 border border-orange-100 text-[10px] font-semibold">Pending</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {dashboardTab === 'records' && (
                <div className="space-y-6 text-left">
                  {/* Medical Record Details Preview */}
                  <div className="p-5 border border-brand-border rounded-card bg-brand-surface space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-brand-border">
                      <div>
                        <h4 className="text-sm font-bold text-brand-text-primary">Patient Medical History</h4>
                        <p className="text-[10px] text-brand-text-secondary">ID: PT-84021 - Muhammad Ali</p>
                      </div>
                      <span className="text-[10px] font-semibold text-brand-text-secondary">Last Edited: Today</span>
                    </div>

                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="font-bold text-brand-text-primary block mb-0.5">Chief Complaint</span>
                        <p className="text-brand-text-secondary leading-relaxed">
                          Mild chest discomfort for 2 days, accompanied by slight fatigue. No radiation of pain.
                        </p>
                      </div>

                      <div>
                        <span className="font-bold text-brand-text-primary block mb-0.5">Vital Signs</span>
                        <div className="grid grid-cols-3 gap-2 pt-1">
                          <div className="bg-white p-2 rounded-btn border border-brand-border text-center">
                            <span className="text-[9px] text-brand-text-secondary block">BP</span>
                            <span className="font-semibold text-brand-text-primary">120/80 mmHg</span>
                          </div>
                          <div className="bg-white p-2 rounded-btn border border-brand-border text-center">
                            <span className="text-[9px] text-brand-text-secondary block">Pulse</span>
                            <span className="font-semibold text-brand-text-primary">74 bpm</span>
                          </div>
                          <div className="bg-white p-2 rounded-btn border border-brand-border text-center">
                            <span className="text-[9px] text-brand-text-secondary block">Temp</span>
                            <span className="font-semibold text-brand-text-primary">98.6 °F</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Small Mockup Footer */}
              <div className="pt-4 border-t border-brand-border flex items-center justify-between text-[11px] text-brand-text-secondary">
                <span>Version 1.0 MVP Active</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
                  Synced with Neon Database
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FEATURES GRID ────────────────────────────────────────── */}
      <section id="features" className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Features Overview</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Everything your clinic needs.</h2>
            <p className="text-brand-text-secondary text-base max-w-xl mx-auto">
              ClinicFlow replaces disjointed systems with a unified workflow built for speed and security.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
            {/* Feature 1 */}
            <div className="bg-brand-card p-8 rounded-card border border-brand-border shadow-subtle-sm space-y-4 hover:scale-[1.02] transition-transform duration-200">
              <div className="w-11 h-11 rounded-btn bg-blue-50 border border-blue-100 flex items-center justify-center text-primary">
                <Users className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-lg font-bold text-brand-text-primary">Digital Patient Profiles</h3>
              <p className="text-sm text-brand-text-secondary leading-relaxed">
                Quick patient search, comprehensive timelines, emergency contacts, record history, and allergy logs in a unified space.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-brand-card p-8 rounded-card border border-brand-border shadow-subtle-sm space-y-4 hover:scale-[1.02] transition-transform duration-200">
              <div className="w-11 h-11 rounded-btn bg-teal-50 border border-teal-100 flex items-center justify-center text-secondary">
                <Calendar className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-lg font-bold text-brand-text-primary">Smart Scheduling Queue</h3>
              <p className="text-sm text-brand-text-secondary leading-relaxed">
                Color-coded calendar screens, drag-and-drop bookings, appointment status queues, and clash detection limits.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-brand-card p-8 rounded-card border border-brand-border shadow-subtle-sm space-y-4 hover:scale-[1.02] transition-transform duration-200">
              <div className="w-11 h-11 rounded-btn bg-emerald-50 border border-emerald-100 flex items-center justify-center text-success">
                <FileText className="w-5.5 h-5.5" />
              </div>
              <h3 className="text-lg font-bold text-brand-text-primary">Prescription & Billing</h3>
              <p className="text-sm text-brand-text-secondary leading-relaxed">
                Quickly add medicines, dosage settings, generate professional PDF invoices, configure taxes, and print items.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TESTIMONIALS SECTION ─────────────────────────────────── */}
      <section className="py-16 px-6 bg-brand-surface border-y border-brand-border">
        <div className="max-w-5xl mx-auto space-y-10">
          <div className="text-center">
            <h2 className="text-3xl font-bold tracking-tight">Trusted by Doctors</h2>
            <p className="text-brand-text-secondary text-sm mt-1">What our early adopters have to say about ClinicFlow.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-card border border-brand-border shadow-subtle-sm space-y-4 text-left">
              <p className="text-sm text-brand-text-secondary leading-relaxed italic">
                "Writing physical prescription slips and cataloging files was taking hours daily. ClinicFlow simplified everything. The interface feels premium and is very fast to load."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs">
                  DA
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-text-primary">Dr. Asif Jameel</h4>
                  <p className="text-[10px] text-brand-text-secondary">Child Specialist Clinic Owner</p>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-card border border-brand-border shadow-subtle-sm space-y-4 text-left">
              <p className="text-sm text-brand-text-secondary leading-relaxed italic">
                "We were looking for clinic management software that was simple and fast. Our receptionists and nurses learned it in a single afternoon. Highly recommended!"
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-100 text-teal-600 font-bold flex items-center justify-center text-xs">
                  SN
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-text-primary">Sana Nisar</h4>
                  <p className="text-[10px] text-brand-text-secondary">Clinic Manager, Skin & Dental Care</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PRICING SECTION ──────────────────────────────────────── */}
      <section id="pricing" className="py-20 px-6">
        <div className="max-w-6xl mx-auto space-y-12">
          <div className="text-center space-y-4">
            <span className="text-xs font-bold text-primary uppercase tracking-wider">Pricing Plans</span>
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Flexible plans for any size.</h2>
            <p className="text-brand-text-secondary text-sm max-w-lg mx-auto">
              Choose a plan that fits your practice. All plans include a 14-day risk-free trial.
            </p>

            {/* Toggle Billing */}
            <div className="inline-flex items-center gap-3 bg-brand-surface p-1 rounded-input border border-brand-border shadow-subtle-sm">
              <button
                onClick={() => setIsAnnual(false)}
                className={`px-3 py-1.5 rounded-btn text-xs font-semibold transition-all cursor-pointer ${
                  !isAnnual ? 'bg-white text-primary shadow-subtle-sm border border-brand-border' : 'text-brand-text-secondary'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setIsAnnual(true)}
                className={`px-3 py-1.5 rounded-btn text-xs font-semibold transition-all cursor-pointer ${
                  isAnnual ? 'bg-white text-primary shadow-subtle-sm border border-brand-border' : 'text-brand-text-secondary'
                }`}
              >
                Annual <span className="text-[10px] text-teal-600 font-bold bg-teal-50 px-1 py-0.5 rounded-btn">Save 20%</span>
              </button>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto pt-6">
            {/* Starter Plan */}
            <div className="bg-brand-card p-8 rounded-card border border-brand-border shadow-subtle-sm space-y-6 text-left flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-brand-text-primary">Starter</h3>
                  <p className="text-xs text-brand-text-secondary mt-1">Perfect for single practitioners.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-brand-text-primary">
                    PKR {isAnnual ? '2,399' : '2,999'}
                  </span>
                  <span className="text-xs text-brand-text-secondary">/month</span>
                </div>
                <hr className="border-brand-border" />
                <ul className="space-y-3 text-xs text-brand-text-secondary">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>1 Doctor Account</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>2 Staff Accounts</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Basic Analytics & Reports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Email Support</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="h-11 border border-brand-border hover:bg-brand-surface text-brand-text-primary text-xs font-semibold rounded-btn flex items-center justify-center transition-colors w-full mt-6"
              >
                Start Starter Trial
              </Link>
            </div>

            {/* Professional Plan */}
            <div className="bg-brand-card p-8 rounded-card border-2 border-primary shadow-subtle-md space-y-6 text-left flex flex-col justify-between relative">
              {/* Highlight ribbon */}
              <div className="absolute top-0 right-1/2 translate-x-1/2 -translate-y-1/2 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-bold uppercase tracking-wider">
                Recommended
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-brand-text-primary">Professional</h3>
                  <p className="text-xs text-brand-text-secondary mt-1">For growing multi-doctor clinics.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-brand-text-primary">
                    PKR {isAnnual ? '5,599' : '6,999'}
                  </span>
                  <span className="text-xs text-brand-text-secondary">/month</span>
                </div>
                <hr className="border-brand-border" />
                <ul className="space-y-3 text-xs text-brand-text-secondary">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-brand-text-primary">Unlimited Doctors</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span className="font-semibold text-brand-text-primary">Unlimited Patients</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Advanced Analytics & PDF exports</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Email & In-app Notifications</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Priority Support</span>
                  </li>
                </ul>
              </div>
              <Link
                to="/register"
                className="h-11 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn flex items-center justify-center transition-colors shadow-subtle-sm w-full mt-6"
              >
                Start Professional Trial
              </Link>
            </div>

            {/* Enterprise Plan */}
            <div className="bg-brand-card p-8 rounded-card border border-brand-border shadow-subtle-sm space-y-6 text-left flex flex-col justify-between">
              <div className="space-y-4">
                <div>
                  <h3 className="text-base font-bold text-brand-text-primary">Enterprise</h3>
                  <p className="text-xs text-brand-text-secondary mt-1">For large medical networks.</p>
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-extrabold text-brand-text-primary">
                    Custom
                  </span>
                </div>
                <hr className="border-brand-border" />
                <ul className="space-y-3 text-xs text-brand-text-secondary">
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Multi-branch management</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Dedicated database sandbox</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Dedicated Support Manager</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary shrink-0" />
                    <span>Custom features (Phase 4 integration)</span>
                  </li>
                </ul>
              </div>
              <a
                href="mailto:sales@clinicflow.com?subject=ClinicFlow Enterprise Plan Inquiry"
                className="h-11 border border-brand-border hover:bg-brand-surface text-brand-text-primary text-xs font-semibold rounded-btn flex items-center justify-center transition-colors w-full mt-6"
              >
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FAQ SECTION ──────────────────────────────────────────── */}
      <section id="faq" className="py-20 px-6 bg-brand-surface border-t border-brand-border">
        <div className="max-w-4xl mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
            <p className="text-brand-text-secondary text-sm">Everything you need to know about the ClinicFlow platform.</p>
          </div>

          <div className="divide-y divide-brand-border max-w-2xl mx-auto">
            {faqs.map((faq, index) => (
              <div key={index} className="py-4 text-left">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between text-sm font-semibold text-brand-text-primary py-2 hover:text-primary transition-colors cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4.5 h-4.5 text-primary shrink-0" />
                    {faq.question}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform duration-200 ${
                      expandedFaq === index ? 'rotate-180 text-primary' : 'text-brand-text-secondary'
                    }`}
                  />
                </button>
                <div
                  className={`overflow-hidden transition-all duration-300 ${
                    expandedFaq === index ? 'max-h-40 opacity-100 mt-2' : 'max-h-0 opacity-0'
                  }`}
                >
                  <p className="text-xs text-brand-text-secondary leading-relaxed pl-6.5">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── BOTTOM CTA SECTION ───────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-modal p-8 sm:p-12 text-center text-white relative overflow-hidden shadow-subtle-lg">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-48 h-48 bg-white/10 rounded-full blur-xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-48 h-48 bg-teal-400/20 rounded-full blur-xl pointer-events-none" />

          <div className="relative z-10 space-y-6">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">Ready to transform your practice?</h2>
            <p className="text-sm text-blue-100 max-w-lg mx-auto leading-relaxed">
              Join clinics managing patients and digital prescriptions seamlessly with ClinicFlow. No lock-ins, cancel anytime.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Link
                to="/register"
                className="w-full sm:w-auto h-12 px-6 bg-white hover:bg-blue-50 text-primary font-semibold rounded-btn shadow-subtle-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.02]"
              >
                <span>Get Started Instantly</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-brand-border px-6 py-12 text-xs text-brand-text-secondary">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-btn bg-primary flex items-center justify-center text-white">
                <HeartPulse className="w-4.5 h-4.5" />
              </div>
              <span className="text-base font-bold tracking-tight text-brand-text-primary">ClinicFlow</span>
            </div>
            <p className="leading-relaxed">
              Modern clinic management simplified for small and medium practices. Care faster, bill smarter.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-brand-text-primary">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-primary transition-colors">Features</a></li>
              <li><a href="#preview" className="hover:text-primary transition-colors">Workspace Preview</a></li>
              <li><a href="#pricing" className="hover:text-primary transition-colors">Pricing Options</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-brand-text-primary">Resources</h4>
            <ul className="space-y-2">
              <li><a href="#faq" className="hover:text-primary transition-colors">FAQs</a></li>
              <li><a href="mailto:support@clinicflow.com" className="hover:text-primary transition-colors">Support Email</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-brand-text-primary">Legal</h4>
            <ul className="space-y-2">
              <li><span className="text-brand-text-secondary">Privacy Policy</span></li>
              <li><span className="text-brand-text-secondary">Terms of Service</span></li>
              <li><span className="text-brand-text-secondary">Data Processing Addendum</span></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto pt-8 mt-8 border-t border-brand-border flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© 2026 ClinicFlow Inc. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <span className="hover:underline cursor-pointer">Security Center</span>
            <span>•</span>
            <span className="hover:underline cursor-pointer font-semibold text-primary">MVP Active</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
export default LandingPage;
