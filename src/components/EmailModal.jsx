import React, { useState, useMemo } from 'react';
import { buildDonationEmail } from '../utils/emailTemplate';
import { StorageService } from '../services/storage';
import { X, Mail, Send, CheckCircle2, Clock, Copy, Check } from 'lucide-react';

export const EmailModal = props => props.donation ? <EmailComposer key={props.donation.id} {...props} /> : null;

const EmailComposer = ({
  donation,
  settings,
  onClose,
  onSent
}) => {

  const [email, setEmail] = useState(donation.donorEmail || '');
  const initial = buildDonationEmail(donation, settings);
  const [subject, setSubject] = useState(initial.subject);
  const [copied, setCopied] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);
  const [sendError, setSendError] = useState(null);
  const mailinatorRecipient = /@(?:[a-z0-9-]+\.)*mailinator\.com$/i.test(email.trim());

  const [body, setBody] = useState(initial.message);
  const emailContent = useMemo(() => buildDonationEmail(donation, settings, body), [donation, settings, body]);

  const handleCopy = () => {
    navigator.clipboard.writeText(emailContent.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendInstant = async () => {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      alert('Please specify recipient email');
      return;
    }

    if (isSending) return;
    setSendError(null);
    setIsSending(true);

    try {
      const result = await StorageService.sendReceiptEmail(donation.id, email.trim(), subject, body, false);
      if (!result.success) throw new Error(result.message || 'Email request failed.');
      onSent(donation.id);
      setIsSending(false);
      setSentSuccess(true);

    } catch (error) {
      setIsSending(false);
      setSendError(error.message || 'Failed to trigger email webhook.');
    }
  };

  const handleOpenClient = () => {
    const mailto = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailContent.text)}`;
    window.location.href = mailto;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-sky-50 border-b border-sky-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-sky-600 text-white flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Send Donation Receipt
              </h3>
              <p className="text-xs text-slate-500">
                Receipt-style email with your official PDF attachment
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
          {sendError && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-rose-700">{sendError}</p>}
          {mailinatorRecipient && <p className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-900">Mailinator public inboxes may reject PDF emails or remove attachments. Use a private recipient address to test the receipt.</p>}
          {sentSuccess ? (
            <div className="p-8 text-center space-y-3">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <p className="text-base font-bold text-slate-900">
                Email request submitted
              </p>
              <p className="text-slate-500">
                Receipt #{donation.receiptNo} was requested for {email}. Delivery is handled by the email service.
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
                    <span className="text-amber-700 font-medium">{donation.emailStatus === 'queued' ? 'Request submitted' : donation.emailStatus === 'failed' ? 'Previous request failed' : 'Not requested'}</span>
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
                    Personal message
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
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="border-b border-slate-200 bg-slate-50 px-4 py-3"><h4 className="text-xs font-semibold text-slate-700">Email design preview</h4><p className="mt-1 text-[11px] text-slate-500">Logo, donation details and authorized signatory match your receipt.</p></div>
                <iframe title="Donation email preview" sandbox="" srcDoc={emailContent.previewHtml} className="block h-[560px] w-full border-0 bg-slate-50" />
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
