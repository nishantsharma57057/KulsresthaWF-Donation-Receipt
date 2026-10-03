import React, { useState } from 'react';
import { GoogleSheetSyncHub } from './GoogleSheetSyncHub.jsx';
import { ReportsView } from './ReportsView.jsx';
import { SettingsView } from './SettingsView.jsx';
import { EmailWhatsAppSetup } from './EmailWhatsAppSetup.jsx';
import { UserManagementView } from './UserManagementView.jsx';
import { FileSpreadsheet, FileCheck, Building2, Mail, Users } from 'lucide-react';

export const SettingsSyncView = ({
  donations,
  settings,
  currentUser,
  onUpdateSettings,
  onSyncAll,
  isSyncing,
  onSyncSingle,
  onSelectDonation
}) => {
  const [subSection, setSubSection] = useState('comms');

  return (
    <div className="space-y-6">
      
      {/* Simple Segmented Sub-Bar */}
      <div className="bg-white p-2 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-2 shadow-2xs">
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setSubSection('comms')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subSection === 'comms'
                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Mail className="w-3.5 h-3.5 text-rose-600" />
            <span>Gmail & WhatsApp Setup</span>
          </button>

          <button
            onClick={() => setSubSection('sheets')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subSection === 'sheets'
                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Google Sheet Sync</span>
          </button>

          <button
            onClick={() => setSubSection('reports')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subSection === 'reports'
                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <FileCheck className="w-3.5 h-3.5 text-sky-600" />
            <span>80G & Form 10BD</span>
          </button>

          <button
            onClick={() => setSubSection('org')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subSection === 'org'
                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
            <span>NGO & Receipt Details</span>
          </button>

          <button
            onClick={() => setSubSection('users')}
            className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              subSection === 'users'
                ? 'bg-sky-50 text-sky-800 border border-sky-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-3.5 h-3.5 text-purple-600" />
            <span>Team & Login Accounts</span>
          </button>
        </div>

        <div className="hidden lg:block text-[11px] text-slate-400 pr-2">
          {settings.orgName}
        </div>
      </div>

      {/* Render selected section */}
      {subSection === 'comms' && (
        <EmailWhatsAppSetup
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {subSection === 'sheets' && (
        <GoogleSheetSyncHub
          donations={donations}
          settings={settings}
          onSettingsUpdate={onUpdateSettings}
          onSyncAll={onSyncAll}
          isSyncing={isSyncing}
          onSyncSingle={onSyncSingle}
        />
      )}

      {subSection === 'reports' && (
        <ReportsView
          donations={donations}
          settings={settings}
          onSelectDonation={onSelectDonation}
        />
      )}

      {subSection === 'org' && (
        <SettingsView
          settings={settings}
          onUpdateSettings={onUpdateSettings}
        />
      )}

      {subSection === 'users' && (
        <UserManagementView currentUser={currentUser} />
      )}

    </div>
  );
};
