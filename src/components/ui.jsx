import { cn } from '../lib/cn.js';
import { Loader2, X } from 'lucide-react';

// ── Button ─────────────────────────────────────────────────────────────────
const variants = {
  primary: 'btn-primary',
  outline: 'btn-outline',
  ghost: 'btn-ghost',
  danger: 'btn bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500/40',
};

export function Button({ variant = 'primary', loading, className, children, ...props }) {
  return (
    <button className={cn(variants[variant], className)} disabled={loading || props.disabled} {...props}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </button>
  );
}

// ── Inputs ───────────────────────────────────────────────────────────────
export function Field({ label, error, children, hint }) {
  return (
    <div>
      {label && <label className="label">{label}</label>}
      {children}
      {hint && !error && <p className="mt-1 text-xs text-slate-400">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
}

export function Input({ className, ...props }) {
  return <input className={cn('input', className)} {...props} />;
}

export function Textarea({ className, ...props }) {
  return <textarea className={cn('input min-h-[96px] resize-y', className)} {...props} />;
}

export function Select({ className, children, ...props }) {
  return (
    <select className={cn('input', className)} {...props}>
      {children}
    </select>
  );
}

// ── Card / layout primitives ─────────────────────────────────────────────
export function Card({ className, children }) {
  return <div className={cn('card', className)}>{children}</div>;
}

export function PageHeader({ title, subtitle, children }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{title}</h1>
        {subtitle && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>}
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </div>
  );
}

const badgeColors = {
  brand: 'bg-brand-50 text-brand-700 dark:bg-brand-600/15 dark:text-brand-300',
  green: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300',
  amber: 'bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300',
  red: 'bg-red-50 text-red-700 dark:bg-red-500/15 dark:text-red-300',
  slate: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
};

export function Badge({ color = 'slate', children, className }) {
  return <span className={cn('badge', badgeColors[color], className)}>{children}</span>;
}

export function Spinner({ className }) {
  return <Loader2 className={cn('h-5 w-5 animate-spin text-brand-600', className)} />;
}

export function Loading({ label = 'Loading…' }) {
  return (
    <div className="flex items-center justify-center gap-3 py-16 text-sm text-slate-500">
      <Spinner /> {label}
    </div>
  );
}

export function EmptyState({ icon: Icon, title, subtitle, children }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 py-16 text-center dark:border-slate-700">
      {Icon && <Icon className="mb-3 h-10 w-10 text-slate-300 dark:text-slate-600" />}
      <p className="font-semibold text-slate-700 dark:text-slate-200">{title}</p>
      {subtitle && <p className="mt-1 max-w-sm text-sm text-slate-500">{subtitle}</p>}
      {children && <div className="mt-4">{children}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, label, value, accent = 'brand' }) {
  const ring = {
    brand: 'bg-brand-50 text-brand-600 dark:bg-brand-600/15 dark:text-brand-300',
    green: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-500/15 dark:text-amber-300',
    violet: 'bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300',
  }[accent];
  return (
    <Card className="flex items-center gap-4">
      {Icon && (
        <div className={cn('grid h-11 w-11 place-items-center rounded-xl', ring)}>
          <Icon className="h-5 w-5" />
        </div>
      )}
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-white">{value}</p>
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">{label}</p>
      </div>
    </Card>
  );
}

// ── Modal ────────────────────────────────────────────────────────────────
export function Modal({ open, onClose, title, children, footer }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="card relative z-10 w-full max-w-lg animate-fade-in">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
          <button className="btn-ghost !p-1.5" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-5 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
}
