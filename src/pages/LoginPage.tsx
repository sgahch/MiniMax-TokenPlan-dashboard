import { useState } from 'react';
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
      // 登录成功后刷新页面，让 App 重新渲染
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-8" style={{ background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 50%, #fdf4ff 100%)' }}>
      {/* 背景装饰 */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <div className="absolute -top-48 -left-48 w-[500px] h-[500px] rounded-full bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 blur-[100px] opacity-20" />
        <div className="absolute top-1/3 -right-48 w-[400px] h-[400px] rounded-full bg-gradient-to-br from-cyan-300 via-indigo-300 to-purple-300 blur-[100px] opacity-15" />
      </div>

      <div className="w-full max-w-sm">
        <div className="glass rounded-3xl p-8 shadow-xl animate-scale-in">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl glass flex items-center justify-center">
              <span className="text-3xl">🎯</span>
            </div>
            <h1 className="text-2xl font-bold text-indigo-900 mb-1">Token Plan</h1>
            <p className="text-sm text-indigo-400">MiniMax 多账号管理</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-indigo-500 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="请输入用户名"
                className="w-full px-4 py-3 rounded-xl text-sm border border-indigo-200/50 dark:border-indigo-700/50 bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-indigo-500 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full px-4 py-3 rounded-xl text-sm border border-indigo-200/50 dark:border-indigo-700/50 bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 注册链接 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-indigo-400">
              还没有账号？
              <button
                onClick={onSwitchToRegister}
                className="ml-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
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
