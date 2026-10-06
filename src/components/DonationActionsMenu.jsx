import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';

export function DonationActionsMenu({ receiptNo, actions }) {
  const [position, setPosition] = useState(null);
  const trigger = useRef(null);
  const panel = useRef(null);
  const closeTimer = useRef(null);
  const cancelClose = () => window.clearTimeout(closeTimer.current);
  const close = () => { cancelClose(); setPosition(null); };
  const open = () => {
    cancelClose();
    const rect = trigger.current.getBoundingClientRect();
    const height = Math.min(actions.length * 40 + 52, window.innerHeight - 24);
    const width = Math.min(236, window.innerWidth - 24);
    const below = window.innerHeight - rect.bottom;
    setPosition({
      left: Math.max(12, Math.min(rect.right - width, window.innerWidth - width - 12)),
      top: below >= height + 8 ? rect.bottom + 6 : Math.max(12, rect.top - height - 6),
      width, maxHeight: window.innerHeight - 24
    });
  };
  const scheduleClose = () => { cancelClose(); closeTimer.current = window.setTimeout(close, 160); };
  useEffect(() => () => window.clearTimeout(closeTimer.current), []);
  useEffect(() => {
    if (!position) return;
    const outside = e => {
      if (!trigger.current?.contains(e.target) && !panel.current?.contains(e.target)) close();
    };
    const escape = e => {
      if (e.key === 'Escape') { close(); trigger.current?.focus(); }
    };
    const scroll = e => { if (!panel.current?.contains(e.target)) close(); };
    document.addEventListener('pointerdown', outside);
    document.addEventListener('keydown', escape);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', escape);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [position]);
  const focusItem = index => requestAnimationFrame(() => panel.current?.querySelectorAll('[role="menuitem"]')[index]?.focus());
  return <>
    <button ref={trigger} type="button"
      className={`inline-flex h-9 w-9 items-center justify-center rounded-xl border transition-colors ${position ? 'border-sky-200 bg-sky-50 text-sky-700' : 'border-slate-200 bg-white text-slate-500 hover:border-sky-200 hover:bg-sky-50 hover:text-sky-700'}`}
      aria-label={`Actions for receipt ${receiptNo}`} aria-haspopup="menu" aria-expanded={!!position}
      onPointerEnter={e => { if (e.pointerType === 'mouse') open(); }}
      onPointerLeave={scheduleClose}
      onClick={() => { if (position) close(); else open(); }}
      onKeyDown={e => { if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault(); open(); focusItem(e.key === 'ArrowUp' ? actions.length - 1 : 0);
      } }}
    ><MoreVertical className="h-4 w-4" /></button>
    {position && createPortal(
      <div ref={panel} role="menu" aria-label={`Receipt ${receiptNo} actions`}
        style={position} className="fixed z-[70] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-1.5 text-left shadow-[0_16px_48px_rgba(15,42,71,0.18)]"
        onPointerEnter={cancelClose} onPointerLeave={scheduleClose}
        onBlur={e => { if (!e.currentTarget.contains(e.relatedTarget) && e.relatedTarget !== trigger.current) close(); }}
        onKeyDown={e => {
          const items = [...e.currentTarget.querySelectorAll('[role="menuitem"]')];
          const i = items.indexOf(document.activeElement);
          if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
            e.preventDefault();
            const next = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
            items[next]?.focus();
          }
        }}>
        <p className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Receipt actions</p>
        {actions.map(({ label, icon: Icon, run, destructive }) => (
          <button key={label} role="menuitem" type="button"
            className={`flex min-h-10 w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${destructive ? 'mt-1 border-t border-slate-100 text-rose-600 hover:bg-rose-50' : 'text-slate-700 hover:bg-sky-50 hover:text-sky-700'}`}
            onClick={() => { close(); run(); }}>
            <Icon className="h-4 w-4 shrink-0" /><span>{label}</span>
          </button>
        ))}
      </div>, document.body
    )}
  </>;
}
