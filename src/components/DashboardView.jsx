import React from 'react';
import {
  Plus,
  Calendar,
  Users,
  FileText,
  Mail,
  MessageCircle,
  FileSpreadsheet,
  ShieldCheck,
  RotateCw,
  ChevronRight,
  Shield,
  Heart
} from 'lucide-react';

export const DashboardView = ({
  donations,
  settings,
  onOpenNewDonation,
  onSelectDonation,
  onNavigateTab
}) => {
  // Key figures
  const totalAmount = donations.reduce((sum, d) => sum + d.amount, 0);
  const totalCount = donations.length;
  const attentionCount = donations.filter((d) => d.googleSheetStatus !== 'synced' || ['failed', 'queued'].includes(d.emailStatus)).length;

  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const thisMonthDonations = donations.filter((d) => d.date.startsWith(currentMonthStr));
  const thisMonthAmount = thisMonthDonations.reduce((sum, d) => sum + d.amount, 0);

  // Unique donors count by name or phone
  const uniqueDonorsCount = new Set(donations.map((d) => (d.donorPhone || d.donorName).toLowerCase())).size;

  // Recent donations (top 5)
  const recentDonations = donations.slice(0, 5);

  const getInitials = (name) => {
    if (!name) return 'D';
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div className="kwf-dashboard space-y-7 pb-8">
      
      {/* Top Section: Title & Actions (Image 2) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-[0.16em] block">
            EVERY CONTRIBUTION COUNTS
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight mt-2">
            Donation overview
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            A clear picture of your impact, all in one place.
          </p>
        </div>

        <button
          onClick={onOpenNewDonation}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-bold shadow-sm transition-all active:scale-[0.99] self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New donation</span>
        </button>
      </div>

      {/* 4 KPI Metric Cards (Image 2) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Total contributions (Dark Navy Background! Image 2) */}
        <div className="kwf-stat kwf-stat-primary bg-[#0e2a47] text-white rounded-xl p-5 shadow-sm border border-slate-800 flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Total contributions</span>
            <div className="w-7 h-7 rounded-full bg-slate-800/80 flex items-center justify-center text-xs font-bold text-slate-300">
              ₹
            </div>
          </div>
          <div>
            <div className="font-heading tabular-nums text-2xl sm:text-3xl font-bold tracking-tight text-white mt-2">
              ₹{totalAmount.toFixed(2)}
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>{totalCount} donations recorded</span>
            </div>
          </div>
        </div>

        {/* Card 2: This month (Image 2) */}
        <div className="kwf-stat bg-white rounded-xl p-5 shadow-2xs border border-slate-200/90 flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>This month</span>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Calendar className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading tabular-nums text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              ₹{thisMonthAmount.toFixed(2)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {thisMonthDonations.length} contributions this month
            </div>
          </div>
        </div>

        {/* Card 3: Unique donors (Image 2) */}
        <div className="kwf-stat bg-white rounded-xl p-5 shadow-2xs border border-slate-200/90 flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Unique donors</span>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <Users className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading tabular-nums text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              {uniqueDonorsCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              People making a difference
            </div>
          </div>
        </div>

        {/* Card 4: Needs attention (Image 2) */}
        <div className="kwf-stat bg-white rounded-xl p-5 shadow-2xs border border-slate-200/90 flex flex-col justify-between min-h-[125px]">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>Needs attention</span>
            <div className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
              <FileText className="w-3.5 h-3.5" />
            </div>
          </div>
          <div>
            <div className="font-heading tabular-nums text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 mt-2">
              {attentionCount}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {attentionCount ? 'Sync or email confirmation pending' : 'No pending sync or email requests'}
            </div>
          </div>
        </div>

      </div>

      {/* Bottom Card: Recent donations (Image 2) */}
      <div className="kwf-panel bg-white rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
        
        {/* Table Header Row */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900">
              Recent donations
            </h3>
            <span className="px-1.5 py-0.5 text-[10px] font-mono font-bold rounded-md bg-slate-100 text-slate-600">
              {donations.length}
            </span>
          </div>

          <button
            onClick={() => onNavigateTab('donations')}
            className="text-xs font-semibold text-sky-700 hover:text-sky-900 hover:underline flex items-center gap-1"
          >
            <span>View all donations</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Donations Table (Image 2) */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/60 text-slate-400 font-semibold border-b border-slate-100 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-5">DONOR</th>
                <th className="py-3 px-5">RECEIPT NUMBER</th>
                <th className="py-3 px-5">AMOUNT</th>
                <th className="py-3 px-5">PAYMENT</th>
                <th className="py-3 px-5">DATE</th>
                <th className="py-3 px-5 text-right">RECEIPT</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentDonations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 text-xs">
                    No donations recorded yet. Click "+ New donation" to generate a receipt.
                  </td>
                </tr>
              ) : (
                recentDonations.map((d) => (
                  <tr
                    key={d.id}
                    onClick={() => onSelectDonation(d)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer group"
                  >
                    {/* Donor Column with Avatar */}
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs font-mono shrink-0">
                          {getInitials(d.donorName)}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">
                            {d.donorName}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {d.cause}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Receipt Number */}
                    <td className="py-3.5 px-5 font-mono text-slate-700 font-medium">
                      {d.receiptNo}
                    </td>

                    {/* Amount */}
                    <td className="py-3.5 px-5 font-bold font-mono text-slate-900">
                      ₹{d.amount.toFixed(2)}
                    </td>

                    {/* Payment Mode Pill */}
                    <td className="py-3.5 px-5">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                        {d.paymentMode}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="py-3.5 px-5 text-slate-600">
                      {d.date}
                    </td>

                    {/* Receipt Status & Chevron (Image 2) */}
                    <td className="py-3.5 px-5 text-right">
                      <div className="inline-flex items-center gap-1.5 text-emerald-700 font-semibold text-xs group-hover:text-sky-700">
                        <FileText className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Generated</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* Footer (Image 2) */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-4 border-t border-slate-200/80">
        <div className="flex items-center gap-1.5">
          <Heart className="w-3.5 h-3.5 text-slate-400" />
          <span>Every receipt is a reminder of someone's kindness.</span>
        </div>
        <span>Kulshrestha Welfare Foundation</span>
      </div>

    </div>
  );
};
