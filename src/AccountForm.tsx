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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !apiKey.trim()) return;
    onSubmit(name.trim(), apiKey.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">账号名称</label>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="例如: 我的主账号"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">API Key</label>
        <input
          type="password"
          value={apiKey}
          onChange={e => setApiKey(e.target.value)}
          placeholder="sk-xxxxxxxx"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
        />
      </div>
      <div className="flex gap-2 justify-end">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
        >
          取消
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          {initial ? '保存' : '添加'}
        </button>
      </div>
    </form>
  );
}