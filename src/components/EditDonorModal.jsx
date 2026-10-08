import React, { useEffect, useRef, useState } from 'react';
import { X, Save } from 'lucide-react';
import { StorageService } from '../services/storage';

const fields = [
  ['donorName', 'Donor name', 'text', true],
  ['donorPhone', 'Phone / WhatsApp', 'tel', true],
  ['donorEmail', 'Email', 'email', false],
  ['donorPan', 'PAN', 'text', false],
  ['donorAddress', 'Street address', 'text', false],
  ['donorCity', 'City', 'text', false],
  ['donorState', 'State', 'text', false],
  ['donorPincode', 'Pincode', 'text', false]
];

export function EditDonorModal({ donation, onClose, onSaved }) {
  const [values, setValues] = useState(() => Object.fromEntries(fields.map(([key]) => [key, donation[key] || ''])));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const busy = useRef(false);
  const dialog = useRef(null);

  useEffect(() => {
    const previousFocus = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.querySelector('input:not([readonly])')?.focus();
    const onKey = event => {
      if (event.key === 'Escape') { event.preventDefault(); if (!busy.current) onClose(); }
      if (event.key === 'Tab') {
        const controls = [...dialog.current.querySelectorAll('button:not([disabled]), input:not([disabled])')];
        const first = controls[0], last = controls[controls.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = previousOverflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [onClose]);

  const submit = async event => {
    event.preventDefault();
    if (busy.current) return;
    const clean = Object.fromEntries(fields.map(([key]) => [key, String(values[key]).trim()]));
    clean.donorPan = clean.donorPan.toUpperCase();
    if (!clean.donorName || !clean.donorPhone) { setError('Donor name and phone are required.'); return; }
    if (clean.donorPan && !/^[A-Z]{5}[0-9]{4}[A-Z]$/.test(clean.donorPan)) { setError('Enter a valid PAN or leave it empty.'); return; }
    busy.current = true;
    setSaving(true);
    setError('');
    try {
      const updated = await StorageService.updateDonorDetails(donation.id, clean);
      onSaved(updated);
    } catch (err) {
      setError(err.message || 'Could not save donor details. Please try again.');
    } finally {
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div ref={dialog} role="dialog" aria-modal="true" aria-labelledby="edit-donor-title" className="my-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div><h2 id="edit-donor-title" className="font-heading text-lg font-bold text-slate-900">Edit donor details</h2><p className="mt-1 text-xs text-slate-500">Your existing receipt number stays the same.</p></div>
          <button type="button" aria-label="Close donor editor" disabled={saving} onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={submit} className="space-y-5 px-6 py-5">
          <label className="block text-xs font-semibold text-slate-600">Receipt number
            <input readOnly value={donation.receiptNo} className="mt-2 block w-full rounded-lg border border-sky-100 bg-sky-50 px-3 py-2.5 text-sm font-semibold text-sky-800" />
          </label>
          {error && <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {fields.map(([key, label, type, required]) => (
              <label key={key} className={`block text-xs font-semibold text-slate-600 ${key === 'donorAddress' ? 'sm:col-span-2' : ''}`}>{label}{required ? ' *' : ''}
                <input type={type} required={required} disabled={saving} value={values[key]} maxLength={key === 'donorPan' ? 10 : undefined}
                  onChange={event => setValues(current => ({ ...current, [key]: key === 'donorPan' ? event.target.value.toUpperCase() : event.target.value }))}
                  className="mt-2 block w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-normal text-slate-900 outline-none focus:border-sky-500 focus:ring-2 focus:ring-sky-100 disabled:bg-slate-50" />
              </label>
            ))}
          </div>
          <p className="text-xs leading-relaxed text-slate-500">Download the receipt again to get the corrected PDF. Use Send email / WhatsApp to share it again, and Sync to Google Sheets to update the sheet.</p>
          <div className="flex justify-end gap-3 border-t border-slate-100 pt-4">
            <button type="button" onClick={onClose} disabled={saving} className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-sky-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-50"><Save className="h-4 w-4" />{saving ? 'Saving…' : 'Save donor details'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
