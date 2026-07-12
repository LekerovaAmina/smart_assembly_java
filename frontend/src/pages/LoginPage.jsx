import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login as loginRequest } from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Введите email и пароль');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await loginRequest(email.trim(), password);
      const { token, ...userData } = res.data;
      login(token, userData);
      navigate('/events', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Неверный email или пароль');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleLogin();
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      <div className="bg-surface rounded-card border border-border p-8 w-full max-w-sm shadow-sm">
        {/* Logo */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="w-9 h-9 bg-primary rounded-lg flex items-center justify-center text-white font-bold text-base">
            Ж
          </div>
          <span className="font-semibold text-text-primary text-base">
            Ассамблея Жастары
          </span>
        </div>

        <h1 className="text-2xl font-bold text-text-primary mb-6 text-center">
          Войти
        </h1>

        {/* Email field */}
        <div className="mb-4">
          <label className="block text-xs text-text-muted uppercase tracking-wide mb-1.5">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="you@example.com"
            autoComplete="username"
            disabled={loading}
            className="w-full px-3 py-2.5 border border-border rounded-btn text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:bg-gray-50 disabled:text-text-muted"
          />
        </div>

        {/* Password field */}
        <div className="mb-5">
          <label className="block text-xs text-text-muted uppercase tracking-wide mb-1.5">
            Пароль
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={loading}
            className="w-full px-3 py-2.5 border border-border rounded-btn text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:bg-gray-50 disabled:text-text-muted"
          />
        </div>

        {/* Error */}
        {error && (
          <p className="text-sm text-red-600 mb-4 bg-red-50 border border-red-200 rounded-btn px-3 py-2">
            {error}
          </p>
        )}

        {/* Login button */}
        <button
          onClick={handleLogin}
          disabled={loading}
          className="w-full bg-primary hover:bg-primary-hover text-white font-medium py-2.5 rounded-btn text-sm transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {loading ? 'Входим...' : 'Войти'}
        </button>
      </div>
    </div>
  );
}
