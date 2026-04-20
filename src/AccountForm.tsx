import { useState } from 'react';
import type { Account } from './types';

interface AccountFormProps {
  initial?: Account;
  onSubmit: (name: string, apiKey: string) => void;
  onCancel: () => void;
}

export function AccountForm({ initial, onSubmit, onCancel }: AccountFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [apiKey, setApiKey] = useState(initial?.apiKey || '');
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !apiKey.trim()) return;
    onSubmit(name.trim(), apiKey.trim());
  };

  const isValid = name.trim() && apiKey.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 账号名称 */}
      <div className="relative">
        <label
          className={`absolute left-3 transition-all duration-200 pointer-events-none ${
            focused === 'name' || name
              ? '-top-2 text-[10px] px-1 bg-white dark:bg-slate-800 text-indigo-500 font-medium'
              : 'top-3 text-xs text-indigo-400 dark:text-indigo-500'
          }`}
        >
          账号名称
        </label>
        <input
          type="text"
          value={name}
          onFocus={() => setFocused('name')}
          onBlur={() => setFocused(null)}
          onChange={e => setName(e.target.value)}
          placeholder="例如：主账号"
          className="w-full px-3 py-2.5 rounded-xl text-sm border border-indigo-200/50 dark:border-indigo-700/50 bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-100 placeholder:text-transparent focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
          autoFocus
        />
      </div>

      {/* API Key */}
      <div className="relative">
        <label
          className={`absolute left-3 transition-all duration-200 pointer-events-none ${
            focused === 'apiKey' || apiKey
              ? '-top-2 text-[10px] px-1 bg-white dark:bg-slate-800 text-indigo-500 font-medium'
              : 'top-3 text-xs text-indigo-400 dark:text-indigo-500'
          }`}
        >
          API Key
        </label>
        <input
          type="password"
          value={apiKey}
          onFocus={() => setFocused('apiKey')}
          onBlur={() => setFocused(null)}
          onChange={e => setApiKey(e.target.value)}
          placeholder="sk-xxxxxxxx"
          className="w-full px-3 py-2.5 rounded-xl text-sm border border-indigo-200/50 dark:border-indigo-700/50 bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-100 placeholder:text-transparent font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 dark:focus:border-indigo-500 transition-all"
        />
      </div>

      {/* 按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm rounded-xl border border-indigo-200/50 dark:border-indigo-700/50 text-indigo-500 dark:text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-500/10 transition-all btn-press"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className={`flex-1 py-2.5 text-sm rounded-xl font-medium transition-all btn-press ${
            isValid
              ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5'
              : 'bg-indigo-100/50 dark:bg-indigo-900/30 text-indigo-300 dark:text-indigo-600 cursor-not-allowed'
          }`}
        >
          {initial ? '保存' : '添加'}
        </button>
      </div>
    </form>
  );
}
