import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { getEventById, checkinSelf, sendCode, verifyCode } from '../api';
import { useAuth } from '../context/AuthContext';

function formatDate(dateStr, timeStr) {
  if (!dateStr) return '';
  try {
    const [year, month, day] = dateStr.split('-');
    return `${day}.${month}.${year}${timeStr ? ` · ${timeStr.substring(0, 5)}` : ''}`;
  } catch { return dateStr; }
}

// ── Встроенная форма входа ────────────────────────────────────────────────────
function InlineLogin({ onSuccess }) {
  const { login } = useAuth();
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState('phone');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSend = async () => {
    if (!phone.trim()) { setError('Введите номер телефона'); return; }
    setError(null); setLoading(true);
    try {
      await sendCode(phone.trim());
      setStep('code');
    } catch (err) {
      setError(err?.response?.data?.message || 'Не удалось отправить код');
    } finally { setLoading(false); }
  };

  const handleLogin = async () => {
    if (!code.trim()) { setError('Введите код'); return; }
    setError(null); setLoading(true);
    try {
      const res = await verifyCode(phone.trim(), code.trim());
      const { token, ...userData } = res.data;
      login(token, userData);
      onSuccess();
    } catch (err) {
      setError(err?.response?.data?.message || 'Неверный код');
    } finally { setLoading(false); }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900 mb-1 text-center">Войдите для подтверждения</h2>
      <p className="text-sm text-gray-500 text-center mb-5">Необходима авторизация</p>

      <div className="mb-3">
        <label className="block text-xs text-gray-500 uppercase tracking-wide mb-1">Телефон</label>
        <input
          type="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && (step === 'phone' ? handleSend() : handleLogin())}
          placeholder="+7 777 777 7777"
          disabled={step === 'code' || loading}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400 disabled:bg-gray-50"
        />
      </div>

      <div className="mb-4">
        <div className="flex justify-between items-center mb-1">
          <label className="text-xs text-gray-500 uppercase tracking-wide">Код</label>
          <button onClick={handleSend} disabled={loading}
            className="text-xs text-orange-500 hover:text-orange-600 font-medium disabled:opacity-50">
            {step === 'code' ? 'Отправить снова' : 'Запросить код'}
          </button>
        </div>
        <input
          type="text" value={code} onChange={e => setCode(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleLogin()}
          placeholder="Введите код" inputMode="numeric" maxLength={6}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-orange-400"
        />
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3">{error}</p>
      )}

      <button onClick={handleLogin} disabled={loading}
        className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-2.5 rounded-lg text-sm transition-colors disabled:opacity-60">
        {loading ? 'Входим...' : 'Войти'}
      </button>
    </div>
  );
}

// ── Основная страница ─────────────────────────────────────────────────────────
export default function QrCheckinPage() {
  const { id } = useParams();
  const { token } = useAuth();

  const [event, setEvent] = useState(null);
  const [eventLoading, setEventLoading] = useState(true);
  const [eventError, setEventError] = useState(null);

  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [confirmError, setConfirmError] = useState(null);

  // После логина перезагружаем мероприятие
  const loadEvent = async () => {
    setEventLoading(true); setEventError(null);
    try {
      const res = await getEventById(id);
      setEvent(res.data);
    } catch (err) {
      setEventError(err?.response?.data?.message || 'Не удалось загрузить мероприятие');
    } finally {
      setEventLoading(false);
    }
  };

  useEffect(() => {
    if (token) loadEvent();
    else setEventLoading(false);
  }, [token, id]);

  const handleConfirm = async () => {
    setConfirming(true); setConfirmError(null);
    try {
      await checkinSelf(id);
      setConfirmed(true);
    } catch (err) {
      setConfirmError(err?.response?.data?.message || 'Ошибка подтверждения');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-sm">

        {/* Логотип */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div className="w-9 h-9 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold text-base">Ж</div>
          <span className="font-semibold text-gray-800">Ассамблея Жастары</span>
        </div>

        {/* Иконка QR */}
        <div className="text-center mb-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-50 border border-orange-100 mb-3">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#FF6B00" strokeWidth="1.5">
              <rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/>
              <rect x="3" y="14" width="7" height="7" rx="1"/>
              <path d="M14 14h1v1h-1zM17 14h1v1h-1zM14 17h1v1h-1zM17 17h3v3h-3z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900">Подтверждение участия</h1>
          <p className="text-sm text-gray-500 mt-1">Зафиксируйте ваш приход на мероприятие</p>
        </div>

        {/* Не авторизован */}
        {!token && (
          <InlineLogin onSuccess={() => {
            setEventLoading(true);
            setTimeout(loadEvent, 300);
          }} />
        )}

        {/* Авторизован — загрузка */}
        {token && eventLoading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center shadow-sm">
            <div className="inline-block w-8 h-8 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mb-3" />
            <p className="text-sm text-gray-500">Загружаем мероприятие...</p>
          </div>
        )}

        {/* Ошибка загрузки */}
        {token && !eventLoading && eventError && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-center shadow-sm">
            <p className="text-red-600 text-sm mb-4">{eventError}</p>
            <button onClick={loadEvent}
              className="bg-orange-500 text-white text-sm font-medium px-4 py-2 rounded-lg hover:bg-orange-600 transition-colors">
              Повторить
            </button>
          </div>
        )}

        {/* Карточка мероприятия + кнопка */}
        {token && !eventLoading && event && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Шапка мероприятия */}
            <div className="p-5 border-b border-gray-100">
              <p className="text-xs font-semibold text-orange-500 uppercase tracking-wide mb-1">Мероприятие</p>
              <h2 className="text-base font-bold text-gray-900 leading-snug">{event.eventName}</h2>
              {event.eventDate && (
                <p className="text-sm text-gray-500 mt-1.5 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/>
                    <line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
                  </svg>
                  {formatDate(event.eventDate, event.startTime)}
                </p>
              )}
              {event.location && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
                  </svg>
                  {event.location}
                </p>
              )}
            </div>

            {/* Блок подтверждения */}
            <div className="p-5">
              {confirmed ? (
                <div className="text-center py-2">
                  <div className="text-4xl mb-3">✅</div>
                  <p className="text-base font-bold text-green-700">Присутствие подтверждено!</p>
                  <p className="text-sm text-green-600 mt-1">
                    Часы будут начислены после завершения мероприятия.
                  </p>
                </div>
              ) : (
                <>
                  {confirmError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-2.5 mb-3 flex items-start gap-2">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" className="mt-0.5 flex-shrink-0">
                        <circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/>
                        <line x1="9" y1="9" x2="15" y2="15"/>
                      </svg>
                      <p className="text-sm text-red-600">{confirmError}</p>
                    </div>
                  )}
                  <button
                    onClick={handleConfirm}
                    disabled={confirming}
                    className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
                  >
                    {confirming ? (
                      <>
                        <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Подтверждаем...
                      </>
                    ) : (
                      <>
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Подтвердить присутствие
                      </>
                    )}
                  </button>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Нажмите, чтобы зафиксировать ваш приход
                  </p>
                </>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
