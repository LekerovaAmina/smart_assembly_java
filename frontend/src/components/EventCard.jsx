import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Badge from './Badge';
import { registerEvent, unregisterEvent } from '../api';

const CalendarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1 flex-shrink-0">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
    <line x1="16" y1="2" x2="16" y2="6" />
    <line x1="8" y1="2" x2="8" y2="6" />
    <line x1="3" y1="10" x2="21" y2="10" />
  </svg>
);

const PinIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="inline-block mr-1 flex-shrink-0">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

function formatDate(dateStr) {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${day}.${month}.${year} · ${hh}:${mm}`;
  } catch {
    return dateStr;
  }
}

export default function EventCard({ event, onUpdate }) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(event?.isRegistered ?? false);

  const handleRegister = async (e) => {
    e.stopPropagation();
    setLoading(true);
    try {
      if (registered) {
        await unregisterEvent(event.id);
        setRegistered(false);
      } else {
        await registerEvent(event.id);
        setRegistered(true);
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="bg-surface rounded-card border border-border p-4 flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow duration-150"
      onClick={() => navigate(`/events/${event.id}`)}
    >
      <div>
        <Badge type={event.type} />
      </div>

      <div>
        <h3 className="text-base font-semibold text-text-primary leading-snug line-clamp-2">
          {event.title || event.name || 'Без названия'}
        </h3>
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-sm text-text-secondary flex items-center">
          <CalendarIcon />
          {formatDate(event.startDate || event.date || event.startTime)}
        </span>
        {event.location && (
          <span className="text-sm text-text-secondary flex items-center">
            <PinIcon />
            {event.location}
          </span>
        )}
      </div>

      <button
        onClick={handleRegister}
        disabled={loading}
        className={`w-full py-2 rounded-btn text-sm font-medium transition-colors duration-150 mt-auto ${
          registered
            ? 'bg-gray-200 text-text-secondary hover:bg-gray-300'
            : 'bg-primary text-white hover:bg-primary-hover'
        } disabled:opacity-60 disabled:cursor-not-allowed`}
      >
        {loading ? '...' : registered ? 'Отменить участие' : 'Откликнуться'}
      </button>
    </div>
  );
}
