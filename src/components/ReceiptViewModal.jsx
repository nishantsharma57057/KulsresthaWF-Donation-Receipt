import React, { useEffect, useMemo, useState } from 'react';
import { generateDonationPdf, getDonationPdfFilename } from '../utils/receiptGenerator';
import {
  X,
  Download,
  Mail,
  MessageCircle,
  FileSpreadsheet,
  RotateCw,
  AlertCircle
} from 'lucide-react';

export const ReceiptViewModal = ({
  donation,
  onClose,
  settings,
  onOpenWhatsApp,
  onOpenEmail
}) => {
  const generated = useMemo(() => {
    if (!donation) return null;
    try { return { doc: generateDonationPdf(donation, settings) }; }
    catch (error) { return { error: error.message || 'Unable to generate receipt.' }; }
  }, [donation, settings]);
  const [preview, setPreview] = useState(null);

  useEffect(() => {
    if (!generated?.doc) { setPreview(null); return; }
    const url = URL.createObjectURL(generated.doc.output('blob'));
    setPreview({ doc: generated.doc, url });
    return () => URL.revokeObjectURL(url);
  }, [generated]);

  useEffect(() => {
    if (!donation) return;
    const closeOnEscape = (event) => { if (event.key === 'Escape') onClose(); };
    window.addEventListener('keydown', closeOnEscape);
    return () => window.removeEventListener('keydown', closeOnEscape);
  }, [donation, onClose]);

  if (!donation) return null;
  const pdfUrl = preview?.doc === generated?.doc ? preview?.url : null;
  const handleDownload = () => {
    generated?.doc?.save(getDonationPdfFilename(donation));
  };

  const emailStatusLabel = donation.emailStatus === 'sent' ? '• Sent' : '• Setup required';
  const waStatusLabel = donation.whatsappStatus === 'sent' ? '• Sent' : '• Setup required';
  const sheetStatusLabel = donation.googleSheetStatus === 'synced' ? '• Synced' : '• Setup required';

  return (
    <div role="dialog" aria-modal="true" aria-label="Donation receipt" className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-start justify-center p-3 sm:p-6 no-print">
      <div className="my-auto bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
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
            aria-label="Close donation receipt"
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: 2 Columns */}
        <div className="p-6 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* The preview displays the very same PDF document used by Download. */}
          <div className="lg:col-span-8 min-w-0">
            <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-100 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 bg-white border-b border-slate-200">
                <span className="text-xs font-semibold text-slate-600">Official PDF preview</span>
                {pdfUrl && <a href={pdfUrl} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-sky-700 hover:underline">Open full-size PDF</a>}
              </div>
              {generated?.error ? (
                <div role="alert" className="p-6 text-sm text-rose-700">{generated.error}</div>
              ) : pdfUrl ? (
                <iframe
                  title={'Donation receipt PDF - ' + donation.receiptNo}
                  src={pdfUrl + '#view=FitH'}
                  className="w-full h-[65vh] sm:h-[76vh] min-h-[420px] border-0"
                />
              ) : <div role="status" className="p-8 text-sm text-slate-500">Preparing receipt preview...</div>}
            </div>
            <p className="text-[11px] text-slate-500 mt-3 leading-relaxed">
              Preview and download use the same PDF. If your browser cannot display it here, use Open full-size PDF or Download PDF.
            </p>
          </div>

          {/* Right Column: Receipt Ready & Delivery Status */}
          <div className="lg:col-span-4 space-y-6">
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
                disabled={!generated?.doc}
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
                  'No internal notes added.'}
              </p>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
