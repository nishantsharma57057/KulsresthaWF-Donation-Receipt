import React from 'react';
import { Logo } from './Logo.jsx';
import { APP_CONFIG } from '../config/appConfig';
import {
  LayoutDashboard,
  Heart,
  BarChart2,
  Settings,
  Users,
  Plus,
  Shield,
  LogOut
} from 'lucide-react';

export const Sidebar = ({
  activeTab,
  onSelectTab,
  onOpenNewDonation,
  onLogout,
  currentUser,
  donationsCount
}) => {
  const showSettings = APP_CONFIG?.ui?.showSettingsInSidebar ?? false;
  const showUsers = APP_CONFIG?.ui?.showUserAccessInSidebar ?? true;

  const navItems = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'donations', label: 'Donations', icon: Heart, badge: donationsCount },
    { id: 'reports', label: 'Reports', icon: BarChart2 },
    ...(showSettings ? [{ id: 'settings', label: 'Settings', icon: Settings }] : []),
    ...(showUsers ? [{ id: 'users', label: 'User access', icon: Users }] : [])
  ];

  const getInitials = (name) => {
    if (!name) return 'NS';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <aside className="kwf-sidebar w-64 bg-[#0e263e] text-white flex flex-col justify-between shrink-0 select-none min-h-screen border-r border-slate-800">

      {/* Top Section */}
      <div>
        {/* Brand Logo in White Card (Image 2 & 3) */}
        <div className="p-4 border-b border-slate-800/80">
          <div className="bg-white px-3.5 py-2.5 rounded-lg shadow-sm flex items-center justify-center">
            <Logo size="sm" />
          </div>
        </div>

        {/* Section Header */}
        <div className="px-5 pt-6 pb-2">
          <span className="text-[10px] font-semibold text-slate-400 tracking-[0.18em] uppercase block">
            FOUNDATION WORKSPACE
          </span>
        </div>

        {/* Navigation Items */}
        <nav aria-label="Workspace navigation" className="px-3 space-y-1 mt-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
                onClick={() => onSelectTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-[15px] font-semibold transition-all ${isActive
                    ? 'bg-[#163b5e] text-white shadow-2xs font-bold'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/50'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-[18px] h-[18px] ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {typeof item.badge === 'number' && (
                  <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-800 text-slate-300">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* + New donation button (Image 2 & 3) */}
        <div className="px-3 mt-4">
          <button
            onClick={onOpenNewDonation}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white border border-slate-700 hover:border-sky-500 hover:bg-slate-800/80 transition-all active:scale-[0.99]"
          >
            <Plus className="w-3.5 h-3.5 text-sky-400" />
            <span>New donation</span>
          </button>
        </div>
      </div>

      {/* Bottom Section: Workspace note & User info */}
      <div className="kwf-sidebar-footer p-4 border-t border-slate-800/80 space-y-4">

        {/* Private workspace badge (Image 2) */}
        <div className="flex items-center gap-2.5 text-xs text-slate-300">
          <Shield className="w-4 h-4 text-sky-400 shrink-0" />
          <div className="text-[11px] leading-tight">
            <span className="font-semibold text-slate-200 block">Private workspace</span>
            <span className="text-slate-400 text-[10px]">Your records, protected.</span>
          </div>
        </div>

        {/* Current User Row (Image 2) */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800/60">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-800 flex items-center justify-center font-bold text-xs font-mono shadow-sm">
              {currentUser ? getInitials(currentUser.name) : 'NS'}
            </div>
            <div className="leading-tight">
              <span className="font-bold text-xs text-white block">
                {currentUser?.status === 'main_admin' ? 'Main admin' : currentUser?.name || 'Main admin'}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                {currentUser?.username || 'nishantsharma'}
              </span>
            </div>
          </div>

          <button
            onClick={onLogout}
            title="Log out of workspace"
            className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800/60 rounded-md transition-colors"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </div>

    </aside>
  );
};
