import React, { useState } from 'react';
import { StorageService, DEFAULT_SETTINGS } from '../services/storage';
import { Logo } from './Logo.jsx';
import {
  Building2,
  FileText,
  MessageCircle,
  Mail,
  FileSpreadsheet,
  Save,
  RotateCcw,
  CheckCircle2,
  ExternalLink,
  ShieldCheck
} from 'lucide-react';

export const SettingsView = ({
  settings,
  onUpdateSettings
}) => {
  const [formData, setFormData] = useState({ ...settings });
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const updated = StorageService.updateNgoSettings(formData);
    onUpdateSettings(updated);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (confirm('Reset all NGO and receipt settings back to default Kulshrestha Welfare Foundation credentials?')) {
      const reset = StorageService.updateNgoSettings(DEFAULT_SETTINGS);
      setFormData(reset);
      onUpdateSettings(reset);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-700 font-semibold mb-1">
            <span>Administration</span>
            <span aria-hidden="true">·</span>
            <span>CIN: {formData.cin}</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            NGO Details & Receipt Configuration
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure registration certificates, 80G tax URN, authorized signatories, and automated donor notification templates.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {savedSuccess && (
            <span className="inline-flex items-center gap-1.5 text-xs text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-md border border-emerald-200 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Settings Saved
            </span>
          )}
          <button
            type="button"
            onClick={handleResetDefaults}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Restore Defaults</span>
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        
        {/* Section 1: Legal & Statutory Registration */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Building2 className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">
              NGO Statutory & Tax Registration Details
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Organization Legal Name
              </label>
              <input
                type="text"
                required
                value={formData.orgName}
                onChange={(e) => handleChange('orgName', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-medium"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Corporate Identification Number (CIN)
              </label>
              <input
                type="text"
                required
                value={formData.cin}
                onChange={(e) => handleChange('cin', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Income Tax 80G Unique Registration No (URN)
              </label>
              <input
                type="text"
                required
                value={formData.reg80GNumber}
                onChange={(e) => handleChange('reg80GNumber', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg"
              />
              <span className="text-[10px] text-slate-400">Printed on all 80G tax exemption receipts</span>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Section 12A Registration Number
              </label>
              <input
                type="text"
                required
                value={formData.reg12ANumber}
                onChange={(e) => handleChange('reg12ANumber', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Permanent Account Number (PAN)
              </label>
              <input
                type="text"
                required
                value={formData.pan}
                onChange={(e) => handleChange('pan', e.target.value.toUpperCase())}
                className="w-full px-3 py-2 text-xs font-mono uppercase border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Official Website
              </label>
              <input
                type="url"
                required
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg text-sky-700 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs pt-2">
            <div className="sm:col-span-2">
              <label className="block font-semibold text-slate-700 mb-1">
                Registered Office Address
              </label>
              <input
                type="text"
                required
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">City & State</label>
              <input
                type="text"
                required
                value={`${formData.city}, ${formData.state}`}
                onChange={(e) => {
                  const parts = e.target.value.split(',');
                  handleChange('city', parts[0]?.trim() || 'Delhi');
                  handleChange('state', parts[1]?.trim() || 'Delhi');
                }}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Pin Code</label>
              <input
                type="text"
                required
                value={formData.pincode}
                onChange={(e) => handleChange('pincode', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Receipt Numbering & Authorized Signatory */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <FileText className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Receipt Generation Formula & Authorized Signatory
            </h3>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Receipt Prefix
              </label>
              <input
                type="text"
                required
                value={formData.receiptPrefix}
                onChange={(e) => handleChange('receiptPrefix', e.target.value.toUpperCase())}
                placeholder="KWF"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Financial Year
              </label>
              <input
                type="text"
                required
                value={formData.financialYear}
                onChange={(e) => handleChange('financialYear', e.target.value)}
                placeholder="2026-27"
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Authorized Signatory Name
              </label>
              <input
                type="text"
                required
                value={formData.signatoryName}
                onChange={(e) => handleChange('signatoryName', e.target.value)}
                placeholder="Sandeep Kulshrestha"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg font-semibold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Designation / Title
              </label>
              <input
                type="text"
                required
                value={formData.signatoryTitle}
                onChange={(e) => handleChange('signatoryTitle', e.target.value)}
                placeholder="Founder & Director"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
              />
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-lg text-xs text-slate-600 flex items-center justify-between">
            <span>Generated Receipt Number Preview:</span>
            <span className="font-mono font-bold text-sky-700">
              {formData.receiptPrefix}-{formData.financialYear.replace('-', '')}-0106
            </span>
          </div>

          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <input
              type="checkbox"
              id="auto-email-toggle"
              checked={formData.isAutoEmailReceipt}
              onChange={(e) => handleChange('isAutoEmailReceipt', e.target.checked)}
              className="rounded text-sky-600 focus:ring-sky-500"
            />
            <label htmlFor="auto-email-toggle" className="text-xs text-slate-800 font-semibold cursor-pointer">
              Automatically send 80G PDF receipt to donor's email immediately on form submission
            </label>
          </div>
        </div>

        {/* Section 3: Notification Templates (WhatsApp & Email) */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <MessageCircle className="w-4 h-4 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Automated Donor Message Templates
            </h3>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-xs">
            {/* WhatsApp Template */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  WhatsApp Receipt Message Template
                </label>
              </div>
              <textarea
                rows={9}
                value={formData.whatsappTemplate}
                onChange={(e) => handleChange('whatsappTemplate', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 leading-relaxed"
              />
              <p className="text-[10px] text-slate-400">
                Variables: {'{DONOR_NAME}'}, {'{AMOUNT}'}, {'{CAUSE}'}, {'{RECEIPT_NO}'}, {'{DATE}'}, {'{RECEIPT_URL}'}
              </p>
            </div>

            {/* Email Template */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-sky-500" />
                  Email Receipt Body Template
                </label>
              </div>
              <textarea
                rows={9}
                value={formData.emailTemplate}
                onChange={(e) => handleChange('emailTemplate', e.target.value)}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 leading-relaxed"
              />
              <p className="text-[10px] text-slate-400">
                Variables: {'{DONOR_NAME}'}, {'{AMOUNT}'}, {'{AMOUNT_IN_WORDS}'}, {'{CAUSE}'}, {'{RECEIPT_NO}'}, {'{REG_80G}'}
              </p>
            </div>
          </div>
        </div>

        {/* Form Save Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-semibold shadow-sm transition-all focus:ring-2 focus:ring-sky-500"
          >
            <Save className="w-4 h-4" />
            <span>Save Configuration</span>
          </button>
        </div>

      </form>
    </div>
  );
};
