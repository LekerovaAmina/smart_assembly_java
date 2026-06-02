import { useState, useEffect, useCallback } from 'react';
import { getMyHoursHistory, getMyHours } from '../api';

const TYPE_LABELS = {
  EVENT: 'Мероприятие',
  MANUAL_ADJUSTMENT: 'Корректировка',
  PENALTY: 'Штраф',
};

const TYPE_COLORS = {
  EVENT: 'bg-blue-100 text-blue-700',
  MANUAL_ADJUSTMENT: 'bg-green-100 text-green-700',
  PENALTY: 'bg-red-100 text-red-700',
};

function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
  } catch { return '—'; }
}

function TransactionRow({ item }) {
  const hours = parseFloat(item.hoursDelta ?? item.hours ?? 0);
  const isPositive = hours >= 0;
  const type = item.type ?? (isPositive ? 'EVENT' : 'PENALTY');

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0 gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className={`text-xs font-medium px-2 py-0.5 rounded-badge flex-shrink-0 ${
          TYPE_COLORS[type] ?? 'bg-gray-100 text-gray-600'
        }`}>
          {TYPE_LABELS[type] ?? type}
        </span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-text-primary truncate">
            {item.eventName ?? item.title ?? item.reason ?? '—'}
          </p>
          {(item.reason ?? item.note) && item.eventName && (
            <p className="text-xs text-text-muted truncate">{item.reason ?? item.note}</p>
          )}
          {item.createdBy && (
            <p className="text-xs text-text-muted">Корректировал: {item.createdBy}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4 flex-shrink-0">
        <span className="text-xs text-text-muted">{formatDate(item.createdAt ?? item.date)}</span>
        <span className={`text-sm font-bold min-w-[52px] text-right ${
          isPositive ? 'text-green-600' : 'text-red-500'
        }`}>
          {isPositive ? '+' : ''}{hours.toFixed(2)}ч
        </span>
      </div>
    </div>
  );
}

export default function StatisticsPage() {
  const [summary, setSummary] = useState(null);
  const [history, setHistory] = useState([]);
  const [totalElements, setTotalElements] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Фильтры
  const [typeFilter, setTypeFilter] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 20;

  const fetchSummary = useCallback(async () => {
    try {
      const res = await getMyHours();
      setSummary(res.data);
    } catch { /* тихо */ }
  }, []);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { page, size: PAGE_SIZE, sort: 'createdAt,desc' };
      if (typeFilter) params.type = typeFilter;
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const res = await getMyHoursHistory(params);
      const data = res.data;

      // Бэк может вернуть Page<> или массив
      if (Array.isArray(data)) {
        setHistory(data);
        setTotalElements(data.length);
      } else {
        setHistory(data?.content ?? []);
        setTotalElements(data?.totalElements ?? 0);
      }
    } catch {
      // Если history endpoint недоступен — используем breakdown из summary
      if (summary?.breakdown) {
        setHistory(summary.breakdown);
        setTotalElements(summary.breakdown.length);
      } else {
        setError('Не удалось загрузить историю часов');
      }
    } finally {
      setLoading(false);
    }
  }, [page, typeFilter, dateFrom, dateTo, summary]);

  useEffect(() => { fetchSummary(); }, [fetchSummary]);
  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleFilterReset = () => {
    setTypeFilter('');
    setDateFrom('');
    setDateTo('');
    setPage(0);
  };

  const handleApplyFilter = () => {
    setPage(0);
    fetchHistory();
  };

  const totalHours = parseFloat(summary?.totalHours ?? 0);
  const totalPages = Math.ceil(totalElements / PAGE_SIZE);

  // Считаем часы за текущий месяц из breakdown
  const now = new Date();
  const monthHours = (summary?.breakdown ?? [])
    .filter(item => {
      if (!item.date) return false;
      const d = new Date(item.date);
      return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
    })
    .reduce((sum, item) => sum + Math.max(0, parseFloat(item.hours) || 0), 0);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-text-primary">Статистика часов</h1>
        <p className="text-sm text-text-muted mt-1">Полная история начислений и корректировок</p>
      </div>

      {/* Общая статистика */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-card border border-border p-5 text-center">
          <p className="text-4xl font-bold text-primary">{totalHours.toFixed(1)}</p>
          <p className="text-xs text-text-muted mt-1">Всего часов</p>
        </div>
        <div className="bg-white rounded-card border border-border p-5 text-center">
          <p className="text-4xl font-bold text-text-primary">{monthHours.toFixed(1)}</p>
          <p className="text-xs text-text-muted mt-1">За текущий месяц</p>
        </div>
        <div className="bg-white rounded-card border border-border p-5 text-center">
          <p className="text-4xl font-bold text-text-secondary">{totalElements}</p>
          <p className="text-xs text-text-muted mt-1">Записей</p>
        </div>
      </div>

      {/* Фильтры */}
      <div className="bg-white rounded-card border border-border p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs text-text-muted mb-1">Тип</label>
            <select
              value={typeFilter}
              onChange={e => setTypeFilter(e.target.value)}
              className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="">Все</option>
              <option value="EVENT">Мероприятия</option>
              <option value="MANUAL_ADJUSTMENT">Корректировки</option>
              <option value="PENALTY">Штрафы</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">С даты</label>
            <input
              type="date"
              value={dateFrom}
              onChange={e => setDateFrom(e.target.value)}
              className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1">По дату</label>
            <input
              type="date"
              value={dateTo}
              onChange={e => setDateTo(e.target.value)}
              className="border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <button
            onClick={handleApplyFilter}
            className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-btn hover:bg-primary-hover transition-colors cursor-pointer"
          >
            Применить
          </button>
          {(typeFilter || dateFrom || dateTo) && (
            <button
              onClick={handleFilterReset}
              className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-btn hover:bg-gray-200 transition-colors cursor-pointer"
            >
              Сбросить
            </button>
          )}
        </div>
      </div>

      {/* Таблица истории */}
      <div className="bg-white rounded-card border border-border overflow-hidden">
        <div className="px-5 py-3 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold text-text-primary">История</h2>
          {totalElements > 0 && (
            <span className="text-xs text-text-muted">{totalElements} записей</span>
          )}
        </div>

        <div className="px-5">
          {error && (
            <div className="py-4 text-sm text-red-600">{error}</div>
          )}

          {loading ? (
            <div className="py-4 space-y-3 animate-pulse">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="flex justify-between py-3 border-b border-border">
                  <div className="flex gap-3">
                    <div className="h-5 w-20 bg-gray-100 rounded-badge" />
                    <div className="h-5 w-40 bg-gray-100 rounded" />
                  </div>
                  <div className="h-5 w-12 bg-gray-100 rounded" />
                </div>
              ))}
            </div>
          ) : history.length === 0 ? (
            <div className="py-12 text-center text-text-muted text-sm">
              {(typeFilter || dateFrom || dateTo)
                ? 'Нет записей по выбранным фильтрам'
                : 'История пуста'}
            </div>
          ) : (
            <div>
              {history.map((item, i) => (
                <TransactionRow key={item.id ?? i} item={item} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Пагинация */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
            className="px-3 py-1.5 border border-border rounded text-sm text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ← Назад
          </button>
          <span className="text-sm text-text-muted px-4">
            {page + 1} из {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
            className="px-3 py-1.5 border border-border rounded text-sm text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}