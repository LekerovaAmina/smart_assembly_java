import { useState, useEffect, useCallback } from 'react';
import { getAuditLogs } from '../api';

const ACTION_LABELS = {
  LOGIN: 'Вход в систему',
  ROLE_CHANGE: 'Смена роли',
  STATUS_CHANGE: 'Смена статуса',
  PASSWORD_RESET: 'Смена пароля',
  PROFILE_UPDATE: 'Изменение данных',
};

const ACTION_COLORS = {
  LOGIN: 'bg-gray-100 text-gray-600',
  ROLE_CHANGE: 'bg-orange-100 text-orange-700',
  STATUS_CHANGE: 'bg-red-100 text-red-600',
  PASSWORD_RESET: 'bg-blue-100 text-blue-700',
  PROFILE_UPDATE: 'bg-green-100 text-green-700',
};

function ActionBadge({ action }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-badge font-medium ${ACTION_COLORS[action] ?? 'bg-gray-100 text-gray-500'}`}>
      {ACTION_LABELS[action] ?? action}
    </span>
  );
}

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('ru-RU', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function AdminLogsPage() {
  const [logs, setLogs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [actionFilter, setActionFilter] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 30;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = { size: PAGE_SIZE, page };
      if (actionFilter) params.action = actionFilter;
      const res = await getAuditLogs(params);
      const data = res.data;
      setLogs(Array.isArray(data) ? data : (data?.content ?? []));
      setTotal(data?.totalElements ?? (Array.isArray(data) ? data.length : 0));
    } catch (e) {
      setError('Не удалось загрузить журнал действий');
    } finally {
      setLoading(false);
    }
  }, [actionFilter, page]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Журнал действий</h1>
          <p className="text-sm text-text-muted mt-1">Всего записей: {total}</p>
        </div>
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); setPage(0); }}
          className="border border-border rounded-btn px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white"
        >
          <option value="">Все действия</option>
          {Object.entries(ACTION_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm mb-4">{error}</div>
      )}

      <div className="bg-surface rounded-card border border-border overflow-hidden">
        <div className="grid grid-cols-12 gap-2 px-4 py-3 border-b border-border">
          <div className="col-span-2 text-xs text-text-muted font-medium">Дата</div>
          <div className="col-span-2 text-xs text-text-muted font-medium">Кто</div>
          <div className="col-span-2 text-xs text-text-muted font-medium">Действие</div>
          <div className="col-span-2 text-xs text-text-muted font-medium">Кому</div>
          <div className="col-span-4 text-xs text-text-muted font-medium">Детали</div>
        </div>

        {loading ? (
          <div className="divide-y divide-border animate-pulse">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                <div className="col-span-2 h-4 w-24 bg-gray-100 rounded" />
                <div className="col-span-2 h-4 w-24 bg-gray-100 rounded" />
                <div className="col-span-2 h-5 w-20 bg-gray-100 rounded-badge" />
                <div className="col-span-2 h-4 w-24 bg-gray-100 rounded" />
                <div className="col-span-4 h-4 w-32 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
        ) : logs.length === 0 ? (
          <div className="py-16 text-center text-text-muted text-sm">Записей пока нет</div>
        ) : (
          <div className="divide-y divide-border">
            {logs.map(l => (
              <div key={l.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center">
                <div className="col-span-2 text-xs text-text-secondary">{formatDate(l.createdAt)}</div>
                <div className="col-span-2">
                  <p className="text-sm text-text-primary">{l.actorName}</p>
                  <p className="text-xs text-text-muted">{l.actorRole}</p>
                </div>
                <div className="col-span-2">
                  <ActionBadge action={l.action} />
                </div>
                <div className="col-span-2 text-sm text-text-secondary">{l.targetName || '—'}</div>
                <div className="col-span-4 text-xs text-text-muted">{l.details || '—'}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}
            className="px-3 py-1.5 border border-border rounded text-sm text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            ← Назад
          </button>
          <span className="text-sm text-text-muted px-4">
            {page + 1} из {totalPages}
          </span>
          <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}
            className="px-3 py-1.5 border border-border rounded text-sm text-text-secondary hover:bg-gray-50 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">
            Вперёд →
          </button>
        </div>
      )}
    </div>
  );
}
