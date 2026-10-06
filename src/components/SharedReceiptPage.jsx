import React, { useEffect, useState } from 'react';
import { Download, Printer, Heart } from 'lucide-react';
import { readSharedReceipt } from '../utils/receiptShare';
import { generateDonationPdf, getDonationPdfFilename } from '../utils/receiptGenerator';

export function SharedReceiptPage() {
  const [result, setResult] = useState({ loading:true });
  useEffect(() => {
    let url;
    try {
      const donation = readSharedReceipt(window.location);
      const doc = generateDonationPdf(donation);
      url = URL.createObjectURL(doc.output('blob'));
      setResult({ donation, doc, url, loading:false });
    } catch (error) {
      setResult({ error:error.message || 'This receipt could not be opened.', loading:false });
    }
    return () => { if (url) URL.revokeObjectURL(url); };
  }, []);
  return <main className="min-h-screen bg-slate-50 p-4 sm:p-8">
    <div className="mx-auto max-w-4xl">
      <header className="mb-5 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div><div className="mb-2 flex items-center gap-2 text-xs font-semibold text-sky-700"><Heart className="h-4 w-4" />Kulshrestha Welfare Foundation</div><h1 className="text-xl font-bold text-slate-900">Your donation receipt</h1><p className="mt-1 text-xs text-slate-500">{result.donation?.receiptNo || 'Thank you for your generous support.'}</p></div>
        {result.doc && <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => result.doc.save(getDonationPdfFilename(result.donation))} className="inline-flex items-center gap-2 rounded-xl bg-sky-600 px-4 py-3 text-xs font-semibold text-white hover:bg-sky-700"><Download className="h-4 w-4" />Download PDF</button>
          <button type="button" onClick={() => window.open(result.url,'_blank','noopener,noreferrer')} className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"><Printer className="h-4 w-4" />Open PDF</button>
        </div>}
      </header>
      {result.loading ? <p role="status" className="p-8 text-center text-sm text-slate-500">Preparing your receipt…</p> :
        result.error ? <div role="alert" className="rounded-2xl border border-rose-200 bg-white p-6"><h2 className="font-semibold text-slate-900">Receipt unavailable</h2><p className="mt-2 text-sm text-slate-600">{result.error}</p><a className="mt-4 inline-block text-sm text-sky-700 underline" href="mailto:info@kulshresthawf.org">Contact the foundation</a></div> :
        <><iframe title="Donation receipt PDF" src={result.url} className="h-[75vh] min-h-[480px] w-full rounded-xl border border-slate-200 bg-white" /><p className="mt-3 text-center text-xs text-slate-500">This shared copy omits donor contact details, PAN, address and transaction reference. Use Download PDF if the preview is not visible.</p></>}
    </div>
  </main>;
}
