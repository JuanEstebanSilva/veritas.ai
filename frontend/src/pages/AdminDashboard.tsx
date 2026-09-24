import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import { AdminStats, AdminUserListItem } from '../types';
import { CountUp } from '../motion';
import { Dialog, Skeleton, SkeletonRows, useConfirm, useToast } from '../components/ui';
import { sound } from '../utils/soundEffects';
import { Crown, UserPlus, Pencil, Trash2, Power, Search, AlertCircle, X, RefreshCw, Loader2 } from 'lucide-react';
import { validarPassword, PASSWORD_MAX } from '../utils/passwordPolicy';

const emptyForm = { name: '', last_name: '', email: '', password: '', is_premium: false, is_active: true };

export const AdminDashboard: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const { confirm } = useConfirm();
  const toast = useToast();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState({ ...emptyForm });
  const [busyId, setBusyId] = useState<string | null>(null);

  const fetchData = async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    const [statsRes, usersRes] = await Promise.all([adminApi.getStats(), adminApi.getAllUsers()]);
    if (statsRes.data?.stats) setStats(statsRes.data.stats);
    if (usersRes.data?.users) setUsers(usersRes.data.users);
    else if (usersRes.error) setError(usersRes.error);
    setLoading(false);
  };
  useEffect(() => { fetchData(); }, []);

  const openCreateModal = () => { sound.playClick(); setEditingUserId(null); setModalForm({ ...emptyForm }); setFormError(null); setIsModalOpen(true); };
  const openEditModal = (u: AdminUserListItem) => {
    sound.playClick();
    setEditingUserId(u.id);
    setModalForm({ name: u.name, last_name: u.last_name, email: u.email, password: '', is_premium: u.is_premium, is_active: u.is_active });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError(null);
    if (!modalForm.name || !modalForm.last_name || !modalForm.email) { sound.playError(); setFormError('Por favor completa todos los campos requeridos.'); return; }
    // Obligatoria al crear; opcional al editar, pero si se escribe debe cumplir la política
    if (!editingUserId || modalForm.password) {
      const errorPassword = validarPassword(modalForm.password);
      if (errorPassword) { sound.playError(); setFormError(errorPassword); return; }
    }

    setSaving(true);
    if (editingUserId) {
      const res = await adminApi.updateUser(editingUserId, {
        name: modalForm.name, last_name: modalForm.last_name, email: modalForm.email,
        is_active: modalForm.is_active, is_premium: modalForm.is_premium,
        ...(modalForm.password ? { password: modalForm.password } : {}),
      });
      setSaving(false);
      if (res.data?.success) { sound.playSuccess(); toast.show({ title: 'Usuario actualizado', tone: 'human' }); setIsModalOpen(false); fetchData(true); }
      else { sound.playError(); setFormError(res.error || 'Error al actualizar usuario.'); }
    } else {
      const res = await adminApi.createUser({
        name: modalForm.name, last_name: modalForm.last_name, email: modalForm.email, password: modalForm.password, is_premium: modalForm.is_premium,
      });
      setSaving(false);
      if (res.data?.success) { sound.playSuccess(); toast.show({ title: 'Usuario creado', description: modalForm.email, tone: 'human' }); setIsModalOpen(false); fetchData(true); }
      else { sound.playError(); setFormError(res.error || 'Error al crear usuario.'); }
    }
  };

  const handleToggleActive = async (u: AdminUserListItem) => {
    setBusyId(u.id);
    const res = await adminApi.toggleActive(u.id);
    setBusyId(null);
    if (res.data?.success) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: res.data!.user.is_active } : x)));
      toast.show({ title: res.data.user.is_active ? 'Cuenta activada' : 'Cuenta desactivada', description: u.email, tone: res.data.user.is_active ? 'human' : 'gold' });
    } else toast.show({ title: 'No se pudo cambiar el estado', description: res.error, tone: 'ai' });
  };
  const handleTogglePremium = async (u: AdminUserListItem) => {
    setBusyId(u.id);
    const res = await adminApi.togglePremium(u.id);
    setBusyId(null);
    if (res.data?.success) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_premium: res.data!.user.is_premium, premium_since: res.data!.user.premium_since } : x)));
      toast.show({ title: res.data.user.is_premium ? 'Licencia otorgada' : 'Licencia revocada', description: u.email, tone: 'gold' });
      fetchData(true);
    } else toast.show({ title: 'No se pudo actualizar la licencia', description: res.error, tone: 'ai' });
  };
  const handleDeleteUser = async (u: AdminUserListItem) => {
    const ok = await confirm({ title: `Eliminar a ${u.fullName}`, description: 'Se borrarán su cuenta, sus análisis y sus pagos. Esta acción no se puede deshacer.', confirmLabel: 'Eliminar usuario', tone: 'danger' });
    if (!ok) return;
    setBusyId(u.id);
    const res = await adminApi.deleteUser(u.id);
    setBusyId(null);
    if (res.data?.success) { setUsers((prev) => prev.filter((x) => x.id !== u.id)); toast.show({ title: 'Usuario eliminado', description: u.email, tone: 'human' }); fetchData(true); }
    else toast.show({ title: 'No se pudo eliminar', description: res.error, tone: 'ai' });
  };

  const filteredUsers = users.filter((u) => u.fullName.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()));

  const Stat: React.FC<{ label: string; value?: number; tone?: string }> = ({ label, value, tone = 'text-hi' }) => (
    <div className="flex flex-col gap-2 py-5 pr-6 border-r hair last:border-r-0">
      <span className="eyebrow">{label}</span>
      <span className={`text-[34px] leading-none ${tone}`}>{value === undefined ? <Skeleton className="h-8 w-12" /> : <CountUp value={value} />}</span>
    </div>
  );

  return (
    <div className="max-w-[1180px] flex flex-col gap-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-d-4 font-light">Usuarios <span className="serif text-gold">y métricas.</span></h1>
          <p className="text-[14px] text-low">Supervisa la actividad y administra las cuentas.</p>
        </div>
        <button type="button" onClick={openCreateModal} className="btn btn-primary btn-sm"><UserPlus className="w-4 h-4" strokeWidth={1.8} /> Nuevo usuario</button>
      </div>

      {error && (
        <div className="flex items-center justify-between gap-3 py-3.5 border-y border-ai/30 text-[13px] text-ai" role="alert">
          <span className="flex items-center gap-3"><AlertCircle className="w-4 h-4" strokeWidth={1.8} /><span>{error}</span></span>
          <button type="button" onClick={() => fetchData()} className="btn btn-ghost btn-xs"><RefreshCw className="w-3.5 h-3.5" strokeWidth={1.8} /> Reintentar</button>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-x-6 border-y hair">
        <Stat label="Usuarios" value={stats?.totalUsers} />
        <Stat label="Premium" value={stats?.premiumUsers} tone="text-gold" />
        <Stat label="Gratuitos" value={stats?.freeUsers} tone="text-azure" />
        <Stat label="Análisis hoy" value={stats?.analysesToday} tone="text-human" />
        <Stat label="Análisis totales" value={stats?.totalAnalyses} />
      </div>

      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h3 className="text-[17px] font-semibold">Directorio <span className="text-low font-normal">· {loading ? '…' : filteredUsers.length}</span></h3>
          <div className="relative w-full sm:w-80">
            <label htmlFor="admin-search" className="sr-only">Buscar por nombre o correo</label>
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none" strokeWidth={1.6} />
            <input id="admin-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre o correo" className="field h-11 pl-11 text-[13.5px]" />
          </div>
        </div>

        {loading ? (
          <SkeletonRows rows={4} />
        ) : filteredUsers.length === 0 ? (
          <div className="py-16 flex flex-col items-center text-center gap-3 border-y hair">
            <p className="text-[13.5px] text-low">{search ? `Nadie coincide con «${search}».` : 'Todavía no hay usuarios.'}</p>
            {search && <button type="button" onClick={() => setSearch('')} className="btn btn-ghost btn-sm">Limpiar búsqueda</button>}
          </div>
        ) : (
          <div className="relative overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[760px]">
              <thead>
                <tr className="border-b hair-2">
                  {['Usuario', 'Rol', 'Estado', 'Licencia', 'Análisis', 'Registro', ''].map((h, i) => (
                    <th key={i} scope="col" className={`eyebrow font-bold py-3.5 ${i === 0 ? 'pl-1' : ''} ${i === 6 ? 'text-right pr-1' : 'pr-3'}`}>{h || <span className="sr-only">Acciones</span>}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const isSelf = currentAdmin?.id === u.id;
                  const busy = busyId === u.id;
                  return (
                    <tr key={u.id} className={`group border-b hair hover:bg-hair transition-colors duration-240 ${busy ? 'opacity-60' : ''}`}>
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
                      <td className="py-3.5 pr-1 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-hair/40 border hair shadow-xs backdrop-blur-xs">
                          {/* 1. Estado de cuenta (Activar / Desactivar) */}
                          <button
                            type="button"
                            disabled={isSelf || busy}
                            onClick={() => handleToggleActive(u)}
                            aria-label={u.is_active ? `Desactivar la cuenta de ${u.fullName}` : `Activar la cuenta de ${u.fullName}`}
                            title={u.is_active ? 'Cuenta activa (clic para desactivar)' : 'Cuenta inactiva (clic para activar)'}
                            className={`group/btn relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              u.is_active
                                ? 'bg-human/15 text-human border border-human/30 hover:bg-human/25 hover:border-human/50 hover:shadow-xs active:scale-95'
                                : 'bg-ai/12 text-ai border border-ai/30 hover:bg-ai/20 hover:border-ai/50 active:scale-95'
                            }`}
                          >
                            <Power className={`w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:scale-110 ${u.is_active ? 'stroke-[2.2]' : 'stroke-[1.8]'}`} />
                          </button>

                          {/* 2. Licencia Premium Vitalicia */}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => handleTogglePremium(u)}
                            aria-label={u.is_premium ? `Revocar la licencia de ${u.fullName}` : `Otorgar licencia a ${u.fullName}`}
                            title={u.is_premium ? 'Licencia vitalicia activa (clic para revocar)' : 'Cuenta gratuita (clic para otorgar vitalicia)'}
                            className={`group/btn relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                              u.is_premium
                                ? 'bg-gold/18 text-gold border border-gold/40 hover:bg-gold/30 hover:border-gold/60 hover:shadow-xs active:scale-95'
                                : 'bg-hair/50 text-low border border-hair hover:text-gold hover:bg-gold/10 hover:border-gold/30 active:scale-95'
                            }`}
                          >
                            <Crown className={`w-3.5 h-3.5 transition-transform duration-200 group-hover/btn:scale-110 ${u.is_premium ? 'fill-gold/25 stroke-[2]' : 'stroke-[1.8]'}`} />
                          </button>

                          {/* 3. Editar usuario */}
                          <button
                            type="button"
                            disabled={busy}
                            onClick={() => openEditModal(u)}
                            aria-label={`Editar a ${u.fullName}`}
                            title="Editar usuario"
                            className="group/btn relative w-8 h-8 rounded-lg flex items-center justify-center bg-hair/50 text-mid border border-hair hover:text-azure hover:bg-azure/10 hover:border-azure/30 hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Pencil className="w-3.5 h-3.5 stroke-[2] transition-transform duration-200 group-hover/btn:scale-110" />
                          </button>

                          {/* 4. Eliminar usuario */}
                          <button
                            type="button"
                            disabled={isSelf || u.role === 'ADMIN' || busy}
                            onClick={() => handleDeleteUser(u)}
                            aria-label={`Eliminar a ${u.fullName}`}
                            title={isSelf ? 'No puedes eliminar tu propia cuenta' : u.role === 'ADMIN' ? 'No se puede eliminar a un administrador' : 'Eliminar usuario'}
                            className="group/btn relative w-8 h-8 rounded-lg flex items-center justify-center bg-hair/50 text-low border border-hair hover:text-ai hover:bg-ai/10 hover:border-ai/30 hover:shadow-xs transition-all duration-200 cursor-pointer active:scale-95 disabled:opacity-20 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-3.5 h-3.5 stroke-[2] transition-transform duration-200 group-hover/btn:scale-110" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} labelledBy="admin-user-title" size="md">
        <form onSubmit={handleModalSubmit} className="p-7 flex flex-col gap-6" aria-busy={saving}>
          <div className="flex items-center justify-between">
            <h3 id="admin-user-title" className="text-[18px] font-semibold">{editingUserId ? 'Editar usuario' : 'Crear usuario'}</h3>
            <button type="button" onClick={() => setIsModalOpen(false)} aria-label="Cerrar" className="btn-icon -mr-2"><X className="w-4 h-4" /></button>
          </div>
          {formError && (
            <div className="flex items-center gap-3 py-3 border-y border-ai/30 text-[13px] text-ai" role="alert"><AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} /><span>{formError}</span></div>
          )}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2"><label htmlFor="adm-name" className="field-label">Nombre</label><input id="adm-name" data-autofocus type="text" required value={modalForm.name} onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })} className="field h-11 text-[13.5px]" /></div>
              <div className="flex flex-col gap-2"><label htmlFor="adm-last" className="field-label">Apellido</label><input id="adm-last" type="text" required value={modalForm.last_name} onChange={(e) => setModalForm({ ...modalForm, last_name: e.target.value })} className="field h-11 text-[13.5px]" /></div>
            </div>
            <div className="flex flex-col gap-2"><label htmlFor="adm-email" className="field-label">Correo electrónico</label><input id="adm-email" type="email" required value={modalForm.email} onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })} className="field h-11 text-[13.5px]" /></div>
            <div className="flex flex-col gap-2">
              <label htmlFor="adm-pass" className="field-label">{editingUserId ? 'Nueva contraseña (vacío para no cambiar)' : 'Contraseña inicial'}</label>
              <input id="adm-pass" type="password" autoComplete="new-password" maxLength={PASSWORD_MAX} value={modalForm.password} onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })} placeholder="••••••••" className="field h-11 text-[13.5px]" />
            </div>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2.5 text-[13px] text-mid cursor-pointer"><input type="checkbox" checked={modalForm.is_premium} onChange={(e) => setModalForm({ ...modalForm, is_premium: e.target.checked })} className="w-4 h-4 accent-[rgb(var(--azure))]" /> Licencia vitalicia</label>
              <label className="flex items-center gap-2.5 text-[13px] text-mid cursor-pointer"><input type="checkbox" checked={modalForm.is_active} onChange={(e) => setModalForm({ ...modalForm, is_active: e.target.checked })} className="w-4 h-4 accent-[rgb(var(--azure))]" /> Cuenta activa</label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-quiet btn-sm">Cancelar</button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null} {editingUserId ? 'Guardar cambios' : 'Crear usuario'}</button>
          </div>
        </form>
      </Dialog>
    </div>
  );
};
