import React, { useEffect, useRef, useState } from 'react';
import { ChevronDown, LogOut } from 'lucide-react';

export function ProfileDropdown({ currentUser, onLogout }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const trigger = useRef(null);
  const timer = useRef(null);
  const cancel = () => clearTimeout(timer.current);
  const close = () => { cancel(); setOpen(false); };
  useEffect(() => () => clearTimeout(timer.current), []);
  useEffect(() => {
    if (!open) return;
    const outside = e => { if (!root.current?.contains(e.target)) close(); };
    const escape = e => { if (e.key === 'Escape') { close(); trigger.current?.focus(); } };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', escape); };
  }, [open]);
  const initials = String(currentUser.name || 'User').split(' ').filter(Boolean).map(s => s[0]).slice(0, 2).join('').toUpperCase();
  return <div ref={root} className="relative" onPointerEnter={e => {
    if (e.pointerType === 'mouse') { cancel(); setOpen(true); }
  }} onPointerLeave={() => { cancel(); timer.current = setTimeout(() => {
    if (!root.current?.contains(document.activeElement)) setOpen(false);
  }, 160); }} onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget)) close(); }}>
    <button ref={trigger} type="button" aria-label="Account profile" aria-expanded={open} aria-controls="account-profile-panel"
      onClick={() => { cancel(); setOpen(value => !value); }}
      onKeyDown={e => { if (e.key === 'ArrowDown') {
        e.preventDefault(); setOpen(true); requestAnimationFrame(() => root.current?.querySelector('[data-logout]')?.focus());
      } }}
      className="flex items-center gap-2 rounded-full p-1 text-slate-500 hover:bg-sky-50">
      <span className="flex h-9 w-9 items-center justify-center rounded-full border border-sky-200 bg-sky-100 font-semibold text-xs text-sky-800">{initials}</span>
      <ChevronDown className="h-3.5 w-3.5" />
    </button>
    {open && <div id="account-profile-panel" className="absolute right-0 top-full z-50 w-[min(280px,calc(100vw-32px))] rounded-2xl border border-slate-200 bg-white p-4 shadow-xl">
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Signed in as</p>
      <p className="mt-2 break-words text-sm font-semibold text-slate-900">{currentUser.name || 'Workspace user'}</p>
      <p className="mt-1 break-all text-xs text-slate-500">{currentUser.email || currentUser.username}</p>
      <span className="mt-3 inline-block rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-semibold capitalize text-sky-700">{currentUser.status === 'main_admin' ? 'Main admin' : currentUser.role || 'Staff'}</span>
      <div className="mt-4 border-t border-slate-100 pt-2">
        <button data-logout type="button" onClick={() => { close(); onLogout(); }} className="flex min-h-10 w-full items-center gap-2 rounded-lg px-2 text-xs font-semibold text-rose-600 hover:bg-rose-50"><LogOut className="h-4 w-4" />Log out</button>
      </div>
    </div>}
  </div>;
}
