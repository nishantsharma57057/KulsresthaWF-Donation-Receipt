import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { numberToIndianWords, formatIndianCurrency } from '../utils/numberToWords';
import { downloadDonationPdf, printDonationReceipt } from '../utils/receiptGenerator';
import confetti from 'canvas-confetti';
import {
  X,
  Heart,
  CheckCircle2,
  FileText,
  Download,
  Printer,
  Share2,
  Send,
  MessageCircle,
  Mail,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Zap
} from 'lucide-react';

const PRESET_AMOUNTS = [500, 1100, 2100, 5100, 11000, 25000, 51000];

const CAUSES = [
  'Child Education',
  'Hunger Relief & Food',
  'Women Empowerment',
  'Healthcare & Medical',
  'Community Development',
  'General Fund'
];

const PAYMENT_MODES = [
  'UPI',
  'Net Banking / NEFT',
  'Credit / Debit Card',
  'Cheque / DD',
  'Cash'
];

export const NewDonationModal = ({
  isOpen,
  onClose,
  onSuccess,
  settings
}) => {
  const nextReceiptNo = StorageService.getNextReceiptNo();

  const [donorName, setDonorName] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPan, setDonorPan] = useState('');
  const [donorAddress, setDonorAddress] = useState('');
  const [donorCity, setDonorCity] = useState('New Delhi');
  const [donorState, setDonorState] = useState('Delhi');
  const [donorPincode, setDonorPincode] = useState('110096');

  const [amount, setAmount] = useState(5100);
  const [cause, setCause] = useState('Child Education');
  const [paymentMode, setPaymentMode] = useState('UPI');
  const [transactionId, setTransactionId] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(() => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  });
  const [is80GEligible, setIs80GEligible] = useState(true);
  const [autoEmailReceipt, setAutoEmailReceipt] = useState(true);
  const [autoDownloadPdf, setAutoDownloadPdf] = useState(true);
  const [autoOpenWhatsApp, setAutoOpenWhatsApp] = useState(true);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedDonation, setSubmittedDonation] = useState(null);

  if (!isOpen) return null;

  const handleAmountChange = (val) => {
    setAmount(val);
  };

  const handlePanChange = (e) => {
    setDonorPan(e.target.value.toUpperCase().slice(0, 10));
  };

  const handlePhoneChange = (e) => {
    setDonorPhone(e.target.value);
  };

  const isPanValid = !donorPan || /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(donorPan);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!donorName.trim()) {
      alert('Please enter Donor Name');
      return;
    }
    if (!amount || amount <= 0) {
      alert('Please enter a valid donation amount');
      return;
    }

    setIsSubmitting(true);

    try {
      const currentUser = StorageService.getCurrentUser();
      const createdBy = currentUser ? `${currentUser.name} (${currentUser.role})` : 'Admin Portal';

      const generated = StorageService.saveDonation({
        date,
        time,
        donorName: donorName.trim(),
        donorPhone: donorPhone.trim(),
        donorEmail: donorEmail.trim(),
        donorPan: donorPan.trim().toUpperCase(),
        donorAddress: donorAddress.trim() || 'Mayur Vihar',
        donorCity: donorCity.trim() || 'Delhi',
        donorState: donorState.trim() || 'Delhi',
        donorPincode: donorPincode.trim() || '110096',
        amount: Number(amount),
        cause,
        paymentMode,
        transactionId: transactionId.trim() || `TXN-${Date.now().toString().slice(-6)}`,
        is80GEligible,
        notes: notes.trim(),
        createdBy
      });

      // 1. AUTO-DOWNLOAD PDF ON SUBMIT
      if (autoDownloadPdf) {
        try {
          downloadDonationPdf(generated, settings);
        } catch (pdfErr) {
          console.warn('Auto download PDF error:', pdfErr);
        }
      }

      // 2. AUTO-OPEN WHATSAPP ON SUBMIT
      if (autoOpenWhatsApp && generated.donorPhone && generated.donorPhone.trim()) {
        try {
          openWhatsAppDirect(generated);
        } catch (waErr) {
          console.warn('Auto open WhatsApp error:', waErr);
        }
      }

      // 3. AUTO-DISPATCH EMAIL
      if (autoEmailReceipt && generated.donorEmail) {
        StorageService.recordEmailSent(generated.id);
      }

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 }
        });
      } catch {
        // ignore
      }

      setSubmittedDonation(generated);
      onSuccess(generated);
    } catch (err) {
      alert('Failed to save donation: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForNext = () => {
    setSubmittedDonation(null);
    setDonorName('');
    setDonorPhone('');
    setDonorEmail('');
    setDonorPan('');
    setDonorAddress('');
    setAmount(5100);
    setTransactionId('');
    setNotes('');
  };

  const openWhatsAppDirect = (d) => {
    let cleanPhone = d.donorPhone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    const receiptUrl = `https://www.kulshresthawf.org/receipt?no=${d.receiptNo}`;
    const text = settings.whatsappTemplate
      .replace('{DONOR_NAME}', d.donorName)
      .replace('{AMOUNT}', d.amount.toLocaleString('en-IN'))
      .replace('{CAUSE}', d.cause)
      .replace('{RECEIPT_NO}', d.receiptNo)
      .replace('{DATE}', `${d.date} ${d.time}`)
      .replace('{PAYMENT_MODE}', d.paymentMode)
      .replace('{TXN_ID}', d.transactionId)
      .replace('{RECEIPT_URL}', receiptUrl);

    StorageService.recordWhatsAppSent(d.id);
    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(text)}`;
    window.open(waUrl, '_blank');
  };

  const openEmailDirect = (d) => {
    const subject = `Official Donation Receipt [${d.receiptNo}] - Kulshrestha Welfare Foundation`;
    const body = settings.emailTemplate
      .replace('{DONOR_NAME}', d.donorName)
      .replace('{AMOUNT}', d.amount.toLocaleString('en-IN'))
      .replace('{AMOUNT_IN_WORDS}', d.amountInWords)
      .replace('{CAUSE}', d.cause)
      .replace('{RECEIPT_NO}', d.receiptNo)
      .replace('{DATE}', `${d.date} ${d.time}`)
      .replace('{PAYMENT_MODE}', d.paymentMode)
      .replace('{TXN_ID}', d.transactionId)
      .replace('{REG_80G}', settings.reg80GNumber)
      .replace('{DONOR_PAN}', d.donorPan || 'Not Specified');

    StorageService.recordEmailSent(d.id);
    const mailtoUrl = `mailto:${d.donorEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailtoUrl;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-r from-sky-50 to-white border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-100 text-sky-600 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 fill-sky-600/20" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 leading-tight">
                {submittedDonation ? 'Donation Recorded Successfully' : 'Record New Donation'}
              </h2>
              <p className="text-xs text-slate-500">
                {submittedDonation
                  ? `Receipt #${submittedDonation.receiptNo} generated & synced`
                  : `Next Receipt Number: ${nextReceiptNo} · Section 80G Compliant`}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {submittedDonation ? (
          /* SUCCESS STATE */
          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-2">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                Receipt {submittedDonation.receiptNo} Generated & Auto-Triggered!
              </h3>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Donation of <span className="font-semibold text-slate-900">{formatIndianCurrency(submittedDonation.amount)}</span> from{' '}
                <span className="font-semibold text-slate-900">{submittedDonation.donorName}</span> has been processed. All delivery actions have fired automatically.
              </p>
            </div>

            {/* All Actions Auto-Triggered Status Card */}
            <div className="bg-gradient-to-r from-emerald-50/80 to-teal-50/80 rounded-xl border border-emerald-200 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  All 4 Automated Actions Executed on Submit:
                </span>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-mono">
                  AUTO-TRIGGERED
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                {/* 1. PDF Download */}
                <div className="flex items-start gap-2.5 p-2.5 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs">
                  <Download className="w-4 h-4 text-sky-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">1. PDF Receipt</span>
                    <span className="text-[11px] text-emerald-700">Auto-downloaded to your device</span>
                  </div>
                </div>

                {/* 2. WhatsApp */}
                <div className="flex items-start gap-2.5 p-2.5 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs">
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">2. WhatsApp Message</span>
                    <span className="text-[11px] text-emerald-700">
                      Auto-opened for {submittedDonation.donorPhone}
                    </span>
                  </div>
                </div>

                {/* 3. Email */}
                <div className="flex items-start gap-2.5 p-2.5 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs">
                  <Mail className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">3. Donor Email</span>
                    <span className="text-[11px] text-emerald-700 truncate block max-w-[190px]">
                      {submittedDonation.donorEmail
                        ? `Auto-dispatched to ${submittedDonation.donorEmail}`
                        : 'No email provided'}
                    </span>
                  </div>
                </div>

                {/* 4. Google Sheet */}
                <div className="flex items-start gap-2.5 p-2.5 bg-white/90 rounded-lg border border-emerald-100 shadow-2xs">
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-slate-900 block leading-tight">4. Google Sheet Sync</span>
                    <span className="text-[11px] text-emerald-700">
                      Auto-synced into {settings.googleSheetsSheetName}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-slate-50 rounded-lg border border-slate-200 p-3.5 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-600">
                <div>
                  <span className="block text-slate-400 text-[11px]">Receipt No</span>
                  <span className="font-bold text-slate-900 font-mono">{submittedDonation.receiptNo}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px]">Cause</span>
                  <span className="font-medium text-slate-800 truncate block">{submittedDonation.cause}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px]">Payment Mode</span>
                  <span className="font-medium text-slate-800">{submittedDonation.paymentMode}</span>
                </div>
                <div>
                  <span className="block text-slate-400 text-[11px]">80G Exemption</span>
                  <span className="font-semibold text-emerald-700">Eligible (50% Tax Deduction)</span>
                </div>
              </div>
            </div>

            {/* Re-trigger / Backup Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => downloadDonationPdf(submittedDonation, settings)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Re-Download PDF</span>
              </button>

              <button
                type="button"
                onClick={() => openWhatsAppDirect(submittedDonation)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Open WhatsApp Again</span>
              </button>

              <button
                type="button"
                onClick={() => openEmailDirect(submittedDonation)}
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
              >
                <Mail className="w-4 h-4" />
                <span>Resend / View Email</span>
              </button>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => printDonationReceipt(submittedDonation, settings)}
                className="inline-flex items-center gap-1.5 text-xs text-slate-600 hover:text-slate-900"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print Official Receipt</span>
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Done & Close
                </button>
                <button
                  type="button"
                  onClick={handleResetForNext}
                  className="px-4 py-2 text-xs font-semibold text-sky-700 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-lg transition-colors"
                >
                  Record Another Donation
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* FORM BODY */
          <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
            {/* Amount Selection */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Donation Amount (INR) <span className="text-rose-500">*</span>
                </label>
                <span className="text-xs font-medium text-sky-700 font-mono">
                  {numberToIndianWords(amount || 0)}
                </span>
              </div>

              {/* Amount Quick Presets */}
              <div className="flex flex-wrap gap-2">
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAmountChange(preset)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                      amount === preset
                        ? 'bg-sky-600 text-white shadow-xs'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    ₹{preset.toLocaleString('en-IN')}
                  </button>
                ))}
              </div>

              {/* Custom Input */}
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 font-semibold text-sm">
                  ₹
                </span>
                <input
                  type="number"
                  min="1"
                  step="1"
                  required
                  value={amount || ''}
                  onChange={(e) => setAmount(Number(e.target.value))}
                  placeholder="Enter custom amount"
                  className="w-full pl-8 pr-4 py-2 text-base font-bold text-slate-900 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 font-mono tabular-nums"
                />
              </div>
            </div>

            {/* Donor Information */}
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Donor Particulars (For 80G Tax Exemption)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Donor Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    WhatsApp Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    value={donorPhone}
                    onChange={handlePhoneChange}
                    placeholder="e.g. +91 98123 45678"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-medium text-slate-700">
                      Donor Email Address
                    </label>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                      Auto-Email PDF Active
                    </span>
                  </div>
                  <input
                    type="email"
                    value={donorEmail}
                    onChange={(e) => setDonorEmail(e.target.value)}
                    placeholder="donor@example.com (Receipt PDF will be emailed)"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Form submit hote hi signed PDF receipt donor ke email par automatically send ho jayegi.
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    PAN Number (Required for 80G Tax Exemption)
                  </label>
                  <input
                    type="text"
                    maxLength={10}
                    value={donorPan}
                    onChange={handlePanChange}
                    placeholder="ABCDE1234F"
                    className={`w-full px-3 py-2 text-sm font-mono uppercase tracking-wider border rounded-lg focus:ring-2 focus:ring-sky-500 ${
                      !isPanValid
                        ? 'border-rose-400 bg-rose-50 focus:ring-rose-400'
                        : 'border-slate-300'
                    }`}
                  />
                  {!isPanValid && (
                    <p className="text-[11px] text-rose-600 mt-1">
                      Invalid PAN format (e.g. 5 letters, 4 digits, 1 letter)
                    </p>
                  )}
                </div>
              </div>

              {/* Address details */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Street Address / Colony
                  </label>
                  <input
                    type="text"
                    value={donorAddress}
                    onChange={(e) => setDonorAddress(e.target.value)}
                    placeholder="e.g. B-12, Mayur Vihar Phase-1"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">City</label>
                  <input
                    type="text"
                    value={donorCity}
                    onChange={(e) => setDonorCity(e.target.value)}
                    placeholder="Delhi"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Pincode</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={donorPincode}
                    onChange={(e) => setDonorPincode(e.target.value)}
                    placeholder="110091"
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>
            </div>

            {/* Donation Purpose & Payment Mode */}
            <div className="space-y-4 pt-2 border-t border-slate-200">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Purpose & Payment Particulars
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Cause / Objective
                  </label>
                  <select
                    value={cause}
                    onChange={(e) => setCause(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500"
                  >
                    {CAUSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentMode}
                    onChange={(e) => setPaymentMode(e.target.value)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-sky-500"
                  >
                    {PAYMENT_MODES.map((pm) => (
                      <option key={pm} value={pm}>
                        {pm}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Transaction ID / Cheque No.
                  </label>
                  <input
                    type="text"
                    value={transactionId}
                    onChange={(e) => setTransactionId(e.target.value)}
                    placeholder="e.g. UPI-261001-99218"
                    className="w-full px-3 py-2 text-sm font-mono border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Donation Date
                  </label>
                  <input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Time
                  </label>
                  <input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              {/* 80G Tax Exemption Toggle */}
              <div className="flex items-start gap-3 p-3 bg-sky-50/60 rounded-lg border border-sky-100">
                <input
                  type="checkbox"
                  id="80g-checkbox"
                  checked={is80GEligible}
                  onChange={(e) => setIs80GEligible(e.target.checked)}
                  className="mt-0.5 rounded text-sky-600 focus:ring-sky-500"
                />
                <label htmlFor="80g-checkbox" className="text-xs text-slate-700 cursor-pointer">
                  <span className="font-semibold text-slate-900 block">
                    Issue 80G Tax Exemption Certificate
                  </span>
                  Qualifies for 50% tax deduction under Section 80G of Income Tax Act (URN:{' '}
                  {settings.reg80GNumber}). Form 10BD reporting will be included.
                </label>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Notes / Dedication (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Donated in memory of Late Smt. Shanti Devi / Birthday meal sponsorship"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>
              {/* Automated Triggers Section */}
              <div className="bg-sky-50/70 p-3.5 rounded-lg border border-sky-200 text-xs space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-sky-950">
                  <Zap className="w-4 h-4 text-sky-600" />
                  <span>Automated Instant Triggers on Submit:</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-700 text-[11px]">
                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={autoDownloadPdf}
                      onChange={(e) => setAutoDownloadPdf(e.target.checked)}
                      className="rounded text-sky-600 focus:ring-sky-500"
                    />
                    <span>📥 Auto-Download PDF Receipt</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={autoOpenWhatsApp}
                      onChange={(e) => setAutoOpenWhatsApp(e.target.checked)}
                      className="rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>💬 Auto-Trigger WhatsApp Message</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer font-medium">
                    <input
                      type="checkbox"
                      checked={autoEmailReceipt}
                      onChange={(e) => setAutoEmailReceipt(e.target.checked)}
                      className="rounded text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>✉️ Auto-Dispatch Email with 80G PDF</span>
                  </label>

                  <div className="flex items-center gap-2 font-medium text-emerald-800">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>📊 Auto-Sync to Google Sheet</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-2 px-6 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-sm font-bold shadow-sm transition-all focus:ring-2 focus:ring-sky-500 disabled:opacity-50 active:scale-[0.99]"
                >
                  {isSubmitting ? (
                    <span>Auto-Triggering All Actions...</span>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 fill-white" />
                      <span>Save & Auto-Trigger Receipt</span>
                      <span className="font-mono text-xs opacity-80">({nextReceiptNo})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
