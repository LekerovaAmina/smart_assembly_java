import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createEvent } from '../api';

export default function EventCreatePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null); // Состояние для уведомления успеха

  // Запоминаем, какую кнопку нажал пользователь перед сабмитом формы
  const [clickedStatus, setClickedStatus] = useState('DRAFT');

  const [formData, setFormData] = useState({
    eventName: '',
    eventType: 'EDUCATIONAL',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    location: 'Дом Дружбы',
    dressCode: 'Классика',
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

// Теперь это единый обработчик для всей формы
  const handleSubmit = async (e, targetStatus) => {
    if (e) e.preventDefault(); // Отменяем стандартный сабмит HTML

    // Проверяем обязательные поля вручную только для публикации
    if (targetStatus === 'OPEN' && (!formData.eventName || !formData.eventDate || !formData.startTime)) {
      setError('Для публикации мероприятия обязательно заполните Название, Дату и Время начала!');
      return;
    }

    // Для черновика обязательным сделаем только название
    if (targetStatus === 'DRAFT' && !formData.eventName) {
      setError('Введите хотя бы название мероприятия, чтобы сохранить его в черновики.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    // Идеальный нормализатор времени под java.time.LocalTime (строго HH:mm:ss)
    const cleanTime = (timeStr) => {
      if (!timeStr || timeStr.trim() === '') return null;

      const parts = timeStr.trim().split(':');
      let hours = parts[0] || '00';
      let minutes = parts[1] || '00';
      let seconds = parts[2] || '00';

      hours = hours.substring(0, 2).padStart(2, '0');
      minutes = minutes.substring(0, 2).padStart(2, '0');
      seconds = seconds.substring(0, 2).padStart(2, '0');

      return `${hours}:${minutes}:${seconds}`;
    };

    // Если поля даты/времени пустые, отправляем null или отформатированное время
    const payload = {
      ...formData,
      eventDate: formData.eventDate || null,
      startTime: cleanTime(formData.startTime),
      endTime: cleanTime(formData.endTime),
      status: targetStatus, // "DRAFT" или "OPEN"
      speakers: formData.speakers ? formData.speakers.split(',').map(s => s.trim()).filter(Boolean) : [],
      currentParticipants: 0,
      qrCodeData: null,
    };

    console.log("Фронтенд отправляет JSON в БД на создание:", payload);

    try {
      await createEvent(payload);

      const textStatus = targetStatus === 'DRAFT' ? 'в черновики' : 'и успешно опубликовано';
      setSuccessMessage(`Мероприятие "${formData.eventName}" сохранено ${textStatus}!`);

      setTimeout(() => {
        const targetTab = targetStatus === 'DRAFT' ? 'drafts' : 'published';
        navigate('/events', { state: { defaultTab: targetTab } });
      }, 2000);

    } catch (err) {
      console.error("Ошибка запроса:", err);
      setError(err.response?.data?.message || 'Ошибка бэкенда при сохранении. Проверь консоль Spring Boot.');
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="max-w-2xl mx-auto bg-white p-6 rounded-card border border-border shadow-sm relative">

      {/* УВЕДОМЛЕНИЕ ОБ УСПЕХЕ */}
      {successMessage && (
        <div className="fixed top-6 right-6 z-50 bg-green-50 border border-green-200 text-green-700 rounded-card px-4 py-3 text-sm shadow-xl flex items-center gap-2 animate-fade-in">
          <span className="w-2 h-2 rounded-full bg-green-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* УВЕДОМЛЕНИЕ ОБ ОШИБКЕ */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      <h1 className="text-2xl font-bold text-text-primary mb-6">Создание нового мероприятия</h1>

      {/* Навешиваем onSubmit на саму форму! */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Название мероприятия *</label>
            <input
              type="text"
              name="eventName"
              required
              placeholder="например, Тест-12"
              value={formData.eventName}
              onChange={handleChange}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Тип события</label>
            <select
              name="eventType"
              value={formData.eventType}
              onChange={handleChange}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            >
              <option value="EDUCATIONAL">EDUCATIONAL</option>
              <option value="CULTURAL">CULTURAL</option>
              <option value="VOLUNTEER">VOLUNTEER</option>
              <option value="SPORT">SPORT</option>
            </select>
          </div>
        </div>

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

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Дата *</label>
            <input
              type="date"
              name="eventDate"
              required
              value={formData.eventDate}
              onChange={handleChange}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Время начала *</label>
            <input
              type="time"
              name="startTime"
              step="1"
              required
              value={formData.startTime}
              onChange={handleChange}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Время окончания *</label>
            <input
              type="time"
              name="endTime"
              step="1"
              required
              value={formData.endTime}
              onChange={handleChange}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Место проведения</label>
            <input
              type="text"
              name="location"
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
              value={formData.dressCode}
              onChange={handleChange}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Спикеры (через запятую)</label>
            <input
              type="text"
              name="speakers"
              placeholder="Лариса, Димаш"
              value={formData.speakers}
              onChange={handleChange}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Макс. участников</label>
            <input
              type="number"
              name="maxParticipants"
              value={formData.maxParticipants}
              onChange={handleChange}
              className="w-full border border-border rounded px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
          </div>
        </div>

        {/* НИЖНЯЯ ПАНЕЛЬ С КНОПКАМИ */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-3 pt-6 border-t border-border mt-6">
          <button
            type="button"
            onClick={() => navigate('/events')}
            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 transition-colors"
          >
            Отмена
          </button>

          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            {/* КНОПКА ЧЕРНОВИКА */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(null, 'DRAFT')}
              className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-primary border border-primary hover:bg-blue-50 rounded-btn transition-colors disabled:opacity-50 cursor-pointer text-center"
            >
              {loading ? 'Сохранение...' : 'В черновики'}
            </button>

            {/* КНОПКА ПУБЛИКАЦИИ */}
            <button
              type="button"
              disabled={loading}
              onClick={() => handleSubmit(null, 'OPEN')}
              className="w-full sm:w-auto px-5 py-2 text-sm font-medium text-white bg-primary hover:bg-primary-hover rounded-btn transition-colors shadow-sm disabled:opacity-50 cursor-pointer text-center"
            >
              {loading ? 'Публикация...' : 'Опубликовать'}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}