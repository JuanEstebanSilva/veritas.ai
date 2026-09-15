import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import { AdminStats, AdminUserListItem } from '../types';
import { CountUp } from '../motion';
import { Crown, UserPlus, Edit2, Trash2, Power, Search, CheckCircle, AlertCircle, X } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState({ name: '', last_name: '', email: '', password: '', is_premium: false, is_active: true });

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    const [statsRes, usersRes] = await Promise.all([adminApi.getStats(), adminApi.getAllUsers()]);
    if (statsRes.data?.stats) setStats(statsRes.data.stats);
    if (usersRes.data?.users) setUsers(usersRes.data.users);
    else if (usersRes.error) setError(usersRes.error);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const openCreateModal = () => {
    setEditingUserId(null);
    setModalForm({ name: '', last_name: '', email: '', password: '', is_premium: false, is_active: true });
    setIsModalOpen(true);
  };
  const openEditModal = (u: AdminUserListItem) => {
    setEditingUserId(u.id);
    setModalForm({ name: u.name, last_name: u.last_name, email: u.email, password: '', is_premium: u.is_premium, is_active: u.is_active });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!modalForm.name || !modalForm.last_name || !modalForm.email) { setError('Por favor completa todos los campos requeridos.'); return; }
    if (!editingUserId && (!modalForm.password || modalForm.password.length < 8)) { setError('La contraseña inicial debe contener al menos 8 caracteres.'); return; }

    if (editingUserId) {
      const res = await adminApi.updateUser(editingUserId, {
        name: modalForm.name, last_name: modalForm.last_name, email: modalForm.email,
        is_active: modalForm.is_active, is_premium: modalForm.is_premium,
        ...(modalForm.password ? { password: modalForm.password } : {}),
      });
      if (res.data?.success) { setSuccessMessage('Usuario actualizado correctamente.'); setIsModalOpen(false); fetchData(); }
      else setError(res.error || 'Error al actualizar usuario.');
    } else {
      const res = await adminApi.createUser({
        name: modalForm.name, last_name: modalForm.last_name, email: modalForm.email, password: modalForm.password, is_premium: modalForm.is_premium,
      });
      if (res.data?.success) { setSuccessMessage('Usuario creado exitosamente.'); setIsModalOpen(false); fetchData(); }
      else setError(res.error || 'Error al crear usuario.');
    }
    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleToggleActive = async (id: string) => {
    const res = await adminApi.toggleActive(id);
    if (res.data?.success) setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_active: res.data!.user.is_active } : u)));
    else alert(res.error || 'No se pudo cambiar el estado del usuario.');
  };
  const handleTogglePremium = async (id: string) => {
    const res = await adminApi.togglePremium(id);
    if (res.data?.success) {
      setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, is_premium: res.data!.user.is_premium, premium_since: res.data!.user.premium_since } : u)));
      fetchData();
    } else alert(res.error || 'No se pudo actualizar el estado Premium.');
  };
  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario ${name}?`)) return;
    const res = await adminApi.deleteUser(id);
    if (res.data?.success) { setUsers((prev) => prev.filter((u) => u.id !== id)); fetchData(); }
    else alert(res.error || 'No se pudo eliminar el usuario.');
  };

  const filteredUsers = users.filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const Stat: React.FC<{ label: string; value: number; tone?: string }> = ({ label, value, tone = 'text-hi' }) => (
    <div className="flex flex-col gap-2 py-5 pr-6 border-r hair last:border-r-0">
      <span className="eyebrow">{label}</span>
      <span className={`text-[34px] leading-none ${tone}`}><CountUp value={value} /></span>
    </div>
  );

  return (
    <div className="max-w-[1180px] flex flex-col gap-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-3">
          <span className="eyebrow text-gold">Administración</span>
          <h1 className="text-d-4 font-light">Usuarios <span className="serif text-gold">y métricas.</span></h1>
          <p className="text-[14px] text-low">Supervisa la actividad y administra las cuentas.</p>
        </div>
        <button type="button" onClick={openCreateModal} className="btn btn-primary btn-sm"><UserPlus className="w-4 h-4" strokeWidth={1.8} /> Nuevo usuario</button>
      </div>

      {successMessage && (
        <div className="flex items-center gap-3 py-3.5 border-y border-human/30 text-[13px] text-human animate-page-in"><CheckCircle className="w-4 h-4" strokeWidth={1.8} /><span>{successMessage}</span></div>
      )}
      {error && (
        <div className="flex items-center gap-3 py-3.5 border-y border-ai/30 text-[13px] text-ai animate-page-in"><AlertCircle className="w-4 h-4" strokeWidth={1.8} /><span>{error}</span></div>
      )}

      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-6 border-y hair">
          <Stat label="Usuarios" value={stats.totalUsers} />
          <Stat label="Premium" value={stats.premiumUsers} tone="text-gold" />
          <Stat label="Gratuitos" value={stats.freeUsers} tone="text-azure" />
          <Stat label="Análisis hoy" value={stats.analysesToday} tone="text-human" />
          <Stat label="Análisis totales" value={stats.totalAnalyses} />
        </div>
      )}

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-[17px] font-semibold">Directorio <span className="text-low font-normal">· {filteredUsers.length}</span></h3>
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none" strokeWidth={1.6} />
            <input id="admin-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o correo" className="field h-11 pl-11 text-[13.5px]" />
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-[13px] text-mid">Cargando usuarios…</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b hair-2">
                  {['Usuario', 'Rol', 'Estado', 'Licencia', 'Análisis', 'Registro', ''].map((h, i) => (
                    <th key={i} className={`eyebrow font-bold py-3.5 ${i === 0 ? 'pl-1' : ''} ${i === 6 ? 'text-right pr-1' : 'pr-3'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isSelf = currentAdmin?.id === u.id;
                  return (
                    <tr key={u.id} className="group border-b hair hover:bg-hair transition-colors duration-450">
                      <td className="py-4 pl-1 pr-4">
                        <span className="flex flex-col gap-0.5">
                          <span className="text-[13.5px] font-semibold text-hi">{u.fullName} {isSelf && <span className="text-[11px] text-azure font-normal">(tú)</span>}</span>
                          <span className="font-mono text-[11px] text-low">{u.email}</span>
                        </span>
                      </td>
                      <td className="py-4 pr-3"><span className={`text-[11px] font-bold uppercase tracking-[0.14em] ${u.role === 'ADMIN' ? 'text-gold' : 'text-low'}`}>{u.role === 'ADMIN' ? 'Admin' : 'Usuario'}</span></td>
                      <td className="py-4 pr-3">
                        <span className={`inline-flex items-center gap-2.5 text-[12.5px] font-semibold ${u.is_active ? 'text-human' : 'text-ai'}`}>
                          <span className="status-dot" style={{ color: `rgb(var(--${u.is_active ? 'human' : 'ai'}) / .18)`, background: `rgb(var(--${u.is_active ? 'human' : 'ai'}))` }} />
                          {u.is_active ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>
                      <td className="py-4 pr-3">
                        {u.is_premium ? <span className="inline-flex items-center gap-2 text-[12.5px] font-semibold text-gold"><Crown className="w-3.5 h-3.5" strokeWidth={1.8} /> Vitalicia</span> : <span className="text-[12.5px] text-low">Gratuita</span>}
                      </td>
                      <td className="py-4 pr-3"><span className="num text-[13px] text-hi">{u.totalAnalyses}</span> <span className="font-mono text-[11px] text-low">· {u.dailyAnalysisCount}/5 hoy</span></td>
                      <td className="py-4 pr-3 font-mono text-[11.5px] text-low whitespace-nowrap">{new Date(u.createdAt).toLocaleDateString('es-ES')}</td>
                      <td className="py-4 pr-1 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                          <button type="button" disabled={isSelf} onClick={() => handleToggleActive(u.id)} title={u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'} className={`p-2 rounded-full transition-colors disabled:opacity-30 ${u.is_active ? 'text-low hover:text-mixed hover:bg-mixed/10' : 'text-human hover:bg-human/10'}`}><Power className="w-4 h-4" strokeWidth={1.7} /></button>
                          <button type="button" onClick={() => handleTogglePremium(u.id)} title={u.is_premium ? 'Revocar licencia' : 'Otorgar licencia'} className={`p-2 rounded-full transition-colors ${u.is_premium ? 'text-gold hover:bg-gold/10' : 'text-low hover:text-gold hover:bg-hair'}`}><Crown className="w-4 h-4" strokeWidth={1.7} /></button>
                          <button type="button" onClick={() => openEditModal(u)} title="Editar" className="p-2 rounded-full text-low hover:text-azure hover:bg-azure/10 transition-colors"><Edit2 className="w-4 h-4" strokeWidth={1.7} /></button>
                          <button type="button" disabled={isSelf || u.role === 'ADMIN'} onClick={() => handleDeleteUser(u.id, u.fullName)} title="Eliminar" className="p-2 rounded-full text-low hover:text-ai hover:bg-ai/10 transition-colors disabled:opacity-20"><Trash2 className="w-4 h-4" strokeWidth={1.7} /></button>
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ground/70 backdrop-blur-md animate-fadeIn" onClick={() => setIsModalOpen(false)}>
          <div className="w-full max-w-md rounded-[18px] border hair-2 bg-surface p-7 shadow-panel flex flex-col gap-6 animate-slideUp" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-[18px] font-semibold">{editingUserId ? 'Editar usuario' : 'Crear usuario'}</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Cerrar" className="p-2 rounded-full text-low hover:text-hi hover:bg-hair transition-colors"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleModalSubmit} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-2"><label htmlFor="adm-name" className="field-label">Nombre</label><input id="adm-name" type="text" required value={modalForm.name} onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })} className="field h-11 text-[13.5px]" /></div>
                <div className="flex flex-col gap-2"><label htmlFor="adm-last" className="field-label">Apellido</label><input id="adm-last" type="text" required value={modalForm.last_name} onChange={(e) => setModalForm({ ...modalForm, last_name: e.target.value })} className="field h-11 text-[13.5px]" /></div>
              </div>
              <div className="flex flex-col gap-2"><label htmlFor="adm-email" className="field-label">Correo electrónico</label><input id="adm-email" type="email" required value={modalForm.email} onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })} className="field h-11 text-[13.5px]" /></div>
              <div className="flex flex-col gap-2">
                <label htmlFor="adm-pass" className="field-label">{editingUserId ? 'Nueva contraseña (vacío para no cambiar)' : 'Contraseña inicial'}</label>
                <input id="adm-pass" type="password" value={modalForm.password} onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })} placeholder="••••••••" className="field h-11 text-[13.5px]" />
              </div>
              <div className="flex items-center gap-6 pt-1">
                <label className="flex items-center gap-2.5 text-[13px] text-mid cursor-pointer"><input type="checkbox" checked={modalForm.is_premium} onChange={(e) => setModalForm({ ...modalForm, is_premium: e.target.checked })} className="w-4 h-4 accent-[rgb(var(--azure))]" /> Licencia vitalicia</label>
                <label className="flex items-center gap-2.5 text-[13px] text-mid cursor-pointer"><input type="checkbox" checked={modalForm.is_active} onChange={(e) => setModalForm({ ...modalForm, is_active: e.target.checked })} className="w-4 h-4 accent-[rgb(var(--azure))]" /> Cuenta activa</label>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2">
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-quiet btn-sm">Cancelar</button>
                <button type="submit" className="btn btn-primary btn-sm">{editingUserId ? 'Guardar cambios' : 'Crear usuario'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
