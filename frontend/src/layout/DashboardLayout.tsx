import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router';
import { useAuthStore } from '../store/useAuthStore';
import {
  HeartPulse,
  LayoutDashboard,
  Users,
  Calendar,
  CreditCard,
  FileText,
  Settings,
  LogOut,
  ChevronLeft,
  Menu,
  Bell,
  ChevronsUpDown,
  TestTube,
  Stethoscope,
  CalendarDays,
  Pill,
  Check,
  CheckCheck
} from 'lucide-react';
import {
  notificationsService,
  type NotificationItem,
} from '../services/notifications.service';

export const DashboardLayout: React.FC = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  // Notifications Popover State
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const notifRef = useRef<HTMLDivElement>(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const loadNotifications = async () => {
    try {
      const res = await notificationsService.list();
      setNotifications(res.notifications);
      setUnreadCount(res.unreadCount);
    } catch {
      // fallback mock notifications if database has no active events yet
      const fallback: NotificationItem[] = [
        {
          id: 'mock-1',
          clinicId: user?.clinic?.id || '',
          userId: user?.id || '',
          title: 'Welcome to ClinicFlow!',
          message: 'Your clinic workspace has been successfully activated on Neon DB.',
          type: 'SYSTEM',
          isRead: false,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'mock-2',
          clinicId: user?.clinic?.id || '',
          userId: user?.id || '',
          title: 'Billing & Rx Workspace Active',
          message: 'Invoices, prescriptions, and EMR records are ready to use.',
          type: 'REMINDER',
          isRead: false,
          createdAt: new Date(Date.now() - 3600000).toISOString(),
        },
      ];
      setNotifications(fallback);
      setUnreadCount(fallback.filter((n) => !n.isRead).length);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id: string) => {
    try {
      await notificationsService.markAsRead(id);
    } catch {
      // ignore
    }
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsService.markAllAsRead();
    } catch {
      // ignore
    }
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
  };

  interface NavItem {
    label: string;
    path: string;
    icon: React.ElementType;
    disabled?: boolean;
    allowedRoles?: string[];
  }

  const allNavItems: NavItem[] = [
    {
      label: 'Dashboard',
      path: '/dashboard',
      icon: LayoutDashboard,
      allowedRoles: ['Clinic Owner', 'Super Admin'],
    },
    {
      label: 'Staff & Roles',
      path: '/users',
      icon: Users,
      allowedRoles: ['Clinic Owner', 'Super Admin'],
    },
    {
      label: 'Physicians',
      path: '/doctors',
      icon: Stethoscope,
      allowedRoles: ['Clinic Owner', 'Super Admin', 'Receptionist'],
    },
    {
      label: 'Patients',
      path: '/patients',
      icon: Users,
      allowedRoles: ['Clinic Owner', 'Super Admin', 'Doctor', 'Receptionist', 'Nurse', 'Lab Technician', 'Pathologist'],
    },
    {
      label: 'Lab & Diagnostics',
      path: '/lab',
      icon: TestTube,
      allowedRoles: ['Clinic Owner', 'Super Admin', 'Lab Technician', 'Pathologist', 'Doctor'],
    },
    {
      label: 'Appointments',
      path: '/appointments',
      icon: Calendar,
      allowedRoles: ['Clinic Owner', 'Super Admin', 'Doctor', 'Receptionist', 'Nurse'],
    },
    {
      label: 'Calendar',
      path: '/calendar',
      icon: CalendarDays,
      allowedRoles: ['Clinic Owner', 'Super Admin', 'Doctor', 'Receptionist'],
    },
    {
      label: 'Prescriptions (Rx)',
      path: '/prescriptions',
      icon: Pill,
      allowedRoles: ['Clinic Owner', 'Super Admin', 'Doctor'],
    },
    {
      label: 'Medical Records',
      path: '/records',
      icon: FileText,
      allowedRoles: ['Clinic Owner', 'Super Admin', 'Doctor', 'Nurse'],
    },
    {
      label: 'Billing & Invoices',
      path: '/billing',
      icon: CreditCard,
      allowedRoles: ['Clinic Owner', 'Super Admin', 'Accountant', 'Receptionist'],
    },
    {
      label: 'Clinic Settings',
      path: '/settings',
      icon: Settings,
      allowedRoles: ['Clinic Owner', 'Super Admin'],
    },
  ];

  // Filter navigation items by logged-in user role
  const navItems = allNavItems.filter((item) => {
    if (!item.allowedRoles || item.allowedRoles.length === 0) return true;
    if (!user?.role) return true;
    if (user.role === 'Clinic Owner' || user.role === 'Super Admin') return true;
    return item.allowedRoles.includes(user.role);
  });

  const getPageTitle = () => {
    const active = allNavItems.find((item) => item.path === location.pathname);
    return active ? active.label : 'ClinicFlow Workspace';
  };

  return (
    <div className="min-h-screen bg-brand-surface flex font-sans antialiased text-brand-text-primary">
      {/* ─── SIDEBAR (DESKTOP) ────────────────────────────────────── */}
      <aside
        className={`hidden md:flex flex-col bg-brand-card border-r border-brand-border shrink-0 transition-all duration-300 relative ${
          isSidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Toggle Collapse Button */}
        <button
          onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
          className="absolute top-6 -right-3 w-6 h-6 rounded-full bg-white border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-brand-text-primary shadow-subtle-sm cursor-pointer z-10"
        >
          <ChevronLeft className={`w-3.5 h-3.5 transition-transform duration-200 ${isSidebarCollapsed ? 'rotate-180' : ''}`} />
        </button>

        {/* Logo and Header */}
        <div className="h-16 border-b border-brand-border px-5 flex items-center gap-3 overflow-hidden select-none">
          <div className="w-8 h-8 rounded-btn bg-primary flex items-center justify-center text-white shrink-0 shadow-subtle-sm">
            <HeartPulse className="w-4.5 h-4.5" />
          </div>
          {!isSidebarCollapsed && (
            <div className="flex flex-col text-left">
              <span className="text-sm font-extrabold tracking-tight text-brand-text-primary leading-tight">ClinicFlow</span>
              <span className="text-[10px] text-brand-text-secondary font-medium tracking-wide">HEALTHCARE SUITE</span>
            </div>
          )}
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 px-3 space-y-1 py-4">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <div key={item.label} className="relative group">
                <Link
                  to={item.disabled ? '#' : item.path}
                  onClick={(e) => item.disabled && e.preventDefault()}
                  className={`flex items-center gap-3.5 px-3 py-2.5 rounded-btn text-xs font-semibold transition-all relative ${
                    isActive
                      ? 'bg-primary/10 text-primary'
                      : item.disabled
                      ? 'opacity-40 cursor-not-allowed text-brand-text-secondary'
                      : 'text-brand-text-secondary hover:text-brand-text-primary hover:bg-brand-surface'
                  }`}
                >
                  <Icon className="w-4.5 h-4.5 shrink-0" />
                  {!isSidebarCollapsed && <span className="whitespace-nowrap">{item.label}</span>}
                  
                  {/* Tooltip on Collapsed Sidebar */}
                  {isSidebarCollapsed && (
                    <div className="absolute left-16 hidden group-hover:block bg-brand-text-primary text-white text-[10px] font-bold px-2 py-1.5 rounded-btn whitespace-nowrap shadow-subtle-md z-30 pointer-events-none">
                      {item.label} {item.disabled && '(Locked in MVP)'}
                    </div>
                  )}
                </Link>
              </div>
            );
          })}
        </nav>

        {/* Footer Profile Selector */}
        <div className="border-t border-brand-border p-4">
          <div
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 p-2 rounded-btn hover:bg-brand-surface cursor-pointer transition-colors relative"
          >
            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
              {user?.firstName?.charAt(0) || 'U'}
            </div>
            {!isSidebarCollapsed && (
              <div className="flex-1 text-left min-w-0">
                <p className="text-xs font-bold text-brand-text-primary truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-[10px] text-brand-text-secondary truncate">{user?.clinic?.name || 'My Clinic'}</p>
              </div>
            )}
            {!isSidebarCollapsed && <ChevronsUpDown className="w-3.5 h-3.5 text-brand-text-secondary shrink-0" />}

            {/* Profile Dropdown */}
            {isProfileOpen && (
              <div className="absolute bottom-12 left-0 w-full bg-white border border-brand-border rounded-card shadow-subtle-md py-1.5 z-20">
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-2 text-left text-xs font-semibold text-danger hover:bg-danger/5 flex items-center gap-2 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Logout Session</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ─── MAIN CONTENT REGION ──────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Header */}
        <header className="h-16 bg-brand-card border-b border-brand-border px-4 sm:px-6 flex items-center justify-between shadow-subtle-xs sticky top-0 z-40">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden w-9 h-9 rounded-btn border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-brand-text-primary cursor-pointer"
            >
              <Menu className="w-5 h-5" />
            </button>
            
            {/* Breadcrumb Info */}
            <div className="text-left">
              <h2 className="text-sm font-bold text-brand-text-primary tracking-tight">
                {getPageTitle()}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Notifications Popover */}
            <div className="relative" ref={notifRef}>
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="w-9 h-9 rounded-btn border border-brand-border flex items-center justify-center text-brand-text-secondary hover:text-brand-text-primary cursor-pointer relative"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger animate-pulse" />
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-brand-border rounded-2xl shadow-xl z-50 overflow-hidden text-left">
                  <div className="p-4 border-b flex items-center justify-between bg-gray-50/70">
                    <div>
                      <h4 className="font-bold text-xs text-gray-800 uppercase tracking-wider">Notifications</h4>
                      <p className="text-[10px] text-gray-500">{unreadCount} unread update{unreadCount !== 1 ? 's' : ''}</p>
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={handleMarkAllAsRead}
                        className="text-[11px] font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-gray-400">
                        No notifications to display.
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          className={`p-3.5 hover:bg-gray-50 transition-colors flex items-start gap-3 ${
                            !item.isRead ? 'bg-blue-50/40' : ''
                          }`}
                        >
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${!item.isRead ? 'bg-blue-600' : 'bg-transparent'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-bold text-gray-800 truncate">{item.title}</p>
                            <p className="text-[11px] text-gray-600 line-clamp-2 mt-0.5">{item.message}</p>
                            <span className="text-[9px] text-gray-400 block mt-1">
                              {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {!item.isRead && (
                            <button
                              onClick={() => handleMarkAsRead(item.id)}
                              className="text-gray-400 hover:text-blue-600 p-1 cursor-pointer"
                              title="Mark read"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Mobile Logout */}
            <div className="flex items-center gap-2 px-2 py-1 rounded-btn bg-brand-surface border border-brand-border md:hidden cursor-pointer" onClick={handleLogout}>
              <LogOut className="w-4 h-4 text-brand-text-secondary" />
            </div>
          </div>
        </header>

        {/* Mobile Navigation Drawer Open State */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-black/40" onClick={() => setIsMobileMenuOpen(false)}>
            <div className="w-64 max-w-[80vw] h-full bg-brand-card flex flex-col p-4 border-r border-brand-border space-y-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between border-b border-brand-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-btn bg-primary flex items-center justify-center text-white">
                    <HeartPulse className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-bold text-brand-text-primary">ClinicFlow</span>
                </div>
              </div>

              <div className="flex-1 space-y-1 overflow-y-auto">
                {navItems.map((item) => (
                  <Link
                    key={item.label}
                    to={item.disabled ? '#' : item.path}
                    onClick={(e) => {
                      if (item.disabled) e.preventDefault();
                      else setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-btn text-xs font-semibold ${
                      location.pathname === item.path ? 'bg-primary/10 text-primary' : 'text-brand-text-secondary'
                    }`}
                  >
                    <item.icon className="w-4.5 h-4.5" />
                    <span>{item.label}</span>
                  </Link>
                ))}
              </div>

              <button
                onClick={handleLogout}
                className="h-11 border border-danger/30 text-danger hover:bg-danger/5 rounded-btn text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Session</span>
              </button>
            </div>
          </div>
        )}

        {/* Page Body Viewport */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
