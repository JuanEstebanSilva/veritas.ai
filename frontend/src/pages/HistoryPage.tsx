import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysisApi, writingApi } from '../services/api';
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
            <HistoryIcon className="w-8 h-8 text-blue-600" />
            <span>Historial de Análisis</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Consulta, visualiza o elimina tus análisis previos de texto y documentos .DOCX
          </p>
        </div>

        {/* Buscador */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por título o archivo..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="p-16 text-center space-y-3 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
          <span className="text-xs text-slate-500">Cargando tus registros...</span>
        </div>
      ) : filteredAnalyses.length === 0 ? (
        <div className="p-16 text-center space-y-4 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center mx-auto">
            <HistoryIcon className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            {search ? 'No se encontraron análisis coincidentes' : 'No tienes análisis registrados'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Los análisis que realices se archivarán automáticamente en esta sección para su consulta posterior.
          </p>
          <button
            onClick={() => navigate('/analyzer')}
            className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all"
          >
            Realizar un análisis ahora
          </button>
        </div>
      ) : (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  <th className="py-3.5 px-6">Documento / Título</th>
                  <th className="py-3.5 px-4">Formato</th>
                  <th className="py-3.5 px-4">Probabilidad IA</th>
                  <th className="py-3.5 px-4">Similitud</th>
                  <th className="py-3.5 px-4">Versión Optimizada</th>
                  <th className="py-3.5 px-4">Fecha</th>
                  <th className="py-3.5 px-6 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {filteredAnalyses.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => navigate(`/analyzer?id=${item.id}`)}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group"
                  >
                    <td className="py-4 px-6 font-semibold text-slate-800 dark:text-slate-200 max-w-xs truncate">
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate">{item.title_or_filename || item.title}</span>
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {item.type}
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span
                        className={`font-black px-2 py-0.5 rounded-full text-xs ${
                          (item.ai_score || item.aiScore) >= 70
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                            : (item.ai_score || item.aiScore) >= 40
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                            : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        }`}
                      >
                        {item.ai_score ?? item.aiScore}%
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      <span className="font-bold text-blue-600 dark:text-blue-400">
                        {item.similarity_score ?? item.similarityScore}%
                      </span>
                    </td>

                    <td className="py-4 px-4">
                      {item.improved_ai_score !== null && item.improved_ai_score !== undefined ? (
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                          IA: {item.improved_ai_score}% • Sim: {item.improved_similarity_score}%
                        </span>
                      ) : (
                        <span className="text-[11px] text-slate-400 italic">No generada</span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-slate-500 whitespace-nowrap">
                      {new Date(item.created_at || item.createdAt).toLocaleDateString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </td>

                    <td className="py-4 px-6 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/analyzer?id=${item.id}`);
                          }}
                          className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors"
                          title="Ver informe"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        <button
                          disabled={deletingId === item.id}
                          onClick={(e) => handleDelete(item.id, e)}
                          className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Eliminar análisis"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
