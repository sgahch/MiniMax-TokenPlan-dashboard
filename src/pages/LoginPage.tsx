import { useState } from 'react';
import { LayoutGrid, User, Key, ArrowRight, AlertCircle } from 'lucide-react';
import { useAuth } from '../useAuth';

interface LoginPageProps {
  onSwitchToRegister: () => void;
}

export function LoginPage({ onSwitchToRegister }: LoginPageProps) {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username.trim(), password);
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-slate-950">
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-primary-300/20 via-violet-300/20 to-pink-300/20 blur-[100px] dark:from-primary-500/10 dark:via-violet-500/10 dark:to-pink-500/10" />
        <div className="absolute top-1/3 -right-40 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-300/20 via-primary-300/20 to-violet-300/20 blur-[100px] dark:from-cyan-500/10 dark:via-primary-500/10 dark:to-violet-500/10" />
      </div>

      <div className="w-full max-w-sm">
        <div className="glass-card rounded-3xl p-8 shadow-xl animate-scale-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass flex items-center justify-center shadow-glow animate-float">
              <LayoutGrid className="w-8 h-8 text-primary-500" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Token Plan</h1>
            <p className="text-sm text-slate-400">MiniMax 多账号管理</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative">
              <label className="block text-xs font-semibold text-primary-500 mb-1.5">用户名</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder="请输入用户名"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm input-field"
                  required
                />
              </div>
            </div>

            <div className="relative">
              <label className="block text-xs font-semibold text-primary-500 mb-1.5">密码</label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="w-full pl-9 pr-4 py-3 rounded-xl text-sm input-field"
                  required
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
              className="w-full py-3 rounded-xl btn-primary text-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  登录
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* 注册链接 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              还没有账号？
              <button
                onClick={onSwitchToRegister}
                className="ml-1 text-primary-600 dark:text-primary-400 hover:underline font-semibold"
              >
                立即注册
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
