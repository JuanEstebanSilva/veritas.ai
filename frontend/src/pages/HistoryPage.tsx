import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysisApi, writingApi } from '../services/api';
import { getScoreMood } from '../utils/scoreMood';
import {
  History as HistoryIcon,
  Search,
  Eye,
  Trash2,
  Download,
  FileText,
  Bot,
  FileCheck,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
} from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    const res = await analysisApi.getHistory();
    if (res.data?.analyses) {
      setAnalyses(res.data.analyses);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar este análisis de tu historial?')) {
      return;
    }

    setDeletingId(id);
    const res = await analysisApi.deleteAnalysis(id);
    setDeletingId(null);

    if (res.data?.success) {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
    }
  };

  const filteredAnalyses = analyses.filter((a) =>
    (a.title_or_filename || a.title || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6 animate-fadeIn max-w-6xl mx-auto pb-16">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <span>📋</span>
            <span>Registro de Auditorías Documentales</span>
            <span>🕒</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <span>🔍</span>
            <span>Consulta, visualiza o audita tus revisiones previas de texto 📝 y documentos .DOCX 📄</span>
          </p>
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="🔍 Buscar por título o archivo..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <span className="text-xs text-slate-500">⏳ Cargando historial de auditorías...</span>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="p-16 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto text-2xl">
            📂
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {search ? '🔍 No se encontraron análisis coincidentes' : '📂 No tienes auditorías registradas todavía 🧐'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Las auditorías y cotejos de originalidad que realices se archivarán automáticamente en esta sección para su consulta académica.
          </p>
          <button
            onClick={() => navigate('/analyzer')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all inline-flex items-center gap-2"
          >
            <span>🚀</span>
            <span>Realizar una auditoría ahora</span>
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">📄 Documento / Título</th>
                  <th className="py-3.5 px-4">📦 Formato</th>
                  <th className="py-3.5 px-4">🤖 Probabilidad IA</th>
                  <th className="py-3.5 px-4">📑 Similitud</th>
                  <th className="py-3.5 px-4">✨ Versión Optimizada</th>
                  <th className="py-3.5 px-4">📅 Fecha</th>
                  <th className="py-3.5 px-6 text-right">⚙️ Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredAnalyses.map((item) => {
                  const aiScore = Math.round(item.ai_score ?? item.aiScore ?? 0);
                  const mood = getScoreMood(aiScore);
                  const isDocx = item.type === 'DOCX';

                  return (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/analyzer?id=${item.id}`)}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                    >
                      <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                        <div className="flex items-center gap-2.5">
                          <span className="text-base shrink-0">{isDocx ? '📄' : '📝'}</span>
                          <span className="truncate">{item.title_or_filename || item.title}</span>
                        </div>
                      </td>

                      <td className="py-4 px-4">
                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {isDocx ? '📄 DOCX' : '📝 Texto'}
                        </span>
                      </td>

                      {/* Probabilidad IA con Emoji Reactivo (🤖 / 😐 / 😊) */}
                      <td className="py-4 px-4">
                        <span
                          className={`font-black px-2.5 py-1 rounded-full text-xs inline-flex items-center gap-1.5 border shadow-sm ${mood.badgeClass}`}
                          title={`${mood.shortStatus}: ${aiScore}%`}
                        >
                          <span className="text-sm select-none">{mood.aiEmoji}</span>
                          <span>{aiScore}%</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        <span className="font-bold text-blue-600 dark:text-blue-400 inline-flex items-center gap-1">
                          <span>📑</span>
                          <span>{item.similarity_score ?? item.similarityScore}%</span>
                        </span>
                      </td>

                      <td className="py-4 px-4">
                        {item.improved_ai_score !== null && item.improved_ai_score !== undefined ? (
                          (() => {
                            const impAi = Math.round(item.improved_ai_score);
                            const impMood = getScoreMood(impAi);
                            return (
                              <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 inline-flex items-center gap-1">
                                <span>{impMood.aiEmoji}</span>
                                <span>IA: {impAi}%</span>
                                <span>•</span>
                                <span>📑 {item.improved_similarity_score}%</span>
                              </span>
                            );
                          })()
                        ) : (
                          <span className="text-[11px] text-slate-400 italic">No generada</span>
                        )}
                      </td>

                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1">
                          <span>📅</span>
                          <span>
                            {new Date(item.created_at || item.createdAt).toLocaleDateString('es-ES', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </span>
                        </span>
                      </td>

                      <td className="py-4 px-6 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/analyzer?id=${item.id}`);
                            }}
                            className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                            title="👁️ Ver informe de auditoría"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          <button
                            disabled={deletingId === item.id}
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                            title="🗑️ Eliminar registro"
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
  );
};
