import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { CheckCircle2, AlertTriangle, ShieldCheck, Clock, User, Building2, TestTube2, ArrowLeft } from 'lucide-react';
import { labService } from '../../services/lab.service';
import type { LabOrder } from '../../services/lab.service';

export const LabVerificationPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [report, setReport] = useState<LabOrder | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchReport = async () => {
      try {
        setIsLoading(true);
        setError(null);
        const data = await labService.getPublicVerification(id);
        setReport(data);
      } catch (err: any) {
        setError(
          err.response?.data?.message ||
            'Diagnostic verification record not found or invalid QR code signature.'
        );
      } finally {
        setIsLoading(false);
      }
    };
    fetchReport();
  }, [id]);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 text-slate-800">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white text-center relative">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-white/20 backdrop-blur-md mb-3">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight">Official Diagnostic Verification</h1>
          <p className="text-xs text-blue-100 mt-1">Verified Laboratory Report Authentication System</p>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="p-12 text-center space-y-3">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-medium text-slate-500">Authenticating cryptographic digital signature...</p>
          </div>
        )}

        {/* Error / Invalid QR State */}
        {!isLoading && error && (
          <div className="p-8 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Verification Unsuccessful</h3>
              <p className="text-xs text-rose-600 mt-1 max-w-sm mx-auto">{error}</p>
            </div>
            <p className="text-[11px] text-slate-400">
              Please contact the issuing clinic's diagnostic pathology laboratory with your physical slip.
            </p>
          </div>
        )}

        {/* Valid Verified Report */}
        {!isLoading && report && (
          <div className="p-6 space-y-6">
            {/* Verification Status Card */}
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3.5">
              <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <h3 className="text-sm font-bold text-emerald-900">Authentic Diagnostic Report</h3>
                <p className="text-xs text-emerald-700 mt-0.5">
                  This report has been validated directly against the secure laboratory information system.
                </p>
                <div className="mt-2.5 flex flex-wrap gap-2 text-[11px] font-semibold">
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-300">
                    Token: {report.sampleToken || 'Verified'}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-white text-emerald-800 border border-emerald-300">
                    Status: {report.verificationStatus === 'APPROVED' ? 'Pathologist Signed' : report.status}
                  </span>
                </div>
              </div>
            </div>

            {/* Test & Clinic Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  <span>Issuing Clinic</span>
                </div>
                <p className="text-sm font-bold text-slate-900">{report.clinic?.name || 'ClinicFlow Diagnostics'}</p>
                <p className="text-xs text-slate-500 mt-0.5">{report.clinic?.city || 'Healthcare Center'}</p>
                {report.clinic?.phone && (
                  <p className="text-[11px] text-slate-400 mt-1 font-mono">Tel: {report.clinic.phone}</p>
                )}
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                  <User className="w-4 h-4 text-blue-600" />
                  <span>Patient Identity</span>
                </div>
                <p className="text-sm font-bold text-slate-900">
                  {report.patient?.firstName} {report.patient?.lastName}
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  {report.patient?.gender ? `${report.patient.gender} • ` : ''}
                  Blood: {report.patient?.bloodGroup || 'Recorded'}
                </p>
              </div>
            </div>

            {/* Investigation Details */}
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="bg-slate-100/75 px-4 py-2.5 flex items-center justify-between border-b border-slate-200">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <TestTube2 className="w-4 h-4 text-indigo-600" />
                  <span>{report.reportName}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-500">
                  {new Date(report.uploadedAt).toLocaleDateString()}
                </span>
              </div>

              {/* Measured Parameters Table if available */}
              {report.results && Object.keys(report.results).length > 0 ? (
                <div className="p-3">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 text-[10px] text-slate-400 uppercase font-semibold">
                        <th className="py-1.5 px-2">Investigation</th>
                        <th className="py-1.5 px-2">Measured Result</th>
                        <th className="py-1.5 px-2">Reference Range</th>
                        <th className="py-1.5 px-2 text-right">Flag</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(report.results).map(([key, val]: [string, any]) => {
                        const isAbnormal = val.flag === 'HIGH' || val.flag === 'LOW';
                        return (
                          <tr key={key} className={isAbnormal ? 'bg-amber-50/50' : ''}>
                            <td className="py-2 px-2 font-medium text-slate-800 capitalize">
                              {key.replace(/([A-Z])/g, ' $1')}
                            </td>
                            <td className="py-2 px-2 font-bold text-slate-900">
                              {val.value} <span className="text-[10px] font-normal text-slate-500">{val.unit}</span>
                            </td>
                            <td className="py-2 px-2 text-slate-500 text-[11px] font-mono">
                              {val.normalRange || '—'}
                            </td>
                            <td className="py-2 px-2 text-right">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  val.flag === 'HIGH'
                                    ? 'bg-rose-100 text-rose-700'
                                    : val.flag === 'LOW'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-emerald-100 text-emerald-700'
                                }`}
                              >
                                {val.flag || 'NORMAL'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-4 text-center text-xs text-slate-500">
                  Diagnostic investigation processed and registered on system.
                </div>
              )}
            </div>

            {/* Pathologist Verification Details */}
            {report.pathologistSignedAt && (
              <div className="p-4 rounded-xl bg-indigo-50/60 border border-indigo-200/60 text-xs">
                <div className="flex items-center gap-2 font-bold text-indigo-900 mb-1">
                  <Clock className="w-4 h-4 text-indigo-600" />
                  <span>Approved & Digitally Certified By Pathologist</span>
                </div>
                <p className="text-indigo-800 font-medium">
                  {report.pathologistName || 'Consultant Pathologist, MBBS, FCPS (Path)'}
                </p>
                <p className="text-[11px] text-indigo-600 mt-0.5 font-mono">
                  Timestamp: {new Date(report.pathologistSignedAt).toLocaleString()}
                </p>
                {report.pathologistNotes && (
                  <p className="mt-2 text-[11px] text-slate-600 italic bg-white/70 p-2 rounded-lg border border-indigo-100">
                    "{report.pathologistNotes}"
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="bg-slate-50 p-4 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <Link to="/" className="inline-flex items-center gap-1.5 hover:text-blue-600 font-medium">
            <ArrowLeft className="w-4 h-4" />
            <span>ClinicFlow Portal</span>
          </Link>
          <span className="text-[11px] font-mono text-slate-400">ID: {id?.slice(0, 12)}…</span>
        </div>
      </div>
    </div>
  );
};
