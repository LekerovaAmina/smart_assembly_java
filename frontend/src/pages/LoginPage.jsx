import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { sendCode, verifyCode } from '../api';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'code'
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState(null);
  const [error, setError] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const handleSendCode = async () => {
    if (!phone.trim()) {
      setError('Введите номер телефона');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      await sendCode(phone.trim());
      setStep('code');
      showToast('Код отправлен на ваш телефон');
    } catch (err) {
      setError(err?.response?.data?.message || 'Не удалось отправить код');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!code.trim()) {
      setError('Введите код');
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await verifyCode(phone.trim(), code.trim());
      const { token, ...userData } = res.data;
      login(token, userData);
      navigate('/events', { replace: true });
    } catch (err) {
      setError(err?.response?.data?.message || 'Неверный код');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      step === 'phone' ? handleSendCode() : handleLogin();
    }
  };

  return (
    <div className="min-h-screen bg-bg flex items-center justify-center p-4">
      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-5 right-5 z-50 px-4 py-3 rounded-card shadow-lg text-sm font-medium transition-all ${
            toast.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
          }`}
        >
          {toast.msg}
        </div>
      )}

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

        {/* Phone field */}
        <div className="mb-4">
          <label className="block text-xs text-text-muted uppercase tracking-wide mb-1.5">
            Номер телефона
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="+7 777 777 7777"
            disabled={step === 'code' || loading}
            className="w-full px-3 py-2.5 border border-border rounded-btn text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors disabled:bg-gray-50 disabled:text-text-muted"
          />
        </div>

        {/* Code field */}
        <div className="mb-5">
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs text-text-muted uppercase tracking-wide">
              Код
            </label>
            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading}
              className="text-xs text-primary hover:text-primary-hover font-medium transition-colors disabled:opacity-50"
            >
              {step === 'code' ? 'Отправить снова' : 'Запросить код'}
            </button>
          </div>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введи..."
            inputMode="numeric"
            maxLength={6}
            className="w-full px-3 py-2.5 border border-border rounded-btn text-sm text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
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
