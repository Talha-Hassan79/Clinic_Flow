import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { usersService } from '../../services/users.service';
import type { ClinicUser } from '../../services/users.service';
import {
  UserPlus,
  Search,
  Shield,
  CheckCircle,
  XCircle,
  AlertCircle,
  X,
  Users,
  UserCheck,
  UserX,
} from 'lucide-react';

const ROLE_COLORS: Record<string, string> = {
  'Clinic Owner':   'bg-blue-50 text-blue-700 border-blue-200',
  'Super Admin':    'bg-purple-50 text-purple-700 border-purple-200',
  'Doctor':         'bg-teal-50 text-teal-700 border-teal-200',
  'Pathologist':    'bg-indigo-50 text-indigo-700 border-indigo-200',
  'Lab Technician': 'bg-cyan-50 text-cyan-700 border-cyan-200',
  'Receptionist':   'bg-orange-50 text-orange-700 border-orange-200',
  'Nurse':          'bg-pink-50 text-pink-700 border-pink-200',
  'Accountant':     'bg-emerald-50 text-emerald-700 border-emerald-200',
};

interface Role { id: string; name: string; }
interface InviteForm { firstName: string; lastName: string; email: string; roleId: string; }

export const UsersPage: React.FC = () => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Clinic Owner' || user?.role === 'Super Admin';

  const [users, setUsers]           = useState<ClinicUser[]>([]);
  const [roles, setRoles]           = useState<Role[]>([]);
  const [isLoading, setIsLoading]   = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [search, setSearch]         = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteForm>({ firstName: '', lastName: '', email: '', roleId: '' });
  const [isInviting, setIsInviting] = useState(false);
  const [tempPasswordInfo, setTempPasswordInfo] = useState<{ name: string; email: string; password: string } | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true);
        const [usersData, rolesData] = await Promise.all([
          usersService.listUsers(),
          usersService.listRoles ? usersService.listRoles() : Promise.resolve([]),
        ]);
        setUsers(usersData);
        setRoles(rolesData as Role[]);
      } catch {
        setError('Failed to load workspace users.');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // Filter helpers
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      `${u.firstName} ${u.lastName}`.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role?.name === roleFilter;
    return matchSearch && matchRole;
  });

  const totalActive   = users.filter((u) => u.isActive).length;
  const totalInactive = users.filter((u) => !u.isActive).length;

  // Invite
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsInviting(true);
      setError(null);
      const res = await usersService.inviteUser(inviteForm);
      setUsers((prev) => [...prev, res]);
      setShowInvite(false);
      setInviteForm({ firstName: '', lastName: '', email: '', roleId: '' });
      setTempPasswordInfo({
        name: `${res.firstName} ${res.lastName}`,
        email: res.email,
        password: res.tempPassword,
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to invite user.');
    } finally {
      setIsInviting(false);
    }
  };

  // Toggle status
  const handleToggle = async (u: ClinicUser) => {
    try {
      setTogglingId(u.id);
      const updated = u.isActive
        ? await usersService.deactivateUser(u.id)
        : await usersService.reactivateUser(u.id);
      setUsers((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
    } catch {
      setError('Failed to update user status.');
    } finally {
      setTogglingId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse text-left">
        <div className="h-24 bg-brand-border rounded-card" />
        <div className="h-10 bg-brand-border rounded-btn w-1/2" />
        <div className="h-64 bg-brand-border rounded-card" />
      </div>
    );
  }

  return (
    <div className="space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-brand-text-primary">User Management</h2>
          <p className="text-xs text-brand-text-secondary mt-0.5">Manage clinic workspace staff, roles, and access control.</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowInvite(true)}
            className="h-10 px-4 bg-primary hover:bg-blue-700 text-white text-xs font-semibold rounded-btn shadow-subtle-sm flex items-center gap-2 cursor-pointer transition-all hover:scale-[1.02]"
          >
            <UserPlus className="w-4 h-4" />
            <span>Invite User</span>
          </button>
        )}
      </div>

      {/* Error / Alerts */}
      {error && (
        <div className="p-3.5 rounded-btn bg-danger/10 border border-danger/20 text-danger text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-auto cursor-pointer"><X className="w-3.5 h-3.5" /></button>
        </div>
      )}

      {/* Temp Password Info Banner */}
      {tempPasswordInfo && (
        <div className="p-4 rounded-card bg-success/10 border border-success/20 text-success text-xs space-y-1">
          <div className="font-bold flex items-center gap-2"><CheckCircle className="w-4 h-4" /> User Invited Successfully</div>
          <p>Share these credentials with <span className="font-semibold">{tempPasswordInfo.name}</span> ({tempPasswordInfo.email}):</p>
          <p className="font-mono bg-white/60 px-3 py-1.5 rounded-btn inline-block border border-success/20 text-brand-text-primary">
            Temp Password: <span className="font-bold">{tempPasswordInfo.password}</span>
          </p>
          <button onClick={() => setTempPasswordInfo(null)} className="ml-2 text-success/70 underline cursor-pointer text-[10px]">Dismiss</button>
        </div>
      )}

      {/* Stats Strip */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-blue-50 border border-blue-100 flex items-center justify-center text-primary shrink-0"><Users className="w-4.5 h-4.5" /></div>
          <div><p className="text-[10px] font-bold uppercase text-brand-text-secondary">Total Staff</p><p className="text-xl font-extrabold text-brand-text-primary">{users.length}</p></div>
        </div>
        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-success/10 border border-success/20 flex items-center justify-center text-success shrink-0"><UserCheck className="w-4.5 h-4.5" /></div>
          <div><p className="text-[10px] font-bold uppercase text-brand-text-secondary">Active</p><p className="text-xl font-extrabold text-brand-text-primary">{totalActive}</p></div>
        </div>
        <div className="bg-brand-card p-4 rounded-card border border-brand-border shadow-subtle-sm flex items-center gap-3">
          <div className="w-9 h-9 rounded-btn bg-danger/10 border border-danger/20 flex items-center justify-center text-danger shrink-0"><UserX className="w-4.5 h-4.5" /></div>
          <div><p className="text-[10px] font-bold uppercase text-brand-text-secondary">Inactive</p><p className="text-xl font-extrabold text-brand-text-primary">{totalInactive}</p></div>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text-secondary pointer-events-none" />
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-10 pr-4 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none focus:border-primary"
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-10 px-3 rounded-input bg-brand-card border border-brand-border text-xs text-brand-text-primary focus:outline-none appearance-none cursor-pointer"
        >
          <option value="">All Roles</option>
          {Object.keys(ROLE_COLORS).map((r) => <option key={r} value={r}>{r}</option>)}
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-brand-card rounded-card border border-brand-border shadow-subtle-sm overflow-hidden">
        <div className="hidden sm:grid grid-cols-12 px-5 py-3 bg-brand-surface border-b border-brand-border text-[10px] font-bold uppercase text-brand-text-secondary">
          <span className="col-span-4">Staff Member</span>
          <span className="col-span-3">Role</span>
          <span className="col-span-2">Status</span>
          <span className="col-span-2">Last Login</span>
          {isAdmin && <span className="col-span-1 text-right">Actions</span>}
        </div>

        <div className="divide-y divide-brand-border">
          {filtered.length === 0 ? (
            <div className="py-12 text-center text-xs text-brand-text-secondary">
              <Shield className="w-8 h-8 mx-auto mb-2 opacity-30" />
              {search || roleFilter ? 'No users match your filters.' : 'No users in this workspace yet. Invite your first team member!'}
            </div>
          ) : filtered.map((u) => (
            <div key={u.id} className="grid grid-cols-12 px-5 py-4 items-center text-xs hover:bg-brand-surface/50 transition-colors">
              {/* Name & Email */}
              <div className="col-span-12 sm:col-span-4 flex items-center gap-3 mb-2 sm:mb-0">
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                  {u.firstName.charAt(0)}{u.lastName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-brand-text-primary">{u.firstName} {u.lastName}</p>
                  <p className="text-[10px] text-brand-text-secondary">{u.email}</p>
                </div>
              </div>

              {/* Role Badge */}
              <div className="col-span-6 sm:col-span-3">
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ROLE_COLORS[u.role?.name] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {u.role?.name || 'No Role'}
                </span>
              </div>

              {/* Status */}
              <div className="col-span-6 sm:col-span-2">
                {u.isActive ? (
                  <span className="flex items-center gap-1 text-success text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-success" />Active
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-brand-text-secondary text-[10px] font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-border" />Inactive
                  </span>
                )}
              </div>

              {/* Last Login */}
              <div className="col-span-6 sm:col-span-2 text-brand-text-secondary text-[10px]">
                {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
              </div>

              {/* Actions */}
              {isAdmin && (
                <div className="col-span-6 sm:col-span-1 flex justify-end">
                  <button
                    onClick={() => handleToggle(u)}
                    disabled={togglingId === u.id}
                    title={u.isActive ? 'Deactivate user' : 'Reactivate user'}
                    className={`w-8 h-8 rounded-btn border flex items-center justify-center transition-all cursor-pointer disabled:opacity-50 ${
                      u.isActive
                        ? 'border-danger/30 text-danger hover:bg-danger/10'
                        : 'border-success/30 text-success hover:bg-success/10'
                    }`}
                  >
                    {togglingId === u.id ? (
                      <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : u.isActive ? (
                      <XCircle className="w-4 h-4" />
                    ) : (
                      <CheckCircle className="w-4 h-4" />
                    )}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Invite User Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-modal shadow-subtle-lg w-full max-w-md p-6 space-y-5 text-left">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-brand-text-primary">Invite Team Member</h3>
                <p className="text-[10px] text-brand-text-secondary mt-0.5">A temporary password will be generated for the new user.</p>
              </div>
              <button onClick={() => setShowInvite(false)} className="text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1.5 text-brand-text-primary">First Name</label>
                  <input
                    required value={inviteForm.firstName}
                    onChange={(e) => setInviteForm(f => ({ ...f, firstName: e.target.value }))}
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold uppercase mb-1.5 text-brand-text-primary">Last Name</label>
                  <input
                    required value={inviteForm.lastName}
                    onChange={(e) => setInviteForm(f => ({ ...f, lastName: e.target.value }))}
                    className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1.5 text-brand-text-primary">Email Address</label>
                <input
                  type="email" required value={inviteForm.email}
                  onChange={(e) => setInviteForm(f => ({ ...f, email: e.target.value }))}
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold uppercase mb-1.5 text-brand-text-primary">Assign Role</label>
                <select
                  required value={inviteForm.roleId}
                  onChange={(e) => setInviteForm(f => ({ ...f, roleId: e.target.value }))}
                  className="w-full h-10 px-3 rounded-input bg-brand-surface border border-brand-border text-xs focus:outline-none focus:border-primary appearance-none"
                >
                  <option value="">Select a role…</option>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="flex-1 h-10 border border-brand-border rounded-btn text-xs font-semibold text-brand-text-secondary hover:bg-brand-surface cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 h-10 bg-primary hover:bg-blue-700 text-white rounded-btn text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {isInviting ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <><UserPlus className="w-4 h-4" /><span>Send Invite</span></>
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
export default UsersPage;
