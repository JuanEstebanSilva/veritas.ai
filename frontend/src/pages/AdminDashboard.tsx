import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import { AdminStats, AdminUserListItem } from '../types';
import {
  Users,
  Crown,
  TrendingUp,
  FileCheck,
  UserPlus,
  Edit2,
  Trash2,
  Power,
  ShieldAlert,
  Search,
  CheckCircle,
  XCircle,
  Clock,
  Loader2,
  AlertCircle,
  X,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const { user: currentAdmin } = useAuth();

  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Modal de Crear / Editar Usuario
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState({
    name: '',
    last_name: '',
    email: '',
    password: '',
    is_premium: false,
    is_active: true,
  });

  const fetchData = async () => {
    setLoading(true);
    setError(null);

    const [statsRes, usersRes] = await Promise.all([
      adminApi.getStats(),
      adminApi.getAllUsers(),
    ]);

    if (statsRes.data?.stats) {
      setStats(statsRes.data.stats);
    }
    if (usersRes.data?.users) {
      setUsers(usersRes.data.users);
    } else if (usersRes.error) {
      setError(usersRes.error);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingUserId(null);
    setModalForm({
      name: '',
      last_name: '',
      email: '',
      password: '',
      is_premium: false,
      is_active: true,
    });
    setIsModalOpen(true);
  };

  const openEditModal = (u: AdminUserListItem) => {
    setEditingUserId(u.id);
    setModalForm({
      name: u.name,
      last_name: u.last_name,
      email: u.email,
      password: '',
      is_premium: u.is_premium,
      is_active: u.is_active,
    });
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!modalForm.name || !modalForm.last_name || !modalForm.email) {
      setError('Por favor completa todos los campos requeridos.');
      return;
    }

    if (!editingUserId && (!modalForm.password || modalForm.password.length < 8)) {
      setError('La contraseña inicial debe contener al menos 8 caracteres.');
      return;
    }

    if (editingUserId) {
      // Actualizar
      const res = await adminApi.updateUser(editingUserId, {
        name: modalForm.name,
        last_name: modalForm.last_name,
        email: modalForm.email,
        is_active: modalForm.is_active,
        is_premium: modalForm.is_premium,
        ...(modalForm.password ? { password: modalForm.password } : {}),
      });

      if (res.data?.success) {
        setSuccessMessage('Usuario actualizado correctamente.');
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(res.error || 'Error al actualizar usuario.');
      }
    } else {
      // Crear nuevo usuario (Rol USER estricto)
      const res = await adminApi.createUser({
        name: modalForm.name,
        last_name: modalForm.last_name,
        email: modalForm.email,
        password: modalForm.password,
        is_premium: modalForm.is_premium,
      });

      if (res.data?.success) {
        setSuccessMessage('Usuario creado exitosamente.');
        setIsModalOpen(false);
        fetchData();
      } else {
        setError(res.error || 'Error al crear usuario.');
      }
    }

    setTimeout(() => setSuccessMessage(null), 3500);
  };

  const handleToggleActive = async (id: string) => {
    const res = await adminApi.toggleActive(id);
    if (res.data?.success) {
      setUsers((prev) =>
        prev.map((u) => (u.id === id ? { ...u, is_active: res.data!.user.is_active } : u))
      );
    } else {
      alert(res.error || 'No se pudo cambiar el estado del usuario.');
    }
  };

  const handleTogglePremium = async (id: string) => {
    const res = await adminApi.togglePremium(id);
    if (res.data?.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === id
            ? {
                ...u,
                is_premium: res.data!.user.is_premium,
                premium_since: res.data!.user.premium_since,
              }
            : u
        )
      );
      fetchData(); // actualizar contadores de stats
    } else {
      alert(res.error || 'No se pudo actualizar el estado Premium.');
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar permanentemente al usuario ${name}?`)) {
      return;
    }

    const res = await adminApi.deleteUser(id);
    if (res.data?.success) {
      setUsers((prev) => prev.filter((u) => u.id !== id));
      fetchData();
    } else {
      alert(res.error || 'No se pudo eliminar el usuario.');
    }
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-fadeIn max-w-7xl mx-auto pb-16">
      {/* Encabezado del Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-8 rounded-3xl bg-slate-900 text-white shadow-xl">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 text-amber-300 text-xs font-bold border border-amber-500/30">
            <ShieldAlert className="w-4 h-4" />
            <span>Panel de Control Administrativo</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight">
            Gestión Integral de Usuarios y Métricas
          </h1>
          <p className="text-xs text-slate-400">
            Supervisa actividad, análisis realizados y administra cuentas de usuario.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="px-5 py-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-md transition-all flex items-center gap-2 self-start hover:scale-105"
        >
          <UserPlus className="w-4 h-4" />
          <span>Crear Nuevo Usuario</span>
        </button>
      </div>

      {/* Alertas */}
      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-800 dark:text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-500" />
          <span>{successMessage}</span>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Tarjetas de Estadísticas Globales */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
              Total Usuarios
            </span>
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white">
              {stats.totalUsers}
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-500 block mb-1">
              Usuarios Premium
            </span>
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400">
              {stats.premiumUsers}
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-500 block mb-1">
              Usuarios Gratuitos
            </span>
            <span className="text-3xl font-extrabold text-blue-600 dark:text-blue-400">
              {stats.freeUsers}
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-500 block mb-1">
              Análisis Hoy
            </span>
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
              {stats.analysesToday}
            </span>
          </div>

          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm col-span-2 lg:col-span-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 block mb-1">
              Total Análisis
            </span>
            <span className="text-3xl font-extrabold text-indigo-600 dark:text-indigo-400">
              {stats.totalAnalyses}
            </span>
          </div>
        </div>
      )}

      {/* Tabla de Gestión de Usuarios */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            <span>Directorio de Usuarios Registrados</span>
          </h3>

          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre o correo..."
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="p-16 text-center text-xs text-slate-400 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            Cargando usuarios...
          </div>
        ) : (
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    <th className="py-3.5 px-6">Usuario</th>
                    <th className="py-3.5 px-4">Rol</th>
                    <th className="py-3.5 px-4">Estado</th>
                    <th className="py-3.5 px-4">Premium</th>
                    <th className="py-3.5 px-4">Análisis Realizados</th>
                    <th className="py-3.5 px-4">Registro</th>
                    <th className="py-3.5 px-6 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                  {filteredUsers.map((u) => {
                    const isSelf = currentAdmin?.id === u.id;

                    return (
                      <tr key={u.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-6">
                          <div>
                            <span className="font-bold text-slate-900 dark:text-slate-100 block">
                              {u.fullName} {isSelf && <span className="text-[10px] text-blue-500 font-normal">(Tú)</span>}
                            </span>
                            <span className="text-slate-400 text-[11px]">{u.email}</span>
                          </div>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              u.role === 'ADMIN'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          <span
                            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                              u.is_active
                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'
                                : 'bg-red-50 text-red-700 dark:bg-red-950/60 dark:text-red-300'
                            }`}
                          >
                            <span
                              className={`w-1.5 h-1.5 rounded-full ${
                                u.is_active ? 'bg-emerald-500' : 'bg-red-500'
                              }`}
                            />
                            {u.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>

                        <td className="py-4 px-4">
                          {u.is_premium ? (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                              <Crown className="w-3.5 h-3.5 text-amber-500" />
                              <span>Vitalicio</span>
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">Gratuito</span>
                          )}
                        </td>

                        <td className="py-4 px-4">
                          <span className="font-semibold text-slate-700 dark:text-slate-300">
                            {u.totalAnalyses} totales
                          </span>
                          <span className="text-[10px] text-slate-400 block">
                            ({u.dailyAnalysisCount}/5 hoy)
                          </span>
                        </td>

                        <td className="py-4 px-4 text-slate-400 text-[11px] whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString('es-ES')}
                        </td>

                        <td className="py-4 px-6 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Toggle Activar/Desactivar */}
                            <button
                              disabled={isSelf}
                              onClick={() => handleToggleActive(u.id)}
                              title={u.is_active ? 'Desactivar cuenta' : 'Activar cuenta'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.is_active
                                  ? 'text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                  : 'text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-950/30'
                              } disabled:opacity-30`}
                            >
                              <Power className="w-4 h-4" />
                            </button>

                            {/* Toggle Premium */}
                            <button
                              onClick={() => handleTogglePremium(u.id)}
                              title={u.is_premium ? 'Revocar Premium' : 'Otorgar Premium'}
                              className={`p-1.5 rounded-lg transition-colors ${
                                u.is_premium
                                  ? 'text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-950/30'
                                  : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              <Crown className="w-4 h-4" />
                            </button>

                            {/* Editar */}
                            <button
                              onClick={() => openEditModal(u)}
                              title="Editar usuario"
                              className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            {/* Eliminar (previene borrar admin) */}
                            <button
                              disabled={isSelf || u.role === 'ADMIN'}
                              onClick={() => handleDeleteUser(u.id, u.fullName)}
                              title="Eliminar usuario"
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-20"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Usuario */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingUserId ? 'Editar Usuario' : 'Crear Usuario'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Nombre
                  </label>
                  <input
                    type="text"
                    required
                    value={modalForm.name}
                    onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Apellido
                  </label>
                  <input
                    type="text"
                    required
                    value={modalForm.last_name}
                    onChange={(e) => setModalForm({ ...modalForm, last_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={modalForm.email}
                  onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  {editingUserId ? 'Nueva Contraseña (dejar vacío para no cambiar)' : 'Contraseña Inicial'}
                </label>
                <input
                  type="password"
                  value={modalForm.password}
                  onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalForm.is_premium}
                    onChange={(e) => setModalForm({ ...modalForm, is_premium: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Acceso Premium</span>
                </label>

                <label className="flex items-center gap-2 text-xs font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={modalForm.is_active}
                    onChange={(e) => setModalForm({ ...modalForm, is_active: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4"
                  />
                  <span>Cuenta Activa</span>
                </label>
              </div>

              <div className="pt-3 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20"
                >
                  {editingUserId ? 'Guardar Cambios' : 'Crear Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
