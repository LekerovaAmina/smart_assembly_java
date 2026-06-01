import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api';

// ИСПРАВЛЕНО: Список типов приведён в соответствие с бэком (EventType enum)
// Убран SPORT (не существует), убран дубль VOLUNTEERING
const EVENT_TYPES = [
  { value: 'CONFERENCE',  label: 'Конференция' },
  { value: 'ROUNDTABLE',  label: 'Круглый стол' },
  { value: 'WORKSHOP',    label: 'Воркшоп' },
  { value: 'CHARITY',     label: 'Благотворительность' },
  { value: 'CULTURAL',    label: 'Культурное' },
  { value: 'EDUCATIONAL', label: 'Образовательное' },
  { value: 'OTHER',       label: 'Другое' },
];

export default function EventCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'EDUCATIONAL',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    location: '',
    dressCode: '',
    objectives: '',
    tasks: '',
    speakers: '',
    maxParticipants: 10,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'maxParticipants' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const cleanTime = (timeStr) => {
    if (!timeStr || timeStr.trim() === '') return null;
    const parts = timeStr.trim().split(':');
    const hours   = (parts[0] || '00').substring(0, 2).padStart(2, '0');
    const minutes = (parts[1] || '00').substring(0, 2).padStart(2, '0');
    const seconds = (parts[2] || '00').substring(0, 2).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleSubmit = async (e, targetStatus) => {
    if (e) e.preventDefault();

    if (!formData.eventName.trim()) {
      setError('Введите название мероприятия.');
      return;
    }
    if (targetStatus === 'OPEN' && (!formData.eventDate || !formData.startTime || !formData.location.trim())) {
      setError('Для публикации заполните: Дату, Время начала и Место проведения.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    const payload = {
      eventName:       formData.eventName.trim(),
      eventType:       formData.eventType,
      description:     formData.description.trim() || null,
      eventDate:       formData.eventDate || null,
      startTime:       cleanTime(formData.startTime),
      endTime:         cleanTime(formData.endTime),
      location:        formData.location.trim() || null,
      dressCode:       formData.dressCode.trim() || null,
      objectives:      formData.objectives.trim() || null,
      tasks:           formData.tasks.trim() || null,
      speakers:        formData.speakers
                         ? formData.speakers.split(',').map(s => s.trim()).filter(Boolean)
                         : [],
      maxParticipants: formData.maxParticipants || 1,
      status:          targetStatus,
    };

    try {
      await createEvent(payload);
      const textStatus = targetStatus === 'DRAFT' ? 'сохранено в черновики' : 'опубликовано';
      setSuccessMessage(`Мероприятие «${formData.eventName}» ${textStatus}!`);
      setTimeout(() => navigate('/events'), 1800);
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.message
        || err.response?.data?.errors?.map(e => e.message).join(', ')
        || 'Ошибка при сохранении';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      {/* Уведомление об успехе */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-green-50 border border-green-200 text-green-700 rounded-card px-4 py-3 text-sm shadow-xl flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <div className="bg-white p-6 rounded-card border border-border shadow-sm">
        <h1 className="text-2xl font-bold text-text-primary mb-6">Создание мероприятия</h1>

        {error && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
            {error}
          </div>
        )}

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          {/* Название + Тип */}
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Название <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="eventName"
                placeholder="например, Субботник в парке"
                value={formData.eventName}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="block text-sm font-medium text-gray-700 mb-1">Тип мероприятия</label>
              <select
                name="eventType"
                value={formData.eventType}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              >
                {EVENT_TYPES.map(({ value, label }) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Описание */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
            <textarea
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>

          {/* Дата + Время */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Дата <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                name="eventDate"
                value={formData.eventDate}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Начало <span className="text-red-500">*</span>
              </label>
              <input
                type="time"
                name="startTime"
                step="60"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Окончание</label>
              <input
                type="time"
                name="endTime"
                step="60"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Место + Дресс-код */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Место проведения <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                name="location"
                placeholder="Дом Дружбы, Астана"
                value={formData.location}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Дресс-код</label>
              <input
                type="text"
                name="dressCode"
                placeholder="Деловой стиль"
                value={formData.dressCode}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Цели + Задачи */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Цели</label>
              <input
                type="text"
                name="objectives"
                value={formData.objectives}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Задачи</label>
              <input
                type="text"
                name="tasks"
                value={formData.tasks}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Спикеры + Макс. участников */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Спикеры (через запятую)</label>
              <input
                type="text"
                name="speakers"
                placeholder="Айгерим, Данияр"
                value={formData.speakers}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Макс. участников <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                name="maxParticipants"
                min="1"
                value={formData.maxParticipants}
                onChange={handleChange}
                className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Кнопки */}
          <div className="flex items-center justify-between pt-4 border-t border-border">
            <button
              type="button"
              onClick={() => navigate('/events')}
              className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <div className="flex gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(null, 'DRAFT')}
                className="px-4 py-2 text-sm font-medium text-primary border border-primary hover:bg-orange-50 rounded-btn transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Сохранение...' : 'В черновики'}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={() => handleSubmit(null, 'OPEN')}
                className="px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-btn shadow-sm transition-colors disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Публикация...' : 'Опубликовать'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}