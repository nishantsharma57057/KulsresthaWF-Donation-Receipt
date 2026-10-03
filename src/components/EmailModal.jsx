import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { X, Mail, Send, CheckCircle2, Clock, Copy, Check } from 'lucide-react';

export const EmailModal = ({
  donation,
  settings,
  onClose,
  onSent
}) => {
  if (!donation) return null;

  const [email, setEmail] = useState(donation.donorEmail || '');
  const [subject, setSubject] = useState(
    `Official Donation Receipt [${donation.receiptNo}] - ${settings.orgName}`
  );
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const defaultBody = settings.emailTemplate
    .replace('{DONOR_NAME}', donation.donorName)
    .replace('{AMOUNT}', donation.amount.toLocaleString('en-IN'))
    .replace('{AMOUNT_IN_WORDS}', donation.amountInWords)
    .replace('{CAUSE}', donation.cause)
    .replace('{RECEIPT_NO}', donation.receiptNo)
    .replace('{DATE}', `${donation.date} ${donation.time}`)
    .replace('{PAYMENT_MODE}', donation.paymentMode)
    .replace('{TXN_ID}', donation.transactionId)
    .replace('{REG_80G}', settings.reg80GNumber)
    .replace('{DONOR_PAN}', donation.donorPan || 'Not Specified');

  const [body, setBody] = useState(defaultBody);

  const handleCopy = () => {
    navigator.clipboard.writeText(body);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInstant = async () => {
    if (!email) {
      alert('Please specify recipient email');
      return;
    }

    setIsSending(true);

    try {
      await StorageService.sendReceiptEmail(donation.id, email, subject, body);
      onSent(donation.id);
      setIsSending(false);
      setSentSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch {
      setIsSending(false);
      alert('Failed to trigger email webhook.');
    }
  };

  const handleOpenClient = () => {
    StorageService.recordEmailSent(donation.id);
    onSent(donation.id);
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.location.href = mailto;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-sky-50 border-b border-sky-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Send 80G Receipt via Email
              </h3>
              <p className="text-xs text-slate-500">
                Sends receipt particulars and tax deduction certificate to donor
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 text-xs">
          {sentSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-slate-900">
                Email Dispatched Successfully!
              </p>
              <p className="text-slate-500">
                Receipt #{donation.receiptNo} has been delivered to {email}.
              </p>
            </div>
          ) : (
            <>
              {/* Status info */}
              <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
                <div>
                  <span className="font-semibold text-slate-800">Donor: </span>
                  {donation.donorName}
                </div>
                <div>
                  <span className="font-semibold text-slate-800">Status: </span>
                  {donation.emailStatus === 'sent' ? (
                    <span className="text-emerald-700 font-medium">
                      Sent on {donation.emailSentAt?.slice(0, 16).replace('T', ' ')}
                    </span>
                  ) : (
                    <span className="text-amber-700 font-medium">Pending Delivery</span>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Email Address
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="donor@example.com"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Subject Line
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 font-medium"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Message Body
                  </label>
                  <button
                    type="button"
                    onClick={handleCopy}
                    className="inline-flex items-center gap-1 text-[11px] text-sky-700 hover:text-sky-800 font-medium"
                  >
                    {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    {copied ? 'Copied' : 'Copy Body'}
                  </button>
                </div>
                <textarea
                  rows={7}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 leading-relaxed font-mono"
                />
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        {!sentSuccess && (
          <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200">
            <button
              type="button"
              onClick={handleOpenClient}
              className="px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-lg transition-colors"
            >
              Open in Outlook / Mail Client
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-xs font-medium text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSendInstant}
                disabled={isSending}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 hover:bg-sky-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Sending Email...' : 'Send Receipt Email'}</span>
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
