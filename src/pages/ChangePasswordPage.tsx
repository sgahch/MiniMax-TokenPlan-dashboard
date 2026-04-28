import { useState } from 'react';
import { X, KeyRound, Lock, AlertCircle, ArrowRight } from 'lucide-react';

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
    <div className="fixed inset-0 bg-black/20 backdrop-blur-md flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass-card rounded-3xl w-full max-w-sm shadow-2xl animate-scale-in">
        <div className="p-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-orange-400 flex items-center justify-center text-white">
                <KeyRound className="w-5 h-5" />
              </div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-slate-100">修改密码</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl glass text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-primary-500 mb-1.5">旧密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={oldPassword}
                  onChange={e => setOldPassword(e.target.value)}
                  placeholder="请输入旧密码"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm input-field"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-primary-500 mb-1.5">新密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="至少 6 位"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm input-field"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-primary-500 mb-1.5">确认新密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="再次输入新密码"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm input-field"
                  required
                  minLength={6}
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50/70 dark:bg-red-500/5 border border-red-200/40 dark:border-red-500/10">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                <p className="text-xs text-red-500">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-medium shadow-lg shadow-amber-500/30 hover:shadow-xl hover:shadow-amber-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  确认修改
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
