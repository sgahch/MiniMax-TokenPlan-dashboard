import { useEffect, useState } from 'react';
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import type { Toast as ToastType } from '../hooks/useToast';

interface ToastProps {
  toast: ToastType;
  onRemove: (id: string) => void;
}

const icons = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

const styles = {
  success: 'bg-emerald-50/90 dark:bg-emerald-500/10 border-emerald-200/50 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400',
  error: 'bg-red-50/90 dark:bg-red-500/10 border-red-200/50 dark:border-red-500/20 text-red-700 dark:text-red-400',
  warning: 'bg-amber-50/90 dark:bg-amber-500/10 border-amber-200/50 dark:border-amber-500/20 text-amber-700 dark:text-amber-400',
  info: 'bg-primary-50/90 dark:bg-primary-500/10 border-primary-200/50 dark:border-primary-500/20 text-primary-700 dark:text-primary-400',
};

export function ToastItem({ toast, onRemove }: ToastProps) {
  const [show, setShow] = useState(false);
  const Icon = icons[toast.type];

  useEffect(() => {
    const t = setTimeout(() => setShow(true), 10);
    return () => clearTimeout(t);
  }, []);

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-lg shadow-black/5 transition-all duration-300 ${styles[toast.type]} ${
        show ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span className="text-sm font-medium flex-1">{toast.message}</span>
      <button
        onClick={() => onRemove(toast.id)}
        className="shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastType[];
  onRemove: (id: string) => void;
}

export function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm pointer-events-none">
      {toasts.map(toast => (
        <div key={toast.id} className="pointer-events-auto">
          <ToastItem toast={toast} onRemove={onRemove} />
        </div>
      ))}
    </div>
  );
}
