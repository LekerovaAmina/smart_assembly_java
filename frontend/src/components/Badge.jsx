const TYPE_COLORS = {
  VOLUNTEER:   'bg-orange-100 text-orange-700',
  VOLUNTEERING:'bg-orange-100 text-orange-700',
  CONFERENCE:  'bg-blue-100 text-blue-700',
  ROUNDTABLE:  'bg-purple-100 text-purple-700',
  WORKSHOP:    'bg-green-100 text-green-700',
  CHARITY:     'bg-pink-100 text-pink-700',
  CULTURAL:    'bg-yellow-100 text-yellow-700',
  OTHER:       'bg-gray-100 text-gray-600',
};

const TYPE_LABELS = {
  VOLUNTEER:    'Волонтёрство',
  VOLUNTEERING: 'Волонтёрство',
  CONFERENCE:   'Конференция',
  ROUNDTABLE:   'Круглый стол',
  WORKSHOP:     'Воркшоп',
  CHARITY:      'Благотворительность',
  CULTURAL:     'Культурное',
  OTHER:        'Другое',
};

export default function Badge({ type, label, className = '' }) {
  const colorClass = TYPE_COLORS[type?.toUpperCase()] ?? 'bg-gray-100 text-gray-600';
  const displayLabel = label ?? TYPE_LABELS[type?.toUpperCase()] ?? type ?? 'Другое';

  return (
    <span
      className={`inline-block text-xs font-medium px-2.5 py-1 rounded-badge ${colorClass} ${className}`}
    >
      {displayLabel}
    </span>
  );
}
