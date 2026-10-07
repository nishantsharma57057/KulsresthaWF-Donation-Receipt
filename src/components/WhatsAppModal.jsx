import { getReceiptShareUrl } from '../utils/receiptShare';
import React, { useState } from 'react';
import { StorageService } from '../services/storage';
import { X, MessageCircle, Send, Copy, Check, ExternalLink, Clock } from 'lucide-react';

export const WhatsAppModal = props => props.donation ? <WhatsAppComposer key={props.donation.id} {...props} /> : null;

const WhatsAppComposer = ({
  donation,
  settings,
  onClose,
  onSent
}) => {

  const [phone, setPhone] = useState(donation.donorPhone);
  const [copied, setCopied] = useState(false);

  const receiptUrl = getReceiptShareUrl(donation);

  const defaultMessage = settings.whatsappTemplate
    .replace('{DONOR_NAME}', donation.donorName)
    .replace('{AMOUNT}', donation.amount.toLocaleString('en-IN'))
    .replace('{CAUSE}', donation.cause)
    .replace('{RECEIPT_NO}', donation.receiptNo)
    .replace('{DATE}', `${donation.date} ${donation.time}`)
    .replace('{PAYMENT_MODE}', donation.paymentMode)
    .replace('{TXN_ID}', donation.transactionId)
    .replace('{RECEIPT_URL}', receiptUrl);

  const [message, setMessage] = useState(defaultMessage);

  const handleCopy = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSend = () => {
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.length === 10) {
      cleanPhone = '91' + cleanPhone;
    }

    StorageService.recordWhatsAppSent(donation.id);
    onSent(donation.id);

    const waUrl = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
    window.open(waUrl, '_blank');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-emerald-50 border-b border-emerald-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-600 text-white flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Send Receipt via WhatsApp
              </h3>
              <p className="text-xs text-slate-500">
                Send the donor a receipt link with PDF download
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

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-emerald-900">Sender account: {settings.whatsappSenderNumber || '8826961430'}. Log in to this number in WhatsApp before sending; the portal cannot switch your logged-in account.</p>
          {/* Status info */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200 text-slate-600">
            <div>
              <span className="font-semibold text-slate-800">Donor: </span>
              {donation.donorName}
            </div>
            <div>
              <span className="font-semibold text-slate-800">Status: </span>
              {donation.whatsappStatus === 'sent' ? (
                <span className="text-emerald-700 font-medium">
                  Sent on {donation.whatsappSentAt?.slice(0, 16).replace('T', ' ')}
                </span>
              ) : (
                <span className="text-amber-700 font-medium">Pending Delivery</span>
              )}
            </div>
          </div>

          {/* Recipient Phone */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Recipient WhatsApp Mobile (with country code)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98123 45678"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 font-mono"
            />
          </div>

          {/* Message Content */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Customized Message Text
              </label>
              <button
                type="button"
                onClick={handleCopy}
                className="inline-flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-800 font-medium"
              >
                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                {copied ? 'Copied!' : 'Copy Text'}
              </button>
            </div>
            <textarea
              rows={8}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-3 py-2 text-xs font-sans border border-slate-300 rounded-lg focus:ring-2 focus:ring-emerald-500 leading-relaxed font-mono"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 bg-slate-50 border-t border-slate-200">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-800 rounded-lg hover:bg-slate-200 transition-colors"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleSend}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-sm transition-all"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Open WhatsApp & Send</span>
          </button>
        </div>

      </div>
    </div>
  );
};
