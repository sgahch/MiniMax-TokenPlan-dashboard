import { useState } from 'react';

interface ChangePasswordPageProps {
  onClose: () => void;
  onSuccess: () => void;
}

export function ChangePasswordPage({ onClose, onSuccess }: ChangePasswordPageProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('两次输入的新密码不一致');
      return;
    }

    if (newPassword.length < 6) {
      setError('新密码长度至少 6 位');
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          old_password: oldPassword,
          new_password: newPassword
        })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '修改失败');
      }

      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '修改失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4">
      <div className="glass rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
              </div>
              <h2 className="text-base font-semibold text-indigo-900 dark:text-indigo-100">修改密码</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl glass text-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-indigo-500 mb-1.5">旧密码</label>
              <input
                type="password"
                value={oldPassword}
                onChange={e => setOldPassword(e.target.value)}
                placeholder="请输入旧密码"
                className="w-full px-4 py-3 rounded-xl text-sm border border-indigo-200/50 dark:border-indigo-700/50 bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-indigo-500 mb-1.5">新密码</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                placeholder="至少 6 位"
                className="w-full px-4 py-3 rounded-xl text-sm border border-indigo-200/50 dark:border-indigo-700/50 bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-indigo-500 mb-1.5">确认新密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="再次输入新密码"
                className="w-full px-4 py-3 rounded-xl text-sm border border-indigo-200/50 dark:border-indigo-700/50 bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
                minLength={6}
              />
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-red-50/70 dark:bg-red-900/20 border border-red-200/40 dark:border-red-800/30">
                <p className="text-xs text-red-500 text-center">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '修改中...' : '确认修改'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
