import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { clinicService } from '../../services/clinic.service';
import type { ClinicDetails } from '../../services/clinic.service';
import {
  Building2,
  Mail,
  Phone,
  MapPin,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Save,
  Globe
} from 'lucide-react';

interface BillingInvoice {
  id: string;
  invoiceDate: string;
  amount: string;
  plan: string;
  status: 'Paid' | 'Pending';
}

export const SettingsPage: React.FC = () => {
  const { user, setUser } = useAuthStore();
  
  const [activeTab, setActiveTab] = useState<'profile' | 'localization' | 'billing'>('profile');
  const [clinic, setClinic] = useState<ClinicDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [timezone, setTimezone] = useState('Asia/Karachi');
  const [currency, setCurrency] = useState('PKR');

  // Mock Invoice History
  const invoices: BillingInvoice[] = [
    { id: 'CF-B-0089', invoiceDate: '2026-07-01', amount: 'PKR 6,999', plan: 'Professional Monthly', status: 'Paid' },
    { id: 'CF-B-0062', invoiceDate: '2026-06-01', amount: 'PKR 6,999', plan: 'Professional Monthly', status: 'Paid' }
  ];

  useEffect(() => {
    const fetchClinic = async () => {
      try {
        setIsLoading(true);
        const data = await clinicService.getClinic();
        setClinic(data);
        setName(data.name || '');
        setEmail(data.email || '');
        setPhone(data.phone || '');
        setAddress(data.address || '');
        setCity(data.city || '');
        setCountry(data.country || '');
        setPostalCode(data.postalCode || '');
        setTimezone(data.timezone || 'Asia/Karachi');
        setCurrency(data.currency || 'PKR');
      } catch (err: any) {
        setError('Failed to load clinic settings from server.');
      } finally {
        setIsLoading(false);
      }
    };
    fetchClinic();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user?.role !== 'Clinic Owner' && user?.role !== 'Super Admin') {
      setError('Only Clinic Owners are authorized to modify workspace configurations.');
      return;
    }

    try {
      setIsSaving(true);
      setError(null);
      setSuccessMsg(null);
      
      const updated = await clinicService.updateClinic({
        name,
        email,
        phone,
        address,
        city,
        country,
        postalCode,
        timezone,
        currency,
      });

      setClinic(updated);
      setSuccessMsg('Clinic workspace configurations updated successfully.');
      
      // Update global auth store clinic name representation
      if (user) {
        setUser({
          ...user,
          clinic: {
            ...user.clinic,
            name: updated.name,
            currency: updated.currency,
            timezone: updated.timezone,
          }
        });
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update workspace settings.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-10 w-64 bg-brand-border rounded-btn" />
        <div className="h-44 bg-brand-border rounded-card" />
        <div className="h-64 bg-brand-border rounded-card" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-left">
      {/* Page Title */}
      <div>
        <h2 className="text-xl font-bold tracking-tight text-brand-text-primary">Clinic Configuration Settings</h2>
        <p className="text-xs text-brand-text-secondary mt-1">Configure profile details, localization parameters, and monitor billing cycles.</p>
      </div>

      {/* Tabs Menu Header */}
      <div className="flex border-b border-brand-border gap-2">
        <button
          onClick={() => { setActiveTab('profile'); setError(null); setSuccessMsg(null); }}
          className={`px-4 py-2 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'profile' ? 'border-primary text-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          Workspace Profile
        </button>
        <button
          onClick={() => { setActiveTab('localization'); setError(null); setSuccessMsg(null); }}
          className={`px-4 py-2 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'localization' ? 'border-primary text-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          Localization & Hours
        </button>
        <button
          onClick={() => { setActiveTab('billing'); setError(null); setSuccessMsg(null); }}
          className={`px-4 py-2 border-b-2 text-xs font-semibold transition-colors cursor-pointer ${
            activeTab === 'billing' ? 'border-primary text-primary' : 'border-transparent text-brand-text-secondary hover:text-brand-text-primary'
          }`}
        >
          Billing & Subscription
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-3.5 rounded-btn bg-danger/10 border border-danger/20 text-danger text-xs font-medium flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3.5 rounded-btn bg-success/10 border border-success/20 text-success text-xs font-medium flex items-center gap-2.5">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Tab Panels */}
      <form onSubmit={handleSave}>
        {activeTab === 'profile' && (
          <div className="bg-brand-card p-6 rounded-card border border-brand-border shadow-subtle-sm space-y-6">
            <h3 className="text-xs uppercase font-bold tracking-wider text-brand-text-secondary mb-4">Clinic Identity & Contact</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-brand-text-primary mb-1.5 uppercase">Clinic Name</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-text-primary mb-1.5 uppercase">Billing Email Address</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-text-primary mb-1.5 uppercase">Contact Phone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-text-primary mb-1.5 uppercase">Address Details</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 md:col-span-2">
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-brand-text-primary mb-1.5 uppercase">City</label>
                  <input
                    type="text"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full h-11 px-3 rounded-input bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-brand-text-primary mb-1.5 uppercase">Country</label>
                  <input
                    type="text"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="w-full h-11 px-3 rounded-input bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none"
                  />
                </div>
                <div className="col-span-1">
                  <label className="block text-[11px] font-bold text-brand-text-primary mb-1.5 uppercase">Postal Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={(e) => setPostalCode(e.target.value)}
                    className="w-full h-11 px-3 rounded-input bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'localization' && (
          <div className="bg-brand-card p-6 rounded-card border border-brand-border shadow-subtle-sm space-y-6">
            <h3 className="text-xs uppercase font-bold tracking-wider text-brand-text-secondary mb-4">Localization & System Formats</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-brand-text-primary mb-1.5 uppercase">System Timezone</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                    <Globe className="w-4 h-4" />
                  </div>
                  <select
                    value={timezone}
                    onChange={(e) => setTimezone(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary appearance-none"
                  >
                    <option value="Asia/Karachi">Asia/Karachi (PKT)</option>
                    <option value="Asia/Dubai">Asia/Dubai (GST)</option>
                    <option value="UTC">UTC / GMT</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-brand-text-primary mb-1.5 uppercase">Base Currency</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-brand-text-secondary">
                    <DollarSign className="w-4 h-4" />
                  </div>
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="w-full h-11 pl-10 pr-4 rounded-input bg-brand-surface border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary appearance-none"
                  >
                    <option value="PKR">PKR (₨)</option>
                    <option value="USD">USD ($)</option>
                    <option value="AED">AED (Dh)</option>
                  </select>
                </div>
              </div>
            </div>

            <hr className="border-brand-border" />

            <div className="space-y-2">
              <h4 className="text-xs font-bold text-brand-text-primary">Opening Hours Schedule</h4>
              <p className="text-[10px] text-brand-text-secondary">Set default clinic calendar slots. Unchecked days denote closed days.</p>
              <div className="space-y-2.5 pt-2">
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
                  <div key={day} className="flex items-center justify-between text-xs py-1">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" defaultChecked className="rounded border-brand-border" />
                      <span className="font-semibold text-brand-text-primary">{day}</span>
                    </div>
                    <div className="flex items-center gap-2 text-brand-text-secondary">
                      <span className="text-[11px]">09:00 AM</span>
                      <span>to</span>
                      <span className="text-[11px]">05:00 PM</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Plan Card */}
            <div className="bg-brand-card p-6 rounded-card border border-brand-border shadow-subtle-sm flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-left space-y-1">
                <p className="text-[10px] uppercase font-bold tracking-wider text-brand-text-secondary">Active Subscription Plan</p>
                <div className="flex items-center gap-2">
                  <h3 className="text-lg font-bold text-brand-text-primary capitalize">{clinic?.subscriptionPlan || 'Starter'}</h3>
                  <span className="px-2 py-0.5 rounded-full bg-success/15 text-success border border-success/20 text-[9px] font-bold uppercase tracking-wider">
                    {clinic?.subscriptionStatus || 'Active'}
                  </span>
                </div>
                <p className="text-[11px] text-brand-text-secondary">Next bill on: September 1, 2026</p>
              </div>

              <div className="text-right">
                <button
                  type="button"
                  className="h-10 px-4 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm transition-colors cursor-pointer"
                >
                  Upgrade Subscription
                </button>
              </div>
            </div>

            {/* Invoices History */}
            <div className="bg-brand-card p-6 rounded-card border border-brand-border shadow-subtle-sm space-y-4">
              <h3 className="text-xs uppercase font-bold tracking-wider text-brand-text-secondary">Billing Invoice History</h3>

              <div className="border border-brand-border rounded-card overflow-hidden">
                <div className="bg-brand-surface grid grid-cols-4 px-4 py-2.5 text-[10px] uppercase font-bold text-brand-text-secondary border-b border-brand-border">
                  <span>Invoice ID</span>
                  <span>Billing Date</span>
                  <span>Amount</span>
                  <span className="text-right">Status</span>
                </div>

                <div className="divide-y divide-brand-border text-xs text-brand-text-primary">
                  {invoices.map((inv) => (
                    <div key={inv.id} className="grid grid-cols-4 px-4 py-3 items-center hover:bg-brand-surface/40 transition-colors">
                      <span className="font-semibold text-primary">{inv.id}</span>
                      <span>{inv.invoiceDate}</span>
                      <span>{inv.amount}</span>
                      <span className="text-right">
                        <span className="px-2 py-0.5 rounded-full bg-success/10 text-success border border-success/20 text-[9px] font-bold">
                          {inv.status}
                        </span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Actions Panel */}
        {activeTab !== 'billing' && (
          <div className="pt-4 text-right">
            <button
              type="submit"
              disabled={isSaving}
              className="h-11 px-5 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center justify-center gap-1.5 hover:scale-[1.01] active:scale-[0.99] transition-all ml-auto cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Settings</span>
                </>
              )}
            </button>
          </div>
        )}
      </form>
    </div>
  );
};
export default SettingsPage;
