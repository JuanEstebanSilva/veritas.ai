import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { adminApi } from '../services/api';
import { AdminStats, AdminUserListItem, AdminAnalysisListItem } from '../types';
import { CountUp } from '../motion';
import { Dialog, Skeleton, SkeletonRows, useConfirm, useToast } from '../components/ui';
import { sound } from '../utils/soundEffects';
import {
  Crown,
  UserPlus,
  Pencil,
  Trash2,
  Power,
  Search,
  AlertCircle,
  X,
  RefreshCw,
  Loader2,
  Shield,
  Users,
  FileText,
  Eye,
  FileCode,
} from 'lucide-react';
import { validarPassword, PASSWORD_MAX } from '../utils/passwordPolicy';

const emptyForm = {
  name: '',
  last_name: '',
  email: '',
  password: '',
  role: 'USER' as 'USER' | 'ADMIN',
  is_premium: true,
  is_active: true,
};

export const AdminDashboard: React.FC = () => {
  const { user: currentAdmin } = useAuth();
  const { confirm } = useConfirm();
  const toast = useToast();

  const [activeTab, setActiveTab] = useState<'users' | 'documents'>('users');
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [analyses, setAnalyses] = useState<AdminAnalysisListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [docSearch, setDocSearch] = useState('');
  const [error, setError] = useState<string | null>(null);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [modalForm, setModalForm] = useState({ ...emptyForm });
  const [busyId, setBusyId] = useState<string | null>(null);

  // Modal para ver contenido de un documento
  const [viewingDoc, setViewingDoc] = useState<AdminAnalysisListItem | null>(null);

  const fetchData = async (quiet = false) => {
    if (!quiet) setLoading(true);
    setError(null);
    const [statsRes, usersRes, analysesRes] = await Promise.all([
      adminApi.getStats(),
      adminApi.getAllUsers(),
      adminApi.getAllAnalyses(),
    ]);
    if (statsRes.data?.stats) setStats(statsRes.data.stats);
    if (usersRes.data?.users) setUsers(usersRes.data.users);
    else if (usersRes.error) setError(usersRes.error);
    if (analysesRes.data?.analyses) setAnalyses(analysesRes.data.analyses);
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    sound.playClick();
    setEditingUserId(null);
    setModalForm({ ...emptyForm });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (u: AdminUserListItem) => {
    sound.playClick();
    setEditingUserId(u.id);
    setModalForm({
      name: u.name,
      last_name: u.last_name,
      email: u.email,
      password: '',
      role: (u.role as 'USER' | 'ADMIN') || 'USER',
      is_premium: u.is_premium,
      is_active: u.is_active,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleModalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    setFormError(null);
    if (!modalForm.name || !modalForm.last_name || !modalForm.email) {
      sound.playError();
      setFormError('Por favor completa todos los campos requeridos.');
      return;
    }
    if (!editingUserId || modalForm.password) {
      const errorPassword = validarPassword(modalForm.password);
      if (errorPassword) {
        sound.playError();
        setFormError(errorPassword);
        return;
      }
    }

    setSaving(true);
    if (editingUserId) {
      const res = await adminApi.updateUser(editingUserId, {
        name: modalForm.name,
        last_name: modalForm.last_name,
        email: modalForm.email,
        role: modalForm.role,
        is_active: modalForm.is_active,
        is_premium: modalForm.is_premium,
        ...(modalForm.password ? { password: modalForm.password } : {}),
      });
      setSaving(false);
      if (res.data?.success) {
        sound.playSuccess();
        toast.show({ title: 'Usuario actualizado', tone: 'human' });
        setIsModalOpen(false);
        fetchData(true);
      } else {
        sound.playError();
        setFormError(res.error || 'Error al actualizar usuario.');
      }
    } else {
      const res = await adminApi.createUser({
        name: modalForm.name,
        last_name: modalForm.last_name,
        email: modalForm.email,
        password: modalForm.password,
        role: modalForm.role,
        is_premium: modalForm.is_premium,
      });
      setSaving(false);
      if (res.data?.success) {
        sound.playSuccess();
        toast.show({ title: 'Usuario creado', description: modalForm.email, tone: 'human' });
        setIsModalOpen(false);
        fetchData(true);
      } else {
        sound.playError();
        setFormError(res.error || 'Error al crear usuario.');
      }
    }
  };

  const handleToggleActive = async (u: AdminUserListItem) => {
    setBusyId(u.id);
    const res = await adminApi.toggleActive(u.id);
    setBusyId(null);
    if (res.data?.success) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, is_active: res.data!.user.is_active } : x)));
      toast.show({
        title: res.data.user.is_active ? 'Cuenta activada' : 'Cuenta desactivada',
        description: u.email,
        tone: res.data.user.is_active ? 'human' : 'gold',
      });
    } else toast.show({ title: 'No se pudo cambiar el estado', description: res.error, tone: 'ai' });
  };

  const handleToggleRole = async (u: AdminUserListItem) => {
    setBusyId(u.id);
    const res = await adminApi.toggleRole(u.id);
    setBusyId(null);
    if (res.data?.success) {
      setUsers((prev) => prev.map((x) => (x.id === u.id ? { ...x, role: res.data!.user.role } : x)));
      toast.show({
        title: `Rol cambiado a ${res.data.user.role}`,
        description: u.email,
        tone: 'human',
      });
      fetchData(true);
    } else {
      toast.show({ title: 'No se pudo cambiar el rol', description: res.error, tone: 'ai' });
    }
  };

  const handleDeleteUser = async (u: AdminUserListItem) => {
    const ok = await confirm({
      title: `Eliminar a ${u.fullName}`,
      description: 'Se borrarán su cuenta y sus datos del sistema. Esta acción no se puede deshacer.',
      confirmLabel: 'Eliminar usuario',
      tone: 'danger',
    });
    if (!ok) return;
    setBusyId(u.id);
    const res = await adminApi.deleteUser(u.id);
    setBusyId(null);
    if (res.data?.success) {
      setUsers((prev) => prev.filter((x) => x.id !== u.id));
      toast.show({ title: 'Usuario eliminado', description: u.email, tone: 'human' });
      fetchData(true);
    } else toast.show({ title: 'No se pudo eliminar', description: res.error, tone: 'ai' });
  };

  const handleDeleteAnalysis = async (a: AdminAnalysisListItem) => {
    const ok = await confirm({
      title: `Eliminar archivo "${a.title}"`,
      description: `Se eliminará este documento del repositorio de Plagelio. Ya no se usará para cotejo de similitud.`,
      confirmLabel: 'Eliminar del repositorio',
      tone: 'danger',
    });
    if (!ok) return;
    setBusyId(a.id);
    const res = await adminApi.deleteAnalysis(a.id);
    setBusyId(null);
    if (res.data?.success) {
      setAnalyses((prev) => prev.filter((x) => x.id !== a.id));
      toast.show({ title: 'Documento eliminado', description: a.title, tone: 'human' });
      fetchData(true);
    } else toast.show({ title: 'No se pudo eliminar el documento', description: res.error, tone: 'ai' });
  };

  const filteredUsers = users.filter(
    (u) =>
      u.fullName.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAnalyses = analyses.filter(
    (a) =>
      a.title.toLowerCase().includes(docSearch.toLowerCase()) ||
      a.userName.toLowerCase().includes(docSearch.toLowerCase()) ||
      a.userEmail.toLowerCase().includes(docSearch.toLowerCase())
  );

  const Stat: React.FC<{ label: string; value?: number; tone?: string }> = ({
    label,
    value,
    tone = 'text-hi',
  }) => (
    <div className="flex flex-col gap-2 py-5 pr-6 border-r hair last:border-r-0">
      <span className="eyebrow">{label}</span>
      <span className={`text-[34px] leading-none ${tone}`}>
        {value === undefined ? <Skeleton className="h-8 w-12" /> : <CountUp value={value} />}
      </span>
    </div>
  );

  return (
    <div className="max-w-[1180px] flex flex-col gap-8 pb-16">
      {/* Encabezado */}
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-d-4 font-light">
            Panel de Control <span className="serif text-gold">Administrativo.</span>
          </h1>
          <p className="text-[14px] text-low">
            Gestiona los perfiles de usuario, roles y el repositorio institucional de archivos de Plagelio.
          </p>
        </div>
        {activeTab === 'users' && (
          <button type="button" onClick={openCreateModal} className="btn btn-primary btn-sm">
            <UserPlus className="w-4 h-4" strokeWidth={1.8} /> Nuevo usuario
          </button>
        )}
      </div>

      {error && (
        <div
          className="flex items-center justify-between gap-3 py-3.5 border-y border-ai/30 text-[13px] text-ai"
          role="alert"
        >
          <span className="flex items-center gap-3">
            <AlertCircle className="w-4 h-4" strokeWidth={1.8} />
            <span>{error}</span>
          </span>
          <button type="button" onClick={() => fetchData()} className="btn btn-ghost btn-xs">
            <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.8} /> Reintentar
          </button>
        </div>
      )}

      {/* Métricas Globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-6 border-y hair">
        <Stat label="Total Usuarios" value={stats?.totalUsers} />
        <Stat label="Documentos en Repositorio" value={stats?.totalAnalyses} tone="text-gold" />
        <Stat label="Análisis Realizados Hoy" value={stats?.analysesToday} tone="text-human" />
        <Stat label="Cuentas Activas" value={users.filter((u) => u.is_active).length} tone="text-azure" />
      </div>

      {/* Pestañas de Navegación del Panel */}
      <div className="flex items-center gap-2 border-b hair">
        <button
          type="button"
          onClick={() => setActiveTab('users')}
          className={`flex items-center gap-2.5 px-5 py-3 text-[14px] font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'border-[rgb(var(--azure))] text-hi'
              : 'border-transparent text-low hover:text-mid'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios y Roles</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-hair text-low">
            {users.length}
          </span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('documents')}
          className={`flex items-center gap-2.5 px-5 py-3 text-[14px] font-semibold border-b-2 transition-all cursor-pointer ${
            activeTab === 'documents'
              ? 'border-[rgb(var(--azure))] text-hi'
              : 'border-transparent text-low hover:text-mid'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Repositorio de Archivos y Documentos</span>
          <span className="px-2 py-0.5 rounded-full text-[11px] bg-hair text-low">
            {analyses.length}
          </span>
        </button>
      </div>

      {/* PESTAÑA 1: CRUD DE USUARIOS Y ROLES */}
      {activeTab === 'users' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-[17px] font-semibold">
              Directorio de Cuentas{' '}
              <span className="text-low font-normal">· {loading ? '…' : filteredUsers.length}</span>
            </h3>
            <div className="relative w-full sm:w-80">
              <label htmlFor="admin-search" className="sr-only">
                Buscar por nombre o correo
              </label>
              <Search
                className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none"
                strokeWidth={1.6}
              />
              <input
                id="admin-search"
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o correo"
                className="field h-11 pl-11 text-[13.5px]"
              />
            </div>
          </div>

          {loading ? (
            <SkeletonRows rows={4} />
          ) : filteredUsers.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center gap-3 border-y hair">
              <p className="text-[13.5px] text-low">
                {search ? `Nadie coincide con «${search}».` : 'Todavía no hay usuarios.'}
              </p>
              {search && (
                <button type="button" onClick={() => setSearch('')} className="btn btn-ghost btn-sm">
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[760px]">
                <thead>
                  <tr className="border-b hair-2">
                    {['Usuario', 'Rol de Acceso', 'Estado', 'Documentos', 'Registro', ''].map(
                      (h, i) => (
                        <th
                          key={i}
                          scope="col"
                          className={`eyebrow font-bold py-3.5 ${i === 0 ? 'pl-1' : ''} ${
                            i === 5 ? 'text-right pr-1' : 'pr-3'
                          }`}
                        >
                          {h || <span className="sr-only">Acciones</span>}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const isSelf = currentAdmin?.id === u.id;
                    const busy = busyId === u.id;
                    return (
                      <tr
                        key={u.id}
                        className={`group border-b hair hover:bg-hair transition-colors duration-240 ${
                          busy ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="py-4 pl-1 pr-4">
                          <span className="flex flex-col gap-0.5">
                            <span className="text-[13.5px] font-semibold text-hi">
                              {u.fullName}{' '}
                              {isSelf && (
                                <span className="text-[11px] text-azure font-normal">(tú)</span>
                              )}
                            </span>
                            <span className="font-mono text-[11px] text-low">{u.email}</span>
                          </span>
                        </td>
                        <td className="py-4 pr-3">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold uppercase tracking-wider ${
                              u.role === 'ADMIN'
                                ? 'bg-gold/15 text-gold border border-gold/30'
                                : 'bg-azure/10 text-azure border border-azure/20'
                            }`}
                          >
                            <Shield className="w-3 h-3" />
                            {u.role === 'ADMIN' ? 'Administrador' : 'Usuario'}
                          </span>
                        </td>
                        <td className="py-4 pr-3">
                          <span
                            className={`inline-flex items-center gap-2 text-[12.5px] font-semibold ${
                              u.is_active ? 'text-human' : 'text-ai'
                            }`}
                          >
                            <span
                              className="status-dot"
                              style={{
                                color: `rgb(var(--${u.is_active ? 'human' : 'ai'}) / .18)`,
                                background: `rgb(var(--${u.is_active ? 'human' : 'ai'}))`,
                              }}
                            />
                            {u.is_active ? 'Activo' : 'Inactivo'}
                          </span>
                        </td>
                        <td className="py-4 pr-3">
                          <span className="num text-[13px] text-hi">{u.totalAnalyses}</span>{' '}
                          <span className="text-[11px] text-low">archivos</span>
                        </td>
                        <td className="py-4 pr-3 font-mono text-[11.5px] text-low whitespace-nowrap">
                          {new Date(u.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-3.5 pr-1 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-hair/40 border hair shadow-xs backdrop-blur-xs">
                            {/* Cambiar Rol USER <-> ADMIN */}
                            <button
                              type="button"
                              disabled={isSelf || busy}
                              onClick={() => handleToggleRole(u)}
                              title={
                                isSelf
                                  ? 'No puedes cambiar tu propio rol'
                                  : u.role === 'ADMIN'
                                  ? 'Rol Admin (clic para pasar a Usuario)'
                                  : 'Rol Usuario (clic para promover a Admin)'
                              }
                              className={`group/btn relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                u.role === 'ADMIN'
                                  ? 'bg-gold/15 text-gold border border-gold/40 hover:bg-gold/25'
                                  : 'bg-hair/50 text-low border border-hair hover:text-gold hover:bg-gold/10'
                              }`}
                            >
                              <Shield className="w-3.5 h-3.5 stroke-[2] transition-transform duration-200 group-hover/btn:scale-110" />
                            </button>

                            {/* Activar / Desactivar cuenta */}
                            <button
                              type="button"
                              disabled={isSelf || busy}
                              onClick={() => handleToggleActive(u)}
                              title={
                                isSelf
                                  ? 'No puedes desactivar tu propia cuenta'
                                  : u.is_active
                                  ? 'Cuenta activa (clic para desactivar)'
                                  : 'Cuenta inactiva (clic para activar)'
                              }
                              className={`group/btn relative w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed ${
                                u.is_active
                                  ? 'bg-human/15 text-human border border-human/30 hover:bg-human/25'
                                  : 'bg-ai/12 text-ai border border-ai/30 hover:bg-ai/20'
                              }`}
                            >
                              <Power className="w-3.5 h-3.5 stroke-[2] transition-transform duration-200 group-hover/btn:scale-110" />
                            </button>

                            {/* Editar usuario */}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => openEditModal(u)}
                              title="Editar usuario"
                              className="group/btn relative w-8 h-8 rounded-lg flex items-center justify-center bg-hair/50 text-mid border border-hair hover:text-azure hover:bg-azure/10 hover:border-azure/30 transition-all duration-200 cursor-pointer"
                            >
                              <Pencil className="w-3.5 h-3.5 stroke-[2] transition-transform duration-200 group-hover/btn:scale-110" />
                            </button>

                            {/* Eliminar usuario */}
                            <button
                              type="button"
                              disabled={isSelf || u.role === 'ADMIN' || busy}
                              onClick={() => handleDeleteUser(u)}
                              title={
                                isSelf
                                  ? 'No puedes eliminar tu propia cuenta'
                                  : u.role === 'ADMIN'
                                  ? 'No se puede eliminar a un administrador'
                                  : 'Eliminar usuario'
                              }
                              className="group/btn relative w-8 h-8 rounded-lg flex items-center justify-center bg-hair/50 text-low border border-hair hover:text-ai hover:bg-ai/10 hover:border-ai/30 transition-all duration-200 cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
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
      )}

      {/* PESTAÑA 2: CRUD DE ARCHIVOS Y DOCUMENTOS CARGADOS */}
      {activeTab === 'documents' && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-[17px] font-semibold">
                Archivos del Repositorio Institucional{' '}
                <span className="text-low font-normal">
                  · {loading ? '…' : filteredAnalyses.length}
                </span>
              </h3>
              <p className="text-[12.5px] text-low mt-0.5">
                Todos los documentos y textos cotejados que forman el corpus de detección de plagio.
              </p>
            </div>
            <div className="relative w-full sm:w-80">
              <label htmlFor="doc-search" className="sr-only">
                Buscar por título, autor o correo
              </label>
              <Search
                className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none"
                strokeWidth={1.6}
              />
              <input
                id="doc-search"
                type="search"
                value={docSearch}
                onChange={(e) => setDocSearch(e.target.value)}
                placeholder="Buscar documento o autor..."
                className="field h-11 pl-11 text-[13.5px]"
              />
            </div>
          </div>

          {loading ? (
            <SkeletonRows rows={5} />
          ) : filteredAnalyses.length === 0 ? (
            <div className="py-16 flex flex-col items-center text-center gap-3 border-y hair">
              <p className="text-[13.5px] text-low">
                {docSearch
                  ? `Ningún archivo coincide con «${docSearch}».`
                  : 'Todavía no hay documentos cargados en el sistema.'}
              </p>
              {docSearch && (
                <button
                  type="button"
                  onClick={() => setDocSearch('')}
                  className="btn btn-ghost btn-sm"
                >
                  Limpiar búsqueda
                </button>
              )}
            </div>
          ) : (
            <div className="relative overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[840px]">
                <thead>
                  <tr className="border-b hair-2">
                    {['Documento / Título', 'Subido por', 'Similitud (Plagio)', 'Probabilidad IA', 'Fecha', ''].map(
                      (h, i) => (
                        <th
                          key={i}
                          scope="col"
                          className={`eyebrow font-bold py-3.5 ${i === 0 ? 'pl-1' : ''} ${
                            i === 5 ? 'text-right pr-1' : 'pr-3'
                          }`}
                        >
                          {h || <span className="sr-only">Acciones</span>}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {filteredAnalyses.map((a) => {
                    const busy = busyId === a.id;
                    const simScore = Math.round(a.similarityScore);
                    const aiScore = Math.round(a.aiScore);

                    return (
                      <tr
                        key={a.id}
                        className={`group border-b hair hover:bg-hair transition-colors duration-240 ${
                          busy ? 'opacity-60' : ''
                        }`}
                      >
                        <td className="py-4 pl-1 pr-4">
                          <div className="flex items-start gap-3">
                            <span className="p-2 rounded-lg bg-hair/60 border hair text-low mt-0.5">
                              {a.type !== 'TEXT' ? (
                                <FileCode className="w-4 h-4 text-azure" />
                              ) : (
                                <FileText className="w-4 h-4 text-mid" />
                              )}
                            </span>
                            <div className="flex flex-col gap-1 max-w-[260px]">
                              <span className="text-[13.5px] font-semibold text-hi truncate" title={a.title}>
                                {a.title}
                              </span>
                              <span className="text-[11px] text-low line-clamp-1">
                                {a.textSnippet || 'Sin vista previa'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 pr-3">
                          <div className="flex flex-col">
                            <span className="text-[13px] font-medium text-hi">{a.userName}</span>
                            <span className="font-mono text-[11px] text-low">{a.userEmail}</span>
                          </div>
                        </td>
                        <td className="py-4 pr-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold ${
                              simScore > 25
                                ? 'bg-ai/15 text-ai border border-ai/30'
                                : simScore > 10
                                ? 'bg-gold/15 text-gold border border-gold/30'
                                : 'bg-human/15 text-human border border-human/30'
                            }`}
                          >
                            {simScore}% Similitud
                          </span>
                        </td>
                        <td className="py-4 pr-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-1 rounded-md text-[12px] font-bold ${
                              aiScore > 50
                                ? 'bg-ai/15 text-ai border border-ai/30'
                                : aiScore > 20
                                ? 'bg-gold/15 text-gold border border-gold/30'
                                : 'bg-human/15 text-human border border-human/30'
                            }`}
                          >
                            {aiScore}% IA
                          </span>
                        </td>
                        <td className="py-4 pr-3 font-mono text-[11.5px] text-low whitespace-nowrap">
                          {new Date(a.createdAt).toLocaleDateString('es-ES')}
                        </td>
                        <td className="py-3.5 pr-1 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5 p-1 rounded-xl bg-hair/40 border hair shadow-xs backdrop-blur-xs">
                            {/* Ver Contenido */}
                            <button
                              type="button"
                              onClick={() => {
                                sound.playClick();
                                setViewingDoc(a);
                              }}
                              title="Ver contenido del documento"
                              className="group/btn relative w-8 h-8 rounded-lg flex items-center justify-center bg-hair/50 text-mid border border-hair hover:text-azure hover:bg-azure/10 hover:border-azure/30 transition-all duration-200 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 stroke-[2] transition-transform duration-200 group-hover/btn:scale-110" />
                            </button>

                            {/* Eliminar Documento */}
                            <button
                              type="button"
                              disabled={busy}
                              onClick={() => handleDeleteAnalysis(a)}
                              title="Eliminar documento del repositorio"
                              className="group/btn relative w-8 h-8 rounded-lg flex items-center justify-center bg-hair/50 text-low border border-hair hover:text-ai hover:bg-ai/10 hover:border-ai/30 transition-all duration-200 cursor-pointer disabled:opacity-20"
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
      )}

      {/* DIÁLOGO: CREAR / EDITAR USUARIO */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} labelledBy="admin-user-title" size="md">
        <form onSubmit={handleModalSubmit} className="p-7 flex flex-col gap-6" aria-busy={saving}>
          <div className="flex items-center justify-between">
            <h3 id="admin-user-title" className="text-[18px] font-semibold">
              {editingUserId ? 'Editar usuario' : 'Crear nuevo usuario'}
            </h3>
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              aria-label="Cerrar"
              className="btn-icon -mr-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          {formError && (
            <div
              className="flex items-center gap-3 py-3 border-y border-ai/30 text-[13px] text-ai"
              role="alert"
            >
              <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} />
              <span>{formError}</span>
            </div>
          )}
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="adm-name" className="field-label">
                  Nombre
                </label>
                <input
                  id="adm-name"
                  data-autofocus
                  type="text"
                  required
                  value={modalForm.name}
                  onChange={(e) => setModalForm({ ...modalForm, name: e.target.value })}
                  className="field h-11 text-[13.5px]"
                />
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="adm-last" className="field-label">
                  Apellido
                </label>
                <input
                  id="adm-last"
                  type="text"
                  required
                  value={modalForm.last_name}
                  onChange={(e) => setModalForm({ ...modalForm, last_name: e.target.value })}
                  className="field h-11 text-[13.5px]"
                />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="adm-email" className="field-label">
                Correo electrónico
              </label>
              <input
                id="adm-email"
                type="email"
                required
                value={modalForm.email}
                onChange={(e) => setModalForm({ ...modalForm, email: e.target.value })}
                className="field h-11 text-[13.5px]"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex flex-col gap-2">
                <label htmlFor="adm-role" className="field-label">
                  Rol de usuario
                </label>
                <select
                  id="adm-role"
                  value={modalForm.role}
                  onChange={(e) =>
                    setModalForm({ ...modalForm, role: e.target.value as 'USER' | 'ADMIN' })
                  }
                  className="field h-11 text-[13.5px]"
                >
                  <option value="USER">Usuario Estándar</option>
                  <option value="ADMIN">Administrador</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label htmlFor="adm-pass" className="field-label">
                  {editingUserId ? 'Nueva contraseña (opcional)' : 'Contraseña inicial'}
                </label>
                <input
                  id="adm-pass"
                  type="password"
                  autoComplete="new-password"
                  maxLength={PASSWORD_MAX}
                  value={modalForm.password}
                  onChange={(e) => setModalForm({ ...modalForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="field h-11 text-[13.5px]"
                />
              </div>
            </div>
            <div className="flex items-center gap-6 pt-1">
              <label className="flex items-center gap-2.5 text-[13px] text-mid cursor-pointer">
                <input
                  type="checkbox"
                  checked={modalForm.is_active}
                  onChange={(e) => setModalForm({ ...modalForm, is_active: e.target.checked })}
                  className="w-4 h-4 accent-[rgb(var(--azure))]"
                />{' '}
                Cuenta activa
              </label>
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="btn btn-quiet btn-sm"
            >
              Cancelar
            </button>
            <button type="submit" disabled={saving} className="btn btn-primary btn-sm">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}{' '}
              {editingUserId ? 'Guardar cambios' : 'Crear usuario'}
            </button>
          </div>
        </form>
      </Dialog>

      {/* DIÁLOGO: PREVISUALIZAR DOCUMENTO DEL REPOSITORIO */}
      <Dialog
        open={Boolean(viewingDoc)}
        onClose={() => setViewingDoc(null)}
        labelledBy="view-doc-title"
        size="lg"
      >
        {viewingDoc && (
          <div className="p-7 flex flex-col gap-5 max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b hair pb-4">
              <div className="flex flex-col gap-1">
                <h3 id="view-doc-title" className="text-[18px] font-semibold text-hi">
                  {viewingDoc.title}
                </h3>
                <span className="text-[12.5px] text-low">
                  Subido por <strong className="text-mid">{viewingDoc.userName}</strong> ({viewingDoc.userEmail}) el{' '}
                  {new Date(viewingDoc.createdAt).toLocaleDateString('es-ES')}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                aria-label="Cerrar"
                className="btn-icon"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-3">
              <span className="px-3 py-1 rounded-md text-[12px] font-bold bg-azure/10 text-azure border border-azure/20">
                Tipo: {viewingDoc.type}
              </span>
              <span className="px-3 py-1 rounded-md text-[12px] font-bold bg-gold/15 text-gold border border-gold/30">
                Similitud: {Math.round(viewingDoc.similarityScore)}%
              </span>
              <span className="px-3 py-1 rounded-md text-[12px] font-bold bg-ai/15 text-ai border border-ai/30">
                Probabilidad IA: {Math.round(viewingDoc.aiScore)}%
              </span>
            </div>

            <div className="flex flex-col gap-2">
              <span className="eyebrow">Texto Completo del Documento:</span>
              <div className="p-4 rounded-xl bg-hair/30 border hair text-[13.5px] leading-relaxed whitespace-pre-wrap font-sans text-hi max-h-[400px] overflow-y-auto select-text">
                {viewingDoc.originalText || viewingDoc.textSnippet || 'Contenido no disponible.'}
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setViewingDoc(null)}
                className="btn btn-primary btn-sm"
              >
                Cerrar vista
              </button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
