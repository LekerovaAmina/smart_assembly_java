import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserById_hr, updateUserProfile, updateUserRole, updateUserStatus, setUserPassword } from '../api';

const ROLE_OPTIONS = [
  { value: 'VOLUNTEER', label: 'Волонтёр' },
  { value: 'COORDINATOR', label: 'Координатор' },
  { value: 'HR', label: 'HR' },
  { value: 'SUPER_ADMIN', label: 'Супер-админ' },
  { value: 'MEMBER', label: 'Участник' },
];

const STATUS_OPTIONS = [
  { value: 'ACTIVE', label: 'Активен' },
  { value: 'INACTIVE', label: 'Неактивен' },
  { value: 'BANNED', label: 'Заблокирован' },
];

function Field({ label, value, onChange, type = 'text' }) {
  return (
    <div>
      <label className="block text-xs text-text-muted uppercase tracking-wide mb-1.5">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        className="w-full px-3 py-2 border border-border rounded-btn text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
      />
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  const [form, setForm] = useState({ firstName: '', lastName: '', middleName: '', email: '', phone: '' });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState(null);

  const [role, setRole] = useState('VOLUNTEER');
  const [roleSaving, setRoleSaving] = useState(false);
  const [roleMsg, setRoleMsg] = useState(null);

  const [status, setStatus] = useState('ACTIVE');
  const [statusSaving, setStatusSaving] = useState(false);
  const [statusMsg, setStatusMsg] = useState(null);

  const [newPassword, setNewPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMsg, setPasswordMsg] = useState(null);

  const fetchUser = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const res = await getUserById_hr(id);
      const u = res.data;
      setUser(u);
      setForm({
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        middleName: u.middleName || '',
        email: u.email || '',
        phone: u.phone || '',
      });
      setRole(u.role || 'VOLUNTEER');
      setStatus(u.status && STATUS_OPTIONS.some(o => o.value === u.status) ? u.status : 'ACTIVE');
    } catch (e) {
      setLoadError('Не удалось загрузить пользователя');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchUser(); }, [fetchUser]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMsg(null);
    try {
      const res = await updateUserProfile(id, form);
      setUser(res.data);
      setProfileMsg({ type: 'success', text: 'Данные сохранены' });
    } catch (err) {
      setProfileMsg({ type: 'error', text: err?.response?.data?.message || 'Ошибка сохранения' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSaveRole = async () => {
    setRoleSaving(true);
    setRoleMsg(null);
    try {
      const res = await updateUserRole(id, role);
      setUser(res.data);
      setRoleMsg({ type: 'success', text: 'Роль обновлена' });
    } catch (err) {
      setRoleMsg({ type: 'error', text: err?.response?.data?.message || 'Ошибка' });
    } finally {
      setRoleSaving(false);
    }
  };

  const handleSaveStatus = async () => {
    setStatusSaving(true);
    setStatusMsg(null);
    try {
      const res = await updateUserStatus(id, status);
      setUser(res.data);
      setStatusMsg({ type: 'success', text: 'Статус обновлён' });
    } catch (err) {
      setStatusMsg({ type: 'error', text: err?.response?.data?.message || 'Ошибка' });
    } finally {
      setStatusSaving(false);
    }
  };

  const handleSetPassword = async (e) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setPasswordMsg({ type: 'error', text: 'Минимум 6 символов' });
      return;
    }
    setPasswordSaving(true);
    setPasswordMsg(null);
    try {
      await setUserPassword(id, newPassword);
      setPasswordMsg({ type: 'success', text: 'Пароль изменён' });
      setNewPassword('');
    } catch (err) {
      setPasswordMsg({ type: 'error', text: err?.response?.data?.message || 'Ошибка' });
    } finally {
      setPasswordSaving(false);
    }
  };

  if (loading) return (
    <div className="animate-pulse space-y-4 max-w-2xl">
      <div className="h-8 w-48 bg-gray-200 rounded" />
      <div className="h-48 bg-gray-100 rounded-card" />
    </div>
  );

  if (loadError) return (
    <div className="bg-red-50 border border-red-200 text-red-700 rounded-card px-4 py-3 text-sm">{loadError}</div>
  );

  if (!user) return null;

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/admin/users')}
        className="text-xs text-text-muted hover:text-primary mb-4 inline-flex items-center gap-1 transition-colors cursor-pointer">
        ← К списку пользователей
      </button>

      <h1 className="text-2xl font-bold text-text-primary mb-1">
        {user.lastName} {user.firstName}
      </h1>
      <p className="text-sm text-text-muted mb-6">{user.uniqueId || `ID ${user.id}`}</p>

      <div className="space-y-6">
        {/* Данные профиля */}
        <form onSubmit={handleSaveProfile} className="bg-surface rounded-card border border-border p-5 space-y-4">
          <h3 className="text-sm font-semibold text-text-primary">Данные пользователя</h3>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Имя" value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} />
            <Field label="Фамилия" value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} />
          </div>
          <Field label="Отчество" value={form.middleName} onChange={e => setForm(f => ({ ...f, middleName: e.target.value }))} />
          <Field label="Email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
          <Field label="Телефон" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
          {profileMsg && (
            <p className={`text-sm px-3 py-2 rounded-btn ${profileMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {profileMsg.text}
            </p>
          )}
          <button type="submit" disabled={profileSaving}
            className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-btn transition-colors disabled:opacity-60 cursor-pointer">
            {profileSaving ? 'Сохраняем...' : 'Сохранить данные'}
          </button>
        </form>

        {/* Роль */}
        <div className="bg-surface rounded-card border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Роль</h3>
          <div className="flex gap-2">
            <select value={role} onChange={e => setRole(e.target.value)}
              className="flex-1 border border-border rounded-btn px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white">
              {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={handleSaveRole} disabled={roleSaving}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-btn transition-colors disabled:opacity-60 cursor-pointer">
              {roleSaving ? '...' : 'Сохранить'}
            </button>
          </div>
          {roleMsg && (
            <p className={`text-sm px-3 py-2 rounded-btn ${roleMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {roleMsg.text}
            </p>
          )}
        </div>

        {/* Статус (блокировка = "удаление" без потери истории) */}
        <div className="bg-surface rounded-card border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Статус аккаунта</h3>
          <p className="text-xs text-text-muted -mt-2">
            «Заблокирован» и «Неактивен» запрещают вход — это безопасная замена удалению, история часов и страйков сохраняется.
          </p>
          <div className="flex gap-2">
            <select value={status} onChange={e => setStatus(e.target.value)}
              className="flex-1 border border-border rounded-btn px-3 py-2 text-sm focus:outline-none focus:border-primary bg-white">
              {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <button onClick={handleSaveStatus} disabled={statusSaving}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-btn transition-colors disabled:opacity-60 cursor-pointer">
              {statusSaving ? '...' : 'Сохранить'}
            </button>
          </div>
          {statusMsg && (
            <p className={`text-sm px-3 py-2 rounded-btn ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {statusMsg.text}
            </p>
          )}
        </div>

        {/* Пароль */}
        <form onSubmit={handleSetPassword} className="bg-surface rounded-card border border-border p-5 space-y-3">
          <h3 className="text-sm font-semibold text-text-primary">Сменить пароль</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              placeholder="Новый пароль (мин. 6 символов)"
              className="flex-1 border border-border rounded-btn px-3 py-2 text-sm focus:outline-none focus:border-primary"
            />
            <button type="submit" disabled={passwordSaving}
              className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-sm font-medium rounded-btn transition-colors disabled:opacity-60 cursor-pointer">
              {passwordSaving ? '...' : 'Установить'}
            </button>
          </div>
          {passwordMsg && (
            <p className={`text-sm px-3 py-2 rounded-btn ${passwordMsg.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {passwordMsg.text}
            </p>
          )}
        </form>
      </div>
    </div>
  );
}
