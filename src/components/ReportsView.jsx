import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { formatIndianCurrency } from '../utils/numberToWords';
import {
  FileSpreadsheet,
  Download,
  ShieldCheck,
  Award,
  Calendar,
  CreditCard,
  PieChart,
  BarChart2,
  FileCheck
} from 'lucide-react';

export const ReportsView = ({
  donations,
  settings,
  onSelectDonation
}) => {
  const [selectedFy, setSelectedFy] = useState(settings.financialYear);

  // Total eligible for 80G
  const eligible80G = donations.filter((d) => d.is80GEligible);
  const total80GAmount = eligible80G.reduce((sum, d) => sum + d.amount, 0);

  // Payment mode summary
  const paymentModeMap = {};
  donations.forEach((d) => {
    paymentModeMap[d.paymentMode] = (paymentModeMap[d.paymentMode] || 0) + d.amount;
  });

  // Top Donors (Ranked by Total Contribution)
  const donorAggMap = {};
  donations.forEach((d) => {
    const key = d.donorPan || d.donorPhone || d.donorName;
    if (!donorAggMap[key]) {
      donorAggMap[key] = {
        name: d.donorName,
        phone: d.donorPhone,
        pan: d.donorPan,
        total: 0,
        count: 0
      };
    }
    donorAggMap[key].total += d.amount;
    donorAggMap[key].count += 1;
  });

  const topDonors = Object.values(donorAggMap)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200">
        <div>
          <div className="flex items-center gap-2 text-xs text-sky-700 font-semibold mb-1">
            <span>Income Tax Compliance</span>
            <span aria-hidden="true">·</span>
            <span>Section 80G(5)(vi)</span>
            <span aria-hidden="true">·</span>
            <span>Form 10BD</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900">
            80G Tax Exemption & Financial Reports
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit-ready statement generation for CBDT quarterly / annual compliance, donor certificates, and ledger analysis.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => StorageService.exportForm10BDReport()}
            className="inline-flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Form 10BD (CSV)</span>
          </button>
        </div>
      </div>

      {/* 80G Highlights Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 mb-1">80G Eligible Donations</div>
          <div className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
            {formatIndianCurrency(total80GAmount)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {eligible80G.length} of {donations.length} total receipts qualify
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 mb-1">Unique Registration No (URN)</div>
          <div className="text-lg font-bold text-sky-700 font-mono tracking-wide">
            {settings.reg80GNumber}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Order Date: 15/05/2023 · Income Tax Department
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="text-xs text-slate-500 mb-1">PAN Validation Status</div>
          <div className="text-lg font-bold text-emerald-600 font-mono">
            {donations.filter((d) => d.donorPan).length} Valid PAN Records
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            Mandatory for CBDT Form 10BD generation
          </div>
        </div>
      </div>

      {/* Form 10BD Statement Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-2xs">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <FileCheck className="w-4 h-4 text-sky-600" />
            <h3 className="text-sm font-bold text-slate-900">
              Form 10BD Donor Statement (CBDT Prescribed Format)
            </h3>
          </div>
          <span className="text-[11px] text-slate-500">
            Rule 18AB of Income-tax Rules, 1962
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Sl</th>
                <th className="py-3 px-4">Donor Name</th>
                <th className="py-3 px-4 font-mono">Donor PAN</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Section Code</th>
                <th className="py-3 px-4">Donation Type</th>
                <th className="py-3 px-4">Mode</th>
                <th className="py-3 px-4 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {eligible80G.map((d, index) => (
                <tr key={d.id} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-4 text-slate-400 font-mono">{index + 1}</td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900 truncate max-w-[150px]">
                    {d.donorName}
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-slate-800">
                    {d.donorPan || 'PENDING'}
                  </td>
                  <td className="py-2.5 px-4 text-slate-600 truncate max-w-[180px]">
                    {d.donorAddress}, {d.donorCity}
                  </td>
                  <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                    Section 80G(5)(vi)
                  </td>
                  <td className="py-2.5 px-4 text-slate-600">Specific Grant</td>
                  <td className="py-2.5 px-4 text-slate-600">{d.paymentMode}</td>
                  <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                    ₹{d.amount.toLocaleString('en-IN')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
          <span>Ready for e-filing through the Income Tax Portal (Form 10BD JSON/CSV utility)</span>
          <span className="font-mono font-bold text-slate-800">
            Total 80G Deductible: {formatIndianCurrency(total80GAmount)}
          </span>
        </div>
      </div>

      {/* Secondary Grid: Top Donors + Payment Modes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Top Donors Leaderboard */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Top Donors & Benefactors</h3>
            <Award className="w-4 h-4 text-amber-500" />
          </div>

          <div className="space-y-3">
            {topDonors.map((donor, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs font-mono">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="font-bold text-slate-900">{donor.name}</p>
                    <p className="text-[11px] text-slate-500">{donor.phone} · PAN: {donor.pan || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-mono font-bold text-slate-900 text-sm">
                    {formatIndianCurrency(donor.total)}
                  </p>
                  <p className="text-[10px] text-slate-400">{donor.count} Contribution(s)</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Payment Modes Breakdown */}
        <div className="bg-white p-5 rounded-xl border border-slate-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900">Payment Modes & Channels</h3>
            <CreditCard className="w-4 h-4 text-sky-600" />
          </div>

          <div className="space-y-3">
            {Object.entries(paymentModeMap).map(([mode, amt]) => {
              const totalAmt = donations.reduce((s, d) => s + d.amount, 0);
              const pct = totalAmt > 0 ? Math.round((amt / totalAmt) * 100) : 0;
              return (
                <div key={mode} className="text-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-700">
                    <span className="font-semibold">{mode}</span>
                    <span className="font-mono font-bold text-slate-900">{formatIndianCurrency(amt)}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>{pct}% of total</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-sky-600 h-1.5 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
};
