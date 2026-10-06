import React, { useState, useMemo } from 'react';
import { DonationActionsMenu } from './DonationActionsMenu';
import { StorageService } from '../services/storage';
import { formatIndianCurrency } from '../utils/numberToWords';
import { downloadDonationPdf, printDonationReceipt } from '../utils/receiptGenerator';
import {
  Search,
  Filter,
  Download,
  Printer,
  MessageCircle,
  Mail,
  Eye,
  Trash2,
  RefreshCw,
  CheckCircle2,
  Plus,
  FileSpreadsheet,
  FileText,
  X,
  Heart,
  IndianRupee,
  Clock3
} from 'lucide-react';

export const DonationsListView = ({
  donations,
  settings,
  onOpenNewDonation,
  onSelectDonation,
  onOpenWhatsApp,
  onOpenEmail,
  onDonationUpdated,
  onSyncSingle
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [causeFilter, setCauseFilter] = useState('all');
  const [modeFilter, setModeFilter] = useState('all');
  const [sheetFilter, setSheetFilter] = useState('all');
  const [taxFilter, setTaxFilter] = useState('all');

  const filteredDonations = useMemo(() => {
    return donations.filter((d) => {
      // Search term
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const matches =
          String(d.receiptNo || '').toLowerCase().includes(query) ||
          String(d.donorName || '').toLowerCase().includes(query) ||
          String(d.donorPhone || '').toLowerCase().includes(query) ||
          String(d.donorEmail || '').toLowerCase().includes(query) ||
          String(d.donorPan || '').toLowerCase().includes(query) ||
          String(d.transactionId || '').toLowerCase().includes(query) ||
          String(d.donorCity || '').toLowerCase().includes(query);
        if (!matches) return false;
      }

      // Cause filter
      if (causeFilter !== 'all' && d.cause !== causeFilter) return false;

      // Mode filter
      if (modeFilter !== 'all' && d.paymentMode !== modeFilter) return false;

      // Sheet filter
      if (sheetFilter !== 'all' && d.googleSheetStatus !== sheetFilter) return false;

      // Tax 80G filter
      if (taxFilter === '80g' && !d.is80GEligible) return false;
      if (taxFilter === 'non-80g' && d.is80GEligible) return false;

      return true;
    });
  }, [donations, searchTerm, causeFilter, modeFilter, sheetFilter, taxFilter]);

  const summary = useMemo(() => ({
    total: donations.reduce((sum, d) => sum + Number(d.amount || 0), 0),
    synced: donations.filter(d => d.googleSheetStatus === 'synced').length,
    pending: donations.filter(d => d.googleSheetStatus === 'pending').length
  }), [donations]);

  const handleDelete = (id, receiptNo) => {
    if (confirm(`Are you sure you want to delete receipt ${receiptNo}? This cannot be undone.`)) {
      StorageService.deleteDonation(id);
      onDonationUpdated();
    }
  };

  const handleExportCsv = () => {
    StorageService.exportDonationsToCsv();
  };

  const handleExport10BD = () => {
    StorageService.exportForm10BDReport();
  };

  const clearFilters = () => {
    setSearchTerm('');
    setCauseFilter('all');
    setModeFilter('all');
    setSheetFilter('all');
    setTaxFilter('all');
  };

  const isFiltered =
    searchTerm !== '' ||
    causeFilter !== 'all' ||
    modeFilter !== 'all' ||
    sheetFilter !== 'all' ||
    taxFilter !== 'all';

  return (
    <div className="kwf-donations space-y-5 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-5 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-600">Foundation workspace</p>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900">Donations Ledger & Records</h1>
          <p className="text-xs text-slate-500">
            Manage your donations, receipts and donor communications in one place.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleExport10BD}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Form 10BD Statement</span>
          </button>

          <button
            onClick={onOpenNewDonation}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-sky-600 hover:bg-sky-700 rounded-lg shadow-sm transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>New Donation</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Total donations', value: formatIndianCurrency(summary.total), icon: IndianRupee, color: 'bg-sky-50 text-sky-600', detail: 'Across all recorded receipts' },
          { label: 'Donation receipts', value: donations.length, icon: Heart, color: 'bg-indigo-50 text-indigo-600', detail: 'Every contribution, accounted for' },
          { label: 'Pending sheet sync', value: summary.pending, icon: Clock3, color: 'bg-amber-50 text-amber-600', detail: summary.synced + ' receipts synced to Google Sheets' }
        ].map(({ label, value, icon: Icon, color, detail }) => (
          <div key={label} className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <div><p className="text-xs font-medium text-slate-500">{label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 tabular-nums">{value}</p><p className="mt-2 text-[11px] text-slate-400">{detail}</p></div>
            <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${color}`}><Icon className="h-5 w-5" /></span>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 space-y-4 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              aria-label="Search donations"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by receipt #, donor name, phone, PAN, transaction ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                aria-label="Clear search"
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Cause Dropdown */}
          <div>
            <select
              aria-label="Donation cause"
              value={causeFilter}
              onChange={(e) => setCauseFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 text-slate-700"
            >
              <option value="all">All Causes & Missions</option>
              <option value="Child Education">Child Education</option>
              <option value="Hunger Relief & Food">Hunger Relief & Food</option>
              <option value="Women Empowerment">Women Empowerment</option>
              <option value="Healthcare & Medical">Healthcare & Medical</option>
              <option value="Community Development">Community Development</option>
              <option value="General Fund">General Fund</option>
            </select>
          </div>

          {/* Payment Mode Dropdown */}
          <div>
            <select
              aria-label="Payment mode"
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500 text-slate-700"
            >
              <option value="all">All Payment Modes</option>
              <option value="UPI">UPI / QR Code</option>
              <option value="Net Banking / NEFT">Net Banking / NEFT</option>
              <option value="Credit / Debit Card">Credit / Debit Card</option>
              <option value="Cheque / DD">Cheque / DD</option>
              <option value="Cash">Cash</option>
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <div className="flex flex-wrap gap-3">
            <div role="group" aria-label="Google Sheets sync filter" className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-1">
              {[
                ['all', 'All donations', donations.length],
                ['synced', 'Sheet synced', summary.synced],
                ['pending', 'Pending sync', summary.pending]
              ].map(([key, label, count]) => (
                <button key={key} type="button" aria-pressed={sheetFilter === key} onClick={() => setSheetFilter(key)}
                  className={`inline-flex min-h-9 items-center gap-2 rounded-lg px-3 text-xs font-medium transition-colors ${sheetFilter === key ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:bg-white/60 hover:text-slate-800'}`}>
                  {label}<span className={`rounded-md px-1.5 py-0.5 text-[10px] tabular-nums ${sheetFilter === key ? 'bg-sky-50 text-sky-700' : 'bg-slate-200/70 text-slate-500'}`}>{count}</span>
                </button>
              ))}
            </div>
            <div role="group" aria-label="80G eligibility filter" className="inline-flex items-center gap-1 rounded-xl bg-slate-100 p-1">
              {[['all', 'All 80G'], ['80g', '80G eligible']].map(([key, label]) => (
                <button key={key} type="button" aria-pressed={taxFilter === key} onClick={() => setTaxFilter(key)}
                  className={`min-h-9 rounded-lg px-3 text-xs font-medium transition-colors ${taxFilter === key ? 'bg-white text-sky-700 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>{label}</button>
              ))}
            </div>
          </div>
          {isFiltered && <button onClick={clearFilters} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-sky-700"><X className="h-3.5 w-3.5" />Reset filters</button>}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 py-4 border-b border-slate-100"><h2 className="text-sm font-semibold text-slate-900">Donation records <span className="ml-2 rounded-full bg-sky-50 px-2 py-0.5 text-xs text-sky-700">{filteredDonations.length}</span></h2></div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Receipt #</th>
                <th className="py-3.5 px-4">Date</th>
                <th className="py-3.5 px-4">Donor Information</th>
                <th className="py-3.5 px-4">PAN (80G)</th>
                <th className="py-3.5 px-4">Cause</th>
                <th className="py-3.5 px-4 text-right">Amount (₹)</th>
                <th className="py-3.5 px-4">Payment & Ref</th>
                <th className="py-3.5 px-4 text-center">Sheet Sync</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredDonations.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    <p className="font-semibold text-slate-700 text-sm">No donations match your search or filter</p>
                    <p className="text-xs text-slate-400 mt-1">Try clearing filters or enter a new donation.</p>
                    <button
                      onClick={clearFilters}
                      className="mt-3 px-3 py-1.5 text-xs text-sky-700 bg-sky-50 hover:bg-sky-100 rounded-md font-medium"
                    >
                      Clear All Filters
                    </button>
                  </td>
                </tr>
              ) : (
                filteredDonations.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/70 transition-colors">
                    {/* Receipt No */}
                    <td className="py-3 px-4">
                      <button
                        onClick={() => onSelectDonation(d)}
                        className="font-mono font-bold text-sky-700 hover:text-sky-800 hover:underline text-left block"
                      >
                        {d.receiptNo}
                      </button>
                    </td>

                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600">
                      <div>{d.date}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{d.time}</div>
                    </td>

                    {/* Donor Info */}
                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-900 truncate max-w-[160px]">{d.donorName}</p>
                      <p className="text-[11px] text-slate-500 truncate max-w-[160px]">{d.donorPhone}</p>
                      <p className="text-[10px] text-slate-400">{d.donorCity}</p>
                    </td>

                    {/* PAN (80G) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {d.donorPan ? (
                        <span className="font-mono text-xs font-semibold text-slate-800 bg-slate-100 px-1.5 py-0.5 rounded">
                          {d.donorPan}
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400">No PAN</span>
                      )}
                    </td>

                    {/* Cause */}
                    <td className="py-3 px-4">
                      <span className="font-medium text-slate-800 truncate block max-w-[130px]">
                        {d.cause}
                      </span>
                    </td>

                    {/* Amount */}
                    <td className="py-3 px-4 text-right">
                      <span className="font-mono font-bold text-slate-900 text-sm">
                        ₹{d.amount.toLocaleString('en-IN')}
                      </span>
                    </td>

                    {/* Payment Mode */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{d.paymentMode}</div>
                      <div className="text-[10px] font-mono text-slate-400 truncate max-w-[120px]">
                        {d.transactionId}
                      </div>
                    </td>

                    {/* Google Sheet Sync */}
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {d.googleSheetStatus === 'synced' ? (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium border border-emerald-200"
                          title={`Synced into Google Sheet (Row #${d.googleSheetRowId || '2'})`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Synced</span>
                        </span>
                      ) : (
                        <button
                          onClick={() => onSyncSingle(d.id)}
                          className="inline-flex items-center gap-1 text-[11px] text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded font-medium border border-amber-200 transition-colors"
                          title="Click to sync this donation to Google Sheet"
                        >
                          <RefreshCw className="w-3 h-3 text-amber-600" />
                          <span>Sync</span>
                        </button>
                      )}
                    </td>

                    {/* Row Actions */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <DonationActionsMenu receiptNo={d.receiptNo} actions={[
                        { label: 'View receipt', icon: Eye, run: () => onSelectDonation(d) },
                        { label: 'Download PDF', icon: Download, run: () => downloadDonationPdf(d, settings) },
                        { label: 'Print receipt', icon: Printer, run: () => printDonationReceipt(d, settings) },
                        { label: 'Send on WhatsApp', icon: MessageCircle, run: () => onOpenWhatsApp(d) },
                        { label: 'Send email', icon: Mail, run: () => onOpenEmail(d) },
                        ...(d.googleSheetStatus !== 'synced' ? [{ label: 'Sync to Google Sheets', icon: RefreshCw, run: () => onSyncSingle(d.id) }] : []),
                        { label: 'Delete receipt', icon: Trash2, destructive: true, run: () => handleDelete(d.id, d.receiptNo) }
                      ]} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
          <span>
            Showing <strong className="text-slate-800">{filteredDonations.length}</strong> of{' '}
            <strong className="text-slate-800">{donations.length}</strong> total donations
          </span>
          <span className="font-mono font-bold text-slate-800">
            Total: {formatIndianCurrency(filteredDonations.reduce((sum, d) => sum + d.amount, 0))}
          </span>
        </div>
      </div>

    </div>
  );
};
