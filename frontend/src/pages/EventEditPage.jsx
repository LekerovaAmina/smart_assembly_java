import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getEventById, updateEvent } from '../api';

export default function EventEditPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    eventName: '',
    description: '',
    eventDate: '',
    startTime: '',
    endTime: '',
    location: '',
    dressCode: '',
    objectives: '',
    tasks: '',
    speakers: '',
    maxParticipants: ''
  });

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchEventData = async () => {
      try {
        const res = await getEventById(id);
        const data = res.data;
        setFormData({
          eventName: data.eventName || '',
          description: data.description || '',
          eventDate: data.eventDate || '',
          startTime: data.startTime ? data.startTime.substring(0, 5) : '',
          endTime: data.endTime ? data.endTime.substring(0, 5) : '',
          location: data.location || '',
          dressCode: data.dressCode || '',
          objectives: data.objectives || '',
          tasks: data.tasks || '',
          speakers: Array.isArray(data.speakers) ? data.speakers.join(', ') : data.speakers || '',
          maxParticipants: data.maxParticipants || ''
        });
      } catch (err) {
        console.error(err);
        setError('Не удалось загрузить данные мероприятия');
      } finally {
        setLoading(false);
      }
    };
    fetchEventData();
  }, [id]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Идеальный нормализатор времени под java.time.LocalTime (строго HH:mm:ss)
      const cleanTime = (timeStr) => {
        if (!timeStr || timeStr.trim() === '') return null;

        // Отрезаем всё лишнее, если строка содержит миллисекунды или лишние двоеточия
        const parts = timeStr.trim().split(':');
        let hours = parts[0] || '00';
        let minutes = parts[1] || '00';
        let seconds = parts[2] || '00';

        // Берем только первые две цифры для каждого компонента
        hours = hours.substring(0, 2).padStart(2, '0');
        minutes = minutes.substring(0, 2).padStart(2, '0');
        seconds = seconds.substring(0, 2).padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
      };

      // Превращаем строку спикеров в массив
      let speakersArray = null;
      if (formData.speakers && formData.speakers.trim() !== '') {
        speakersArray = formData.speakers
          .split(',')
          .map(s => s.trim())
          .filter(s => s !== '');
      }

      // Формируем чистый DTO для CreateEventRequest
// Формируем чистый DTO для CreateEventRequest
      const formattedData = {
        eventName: formData.eventName ? formData.eventName.trim() : '',

        // ИСПРАВЛЕНИЕ: Передаем CULTURAL (или OTHER), так как бэк не знает слова CULTURE
        eventType: formData.eventType || 'CULTURAL',

        description: formData.description ? formData.description.trim() : '',
        eventDate: formData.eventDate || null,
        startTime: cleanTime(formData.startTime),
        endTime: cleanTime(formData.endTime),
        location: formData.location && formData.location.trim() ? formData.location.trim() : null,
        dressCode: formData.dressCode && formData.dressCode.trim() ? formData.dressCode.trim() : null,
        objectives: formData.objectives && formData.objectives.trim() ? formData.objectives.trim() : null,
        tasks: formData.tasks && formData.tasks.trim() ? formData.tasks.trim() : null,
        maxParticipants: formData.maxParticipants ? Number(formData.maxParticipants) : null,
        speakers: speakersArray,
        coordinatorId: formData.coordinatorId || null,
        status: formData.status || 'DRAFT'
      };

      console.log("Отправляем данные на бэк:", formattedData); // Чтобы ты видел структуру в консоли

      await updateEvent(id, formattedData);
      alert('Изменения успешно сохранены!');
      navigate(`/events/${id}`);
    } catch (err) {
      console.error("Полная ошибка запроса:", err);

      // Если бэк вернул детали валидации (например, список нарушенных полей)
      const serverValidationError = err.response?.data?.errors
        ? JSON.stringify(err.response.data.errors)
        : null;

      const errorMessage = err.response?.data?.message || serverValidationError || JSON.stringify(err.response?.data) || err.message;

      alert(`Ошибка при сохранении: ${errorMessage}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-6 animate-pulse">Загрузка формы...</div>;
  if (error) return <div className="p-6 text-red-600">{error}</div>;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
        <h1 className="text-xl font-bold text-gray-900 mb-6">Редактирование черновика</h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Название мероприятия *</label>
            <input
              type="text"
              name="eventName"
              required
              value={formData.eventName}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Описание *</label>
            <textarea
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Дата *</label>
              <input
                type="date"
                name="eventDate"
                required
                value={formData.eventDate}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Время начала</label>
              <input
                type="text"
                name="startTime"
                placeholder="14:00"
                value={formData.startTime}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Время окончания</label>
              <input
                type="text"
                name="endTime"
                placeholder="16:00"
                value={formData.endTime}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Место проведения</label>
            <input
              type="text"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Макс. участников</label>
              <input
                type="number"
                name="maxParticipants"
                value={formData.maxParticipants}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">Дресс-код</label>
              <input
                type="text"
                name="dressCode"
                value={formData.dressCode}
                onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">Спикеры (через запятую)</label>
            <input
              type="text"
              name="speakers"
              value={formData.speakers}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
            >
              Отмена
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'Сохранение...' : 'Сохранить изменения'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}