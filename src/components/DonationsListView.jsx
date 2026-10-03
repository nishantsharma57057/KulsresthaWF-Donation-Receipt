import React, { useState, useMemo } from 'react';
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
  X
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
          d.receiptNo.toLowerCase().includes(query) ||
          d.donorName.toLowerCase().includes(query) ||
          d.donorPhone.toLowerCase().includes(query) ||
          d.donorEmail.toLowerCase().includes(query) ||
          d.donorPan.toLowerCase().includes(query) ||
          d.transactionId.toLowerCase().includes(query) ||
          d.donorCity.toLowerCase().includes(query);
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
    <div className="space-y-5 pb-12">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Donations Ledger & Records</h1>
          <p className="text-xs text-slate-500">
            {donations.length} total recorded receipts · Searchable database with direct PDF download & dispatch
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

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          {/* Search Input */}
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by receipt #, donor name, phone, PAN, transaction ID..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Cause Dropdown */}
          <div>
            <select
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

        {/* Secondary Filters: Sheet Status & 80G Status */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-500 font-medium">Quick Filters:</span>

            {/* Sheet Sync Toggle Buttons */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setSheetFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  sheetFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Sync
              </button>
              <button
                onClick={() => setSheetFilter('synced')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  sheetFilter === 'synced' ? 'bg-white text-emerald-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sheet Synced
              </button>
              <button
                onClick={() => setSheetFilter('pending')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  sheetFilter === 'pending' ? 'bg-white text-amber-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Pending Sync
              </button>
            </div>

            {/* 80G Filter Toggle Buttons */}
            <div className="inline-flex rounded-lg bg-slate-100 p-0.5 border border-slate-200">
              <button
                onClick={() => setTaxFilter('all')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  taxFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All 80G
              </button>
              <button
                onClick={() => setTaxFilter('80g')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  taxFilter === '80g' ? 'bg-white text-sky-700 shadow-2xs font-semibold' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                80G Eligible
              </button>
            </div>
          </div>

          {isFiltered && (
            <button
              onClick={clearFilters}
              className="text-xs text-rose-600 hover:text-rose-700 font-semibold"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
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
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => downloadDonationPdf(d, settings)}
                          title="Download PDF Receipt"
                          className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenWhatsApp(d)}
                          title="Send on WhatsApp"
                          className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 rounded-md transition-colors"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onOpenEmail(d)}
                          title="Send Email"
                          className="p-1.5 text-sky-600 hover:text-sky-700 hover:bg-sky-50 rounded-md transition-colors"
                        >
                          <Mail className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onSelectDonation(d)}
                          title="View Official Receipt"
                          className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(d.id, d.receiptNo)}
                          title="Delete Receipt"
                          className="p-1.5 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer Summary */}
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500">
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
