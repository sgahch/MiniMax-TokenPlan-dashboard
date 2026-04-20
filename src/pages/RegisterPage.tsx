import { useState } from 'react';
import { useAuth } from '../useAuth';

interface RegisterPageProps {
  onSwitchToLogin: () => void;
}

export function RegisterPage({ onSwitchToLogin }: RegisterPageProps) {
  const { register } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setError('密码长度至少 6 位');
      return;
    }

    setLoading(true);

    try {
      await register(username.trim(), password);
      // 注册成功后刷新页面
      window.location.reload();
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
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
            <h1 className="text-2xl font-bold text-indigo-900 mb-1">注册账号</h1>
            <p className="text-sm text-indigo-400">创建新账号开始管理</p>
          </div>

          {/* 表单 */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-indigo-500 mb-1.5">用户名</label>
              <input
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                placeholder="3-50 个字符"
                className="w-full px-4 py-3 rounded-xl text-sm border border-indigo-200/50 dark:border-indigo-700/50 bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
                minLength={3}
                maxLength={50}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-indigo-500 mb-1.5">密码</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="至少 6 位"
                className="w-full px-4 py-3 rounded-xl text-sm border border-indigo-200/50 dark:border-indigo-700/50 bg-white/80 dark:bg-slate-800/80 text-indigo-900 dark:text-indigo-100 placeholder:text-indigo-300 dark:placeholder:text-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
                required
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-indigo-500 mb-1.5">确认密码</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="再次输入密码"
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
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40 hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '注册中...' : '注册'}
            </button>
          </form>

          {/* 登录链接 */}
          <div className="mt-6 text-center">
            <p className="text-xs text-indigo-400">
              已有账号？
              <button
                onClick={onSwitchToLogin}
                className="ml-1 text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
              >
                立即登录
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
