import { useState } from 'react';
import { FolderOpen, User, Key } from 'lucide-react';
import type { Account, Group } from './types';

interface AccountFormProps {
  initial?: Account;
  groups: Group[];
  selectedGroupId: string | null;
  onSubmit: (name: string, apiKey: string, groupId: string | null) => void;
  onCancel: () => void;
}

export function AccountForm({ initial, groups, selectedGroupId, onSubmit, onCancel }: AccountFormProps) {
  const [name, setName] = useState(initial?.name || '');
  const [apiKey, setApiKey] = useState(initial?.apiKey || '');
  const [groupId, setGroupId] = useState<string | null>(initial?.groupId ?? selectedGroupId);
  const [focused, setFocused] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !apiKey.trim()) return;
    onSubmit(name.trim(), apiKey.trim(), groupId);
  };

  const isValid = name.trim() && apiKey.trim();

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* 账号名称 */}
      <div className="relative">
        <label
          className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
            focused === 'name' || name
              ? '-top-2 text-[10px] px-1 bg-white dark:bg-slate-800 text-primary-500 font-semibold'
              : 'top-3 text-xs text-slate-400'
          }`}
        >
          账号名称
        </label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={name}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            onChange={e => setName(e.target.value)}
            placeholder="例如：主账号"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm input-field"
            autoFocus
          />
        </div>
      </div>

      {/* API Key */}
      <div className="relative">
        <label
          className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
            focused === 'apiKey' || apiKey
              ? '-top-2 text-[10px] px-1 bg-white dark:bg-slate-800 text-primary-500 font-semibold'
              : 'top-3 text-xs text-slate-400'
          }`}
        >
          API Key
        </label>
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="password"
            value={apiKey}
            onFocus={() => setFocused('apiKey')}
            onBlur={() => setFocused(null)}
            onChange={e => setApiKey(e.target.value)}
            placeholder="sk-xxxxxxxx"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm input-field font-mono"
          />
        </div>
      </div>

      {/* 分组 */}
      <div className="relative">
        <label
          className={`absolute left-3 transition-all duration-200 pointer-events-none z-10 ${
            groupId !== null
              ? '-top-2 text-[10px] px-1 bg-white dark:bg-slate-800 text-primary-500 font-semibold'
              : 'top-3 text-xs text-slate-400'
          }`}
        >
          分组（可选）
        </label>
        <div className="relative">
          <FolderOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <select
            value={groupId ?? ''}
            onChange={e => setGroupId(e.target.value || null)}
            className="w-full pl-9 pr-3 py-2.5 rounded-xl text-sm input-field appearance-none cursor-pointer"
          >
            <option value="" disabled>选择分组</option>
            {groups.map(group => (
              <option key={group.id} value={group.id}>{group.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 按钮 */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all font-medium"
        >
          取消
        </button>
        <button
          type="submit"
          disabled={!isValid}
          className={`flex-1 py-2.5 text-sm rounded-xl font-medium transition-all ${
            isValid
              ? 'btn-primary'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed'
          }`}
        >
          {initial ? '保存' : '添加'}
        </button>
      </div>
    </form>
  );
}
