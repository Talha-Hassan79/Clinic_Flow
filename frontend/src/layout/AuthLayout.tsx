import React from 'react';
import { Activity, ShieldCheck, Zap, HeartPulse } from 'lucide-react';

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle: string;
}

export const AuthLayout: React.FC<AuthLayoutProps> = ({ children, title, subtitle }) => {
  return (
    <div className="min-h-screen bg-brand-surface flex justify-center items-center p-4 sm:p-6 lg:p-8 font-sans">
      <div className="w-full max-w-5xl bg-brand-card rounded-modal border border-brand-border shadow-subtle-lg overflow-hidden grid grid-cols-1 lg:grid-cols-12 min-h-[640px]">
        {/* Left Side Showcase Panel (Visible on Desktop) */}
        <div className="hidden lg:flex lg:col-span-5 bg-gradient-to-br from-blue-600 to-indigo-700 p-10 flex-col justify-between text-white relative overflow-hidden">
          {/* Subtle background glow graphics */}
          <div className="absolute top-0 right-0 -mt-10 -mr-10 w-64 h-64 bg-white/10 rounded-full blur-2xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-64 h-64 bg-teal-400/20 rounded-full blur-2xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-btn bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20">
                <HeartPulse className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-bold tracking-tight">ClinicFlow</span>
            </div>
            <p className="text-blue-100 text-sm font-medium">Modern Clinic Management Simplified</p>
          </div>

          {/* Center Content / Highlights */}
          <div className="relative z-10 space-y-6 my-auto py-8">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Zap className="w-4 h-4 text-teal-300" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Instant Patient Records</h4>
                  <p className="text-xs text-blue-100/80 leading-relaxed">
                    Digital medical charts, history, and vitals accessible in milliseconds.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <Activity className="w-4 h-4 text-teal-300" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Smart Scheduling</h4>
                  <p className="text-xs text-blue-100/80 leading-relaxed">
                    Eliminate waiting times with conflict-free doctor schedules.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 mt-0.5">
                  <ShieldCheck className="w-4 h-4 text-teal-300" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-white">Bank-Grade Security</h4>
                  <p className="text-xs text-blue-100/80 leading-relaxed">
                    Encrypted multi-tenant data isolation and audit logging.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Footer Quote */}
          <div className="relative z-10 pt-4 border-t border-white/15">
            <p className="text-xs text-blue-100/90 italic">
              "ClinicFlow replaced our paper files completely in less than a week."
            </p>
            <p className="text-[11px] font-semibold text-white/80 mt-1">
              Dr. Ahmed Khan — General Physician
            </p>
          </div>
        </div>

        {/* Right Side Form Container */}
        <div className="col-span-1 lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-brand-card">
          {/* Mobile Header */}
          <div className="lg:hidden flex items-center gap-2 mb-6">
            <div className="w-9 h-9 rounded-btn bg-primary/10 flex items-center justify-center text-primary">
              <HeartPulse className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-brand-text-primary tracking-tight">ClinicFlow</span>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-brand-text-primary tracking-tight">
              {title}
            </h2>
            <p className="text-sm text-brand-text-secondary mt-1.5 leading-relaxed">
              {subtitle}
            </p>
          </div>

          {/* Form Body */}
          {children}
        </div>
      </div>
    </div>
  );
};
