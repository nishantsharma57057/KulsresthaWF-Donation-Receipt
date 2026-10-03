import React from 'react';
import { Logo } from './Logo.jsx';
import { downloadDonationPdf } from '../utils/receiptGenerator';
import {
  X,
  Download,
  Mail,
  MessageCircle,
  FileSpreadsheet,
  RotateCw,
  AlertCircle,
  Heart
} from 'lucide-react';

export const ReceiptViewModal = ({
  donation,
  onClose,
  settings,
  onOpenWhatsApp,
  onOpenEmail
}) => {
  if (!donation) return null;

  const handleDownload = () => {
    downloadDonationPdf(donation, settings);
  };

  const emailStatusLabel = donation.emailStatus === 'sent' ? '• Sent' : '• Setup required';
  const waStatusLabel = donation.whatsappStatus === 'sent' ? '• Sent' : '• Setup required';
  const sheetStatusLabel = donation.googleSheetStatus === 'synced' ? '• Synced' : '• Setup required';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6 no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h3 className="text-base font-bold text-slate-900 leading-tight">
              Donation receipt
            </h3>
            <p className="text-xs font-mono text-slate-500 mt-0.5">
              {donation.receiptNo}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Left Column: Exact Visual PDF Reflection Card */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm flex flex-col justify-between text-xs">
            
            <div className="p-6 space-y-4">
              {/* 1. Header with Logo & Online Donation Receipt */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Logo size="sm" />
                  <span className="text-[9px] font-bold text-[#0e5f76] tracking-wider uppercase block mt-1.5">
                    CARE  •  DIGNITY  •  OPPORTUNITY  •  IMPACT
                  </span>
                </div>

                <div className="text-right shrink-0">
                  <span className="text-[10px] font-bold text-[#0e5f76] uppercase tracking-wider block">
                    ONLINE DONATION RECEIPT
                  </span>
                  <div className="mt-1 space-y-0.5 text-[11px]">
                    <div>
                      <span className="text-slate-400">Receipt No. </span>
                      <span className="font-bold text-slate-900 font-mono">{donation.receiptNo}</span>
                    </div>
                    <div>
                      <span className="text-slate-400">Issue Date </span>
                      <span className="font-bold text-slate-900">{donation.date}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2. Title & Status Badge */}
              <div className="pt-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-bold text-[#0e5f76] tracking-tight uppercase">
                    DONATION RECEIPT
                  </h4>
                  <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[11px]">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>SUCCESSFUL</span>
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Thank you for your generous support.
                </p>
                <div className="border-b border-slate-200 mt-3" />
              </div>

              {/* 3. Featured Cards: Received From & Amount */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Received From */}
                <div className="border-l-2 border-sky-600 pl-3 space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    RECEIVED FROM
                  </span>
                  <div className="text-base font-bold text-slate-900">
                    {donation.donorName}
                  </div>
                  <div className="text-[11px] text-slate-500">{donation.donorEmail || 'donor@example.com'}</div>
                  <div className="text-[11px] text-slate-500">{donation.donorPhone}</div>
                </div>

                {/* Donation Amount Card */}
                <div className="p-3.5 bg-slate-50/70 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                    DONATION AMOUNT
                  </span>
                  <div className="text-2xl font-bold text-[#0e5f76] font-mono mt-0.5">
                    ₹ {donation.amount.toLocaleString('en-IN')}
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">
                    {donation.amountInWords}
                  </div>
                </div>
              </div>

              {/* 4. Donor Details & Payment Details */}
              <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-4 text-xs">
                {/* Donor Details */}
                <div>
                  <span className="font-bold text-[#0e5f76] text-[11px] uppercase tracking-wider block mb-2">
                    DONOR DETAILS
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Name</span>
                      <span className="font-bold text-slate-900">{donation.donorName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Mobile</span>
                      <span className="font-bold text-slate-900">{donation.donorPhone}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Address</span>
                      <span className="text-slate-700">
                        {donation.donorAddress}, {donation.donorCity}, {donation.donorState} - {donation.donorPincode}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                <div>
                  <span className="font-bold text-[#0e5f76] text-[11px] uppercase tracking-wider block mb-2">
                    PAYMENT DETAILS
                  </span>
                  <div className="space-y-1.5 text-[11px]">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Transaction ID</span>
                      <span className="font-bold text-slate-900 font-mono">{donation.transactionId}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Method</span>
                      <span className="font-bold text-slate-900">{donation.paymentMode}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Purpose</span>
                      <span className="font-bold text-slate-900">{donation.cause}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. Callout Banner: YOUR SUPPORT CREATES REAL CHANGE */}
              <div className="p-3 bg-sky-50/80 rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="font-bold text-[#0e5f76] text-[11px] block">
                    YOUR SUPPORT CREATES REAL CHANGE
                  </span>
                  <p className="text-[10px] text-slate-600 mt-0.5">
                    Every contribution helps us extend care, opportunity and dignity to more people.
                  </p>
                </div>
                <Heart className="w-5 h-5 text-sky-500 fill-sky-500 shrink-0" />
              </div>

              {/* 6. Foundation & Tax Details Card */}
              <div className="p-3 bg-white rounded-xl border border-slate-200 grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="font-bold text-[#0e5f76] text-[10px] uppercase tracking-wider block mb-1">
                    FOUNDATION / TAX DETAILS
                  </span>
                  <div className="space-y-0.5 text-[10px] text-slate-600">
                    <div>NGO PAN: <span className="font-bold text-slate-900">{settings.pan}</span></div>
                    <div>80G Reg. No.: <span className="font-bold text-slate-900">{settings.reg80GNumber}</span></div>
                    <div>12A Reg. No.: <span className="font-bold text-slate-900">{settings.reg12ANumber}</span></div>
                  </div>
                </div>

                <div className="border-l border-slate-100 pl-3">
                  <span className="font-bold text-[#0e5f76] text-[10px] uppercase tracking-wider block mb-1">
                    REGISTERED OFFICE
                  </span>
                  <p className="text-[10px] text-slate-600 leading-tight">
                    {settings.orgName}, {settings.address}, {settings.city}
                  </p>
                  <span className="text-[10px] text-sky-700 font-bold block mt-1">
                    {settings.website}
                  </span>
                </div>
              </div>

              {/* 7. Computer Generated Receipt & Signatory */}
              <div className="flex items-end justify-between pt-2 text-[10px]">
                <div>
                  <span className="font-bold text-[#0e5f76] uppercase tracking-wider block">
                    COMPUTER GENERATED RECEIPT
                  </span>
                  <p className="text-slate-400 text-[9px] max-w-[240px]">
                    This receipt is generated electronically from the online donation record and does not require a physical signature.
                  </p>
                  <span className="font-bold text-slate-800 block mt-1">
                    Thank you for helping us build a brighter tomorrow.
                  </span>
                </div>

                <div className="text-right">
                  <div className="w-32 border-b border-slate-400 mb-1" />
                  <span className="font-bold text-slate-800 text-[10px] block">Authorized Signatory</span>
                  <span className="text-slate-400 text-[9px]">{settings.orgName}</span>
                </div>
              </div>

            </div>

            {/* 8. Bottom Teal Bar */}
            <div className="bg-[#0e5f76] text-white py-2 px-6 flex items-center justify-between text-[10px] font-bold tracking-wider">
              <span>PEOPLE  •  CARE  •  OPPORTUNITIES  •  BRIGHTER TOMORROWS</span>
              <span>{donation.receiptNo}</span>
            </div>

          </div>

          {/* Right Column: Receipt Ready & Delivery Status */}
          <div className="lg:col-span-5 space-y-6">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                Receipt ready
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Download the exact official receipt PDF or check dispatch status below.
              </p>

              {/* Download PDF Button */}
              <button
                type="button"
                onClick={handleDownload}
                className="w-full mt-4 py-3 px-4 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-lg text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all active:scale-[0.99]"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF</span>
              </button>
            </div>

            {/* Delivery Status Section */}
            <div className="space-y-3 pt-2">
              <h5 className="text-xs font-bold text-slate-900">
                Delivery status
              </h5>

              <div className="space-y-2 text-xs">
                {/* Email receipt */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Mail className="w-4 h-4 text-slate-400" />
                    <span>Email receipt</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-slate-500">
                      {emailStatusLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenEmail(donation)}
                      className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-semibold"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>

                {/* WhatsApp receipt */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-slate-700">
                    <MessageCircle className="w-4 h-4 text-slate-400" />
                    <span>WhatsApp receipt</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-slate-500">
                      {waStatusLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenWhatsApp(donation)}
                      className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-semibold"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>

                {/* Google Sheets */}
                <div className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 bg-slate-50/50">
                  <div className="flex items-center gap-2 text-slate-700">
                    <FileSpreadsheet className="w-4 h-4 text-slate-400" />
                    <span>Google Sheets</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-medium text-slate-500">
                      {sheetStatusLabel}
                    </span>
                    <button
                      type="button"
                      onClick={() => onOpenEmail(donation)}
                      className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-900 font-semibold"
                    >
                      <RotateCw className="w-3 h-3" />
                      <span>Retry</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Exclamation Notice Box */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-start gap-2 text-xs text-slate-500">
                <AlertCircle className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <p className="text-[11px] leading-relaxed">
                  "Accepted" means the provider received the request. It does not confirm delivery to the donor.
                </p>
              </div>
            </div>

            {/* Internal Notes */}
            <div className="pt-2">
              <h5 className="text-xs font-bold text-slate-900 mb-1">
                Internal notes
              </h5>
              <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-lg border border-slate-200 leading-relaxed">
                {donation.notes ||
                  'Excepteur dolore praesentium consequuntur quaerat tempore id pariatur Repudiandae esse Nam consequatur id ullamco commodi ea'}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
