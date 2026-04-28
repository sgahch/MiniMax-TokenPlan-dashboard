import { AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  message,
  confirmText = '确认',
  cancelText = '取消',
  danger = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <div
      className="fixed inset-0 bg-black/30 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={e => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="glass-card rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in overflow-hidden">
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
              danger
                ? 'bg-red-50 dark:bg-red-500/10 text-red-500'
                : 'bg-primary-50 dark:bg-primary-500/10 text-primary-500'
            }`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
                {title}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                {message}
              </p>
            </div>
          </div>
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all font-medium"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-2.5 text-sm rounded-xl font-medium transition-all ${
              danger ? 'btn-danger' : 'btn-primary'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
