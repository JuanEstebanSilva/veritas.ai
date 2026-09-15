import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysisApi } from '../services/api';
import { getScoreMood } from '../utils/scoreMood';
import { Search, Eye, Trash2, Loader2, FileText, FileType, ArrowRight } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    const res = await analysisApi.getHistory();
    if (res.data?.analyses) setAnalyses(res.data.analyses);
    setLoading(false);
  };
  useEffect(() => { fetchHistory(); }, []);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar este análisis de tu historial?')) return;
    setDeletingId(id);
    const res = await analysisApi.deleteAnalysis(id);
    setDeletingId(null);
    if (res.data?.success) setAnalyses((prev) => prev.filter((a) => a.id !== id));
  };

  const filtered = analyses.filter((a) => (a.title_or_filename || a.title || '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-[1100px] flex flex-col gap-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-3">
          <span className="eyebrow">Historial</span>
          <h1 className="text-d-4 font-light">Tus <span className="serif text-azure">verificaciones.</span></h1>
          <p className="text-[14px] text-low">Consulta o vuelve a abrir cualquier informe anterior.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none" strokeWidth={1.6} />
          <input id="history-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título o archivo" className="field h-11 pl-11 text-[13.5px]" />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 py-16 text-[13px] text-mid"><Loader2 className="w-4 h-4 animate-spin text-azure" /> Cargando historial…</div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center text-center gap-5 border-y hair">
          <FileText className="w-8 h-8 text-low" strokeWidth={1.3} />
          <div className="flex flex-col gap-2">
            <h3 className="text-[16px] font-semibold text-hi">{search ? 'Sin coincidencias' : 'Aún no hay verificaciones'}</h3>
            <p className="text-[13px] text-low max-w-sm">Cada análisis que hagas se archiva aquí para consultarlo cuando quieras.</p>
          </div>
          <button type="button" onClick={() => navigate('/analyzer')} className="btn btn-primary btn-sm">Analizar un texto <ArrowRight className="w-4 h-4" strokeWidth={2} /></button>
        </div>
      ) : (
        <>
        {/* Móvil: lista apilada, sin scroll horizontal */}
        <div className="sm:hidden flex flex-col">
          {filtered.map((item, i) => {
            const aiScore = Math.round(item.ai_score ?? item.aiScore ?? 0);
            const m = getScoreMood(aiScore);
            const impAi = item.improved_ai_score !== null && item.improved_ai_score !== undefined ? Math.round(item.improved_ai_score) : null;
            return (
              <button key={item.id} type="button" onClick={() => navigate(`/analyzer?id=${item.id}`)}
                className={`flex items-center gap-4 py-4 border-b hair text-left ${i === 0 ? 'border-t' : ''}`}>
                <span className={`num text-[20px] w-14 shrink-0 ${m.textClass}`}>{aiScore}%</span>
                <span className="flex flex-col gap-1 min-w-0 flex-1">
                  <span className="text-[13.5px] font-semibold text-hi truncate">{item.title_or_filename || item.title}</span>
                  <span className="font-mono text-[11px] text-low">{item.type === 'DOCX' ? '.docx' : 'texto'} · sim {item.similarity_score ?? item.similarityScore}%{impAi !== null ? ` · reescrito a ${impAi}%` : ''} · {new Date(item.created_at || item.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                </span>
                <button type="button" disabled={deletingId === item.id} onClick={(e) => handleDelete(item.id, e)} title="Eliminar" className="p-2 rounded-full text-low hover:text-ai transition-colors disabled:opacity-40"><Trash2 className="w-4 h-4" strokeWidth={1.7} /></button>
              </button>
            );
          })}
        </div>
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[680px]">
            <thead>
              <tr className="border-b hair-2">
                {['Documento', 'Formato', 'IA', 'Similitud', 'Reescritura', 'Fecha', ''].map((h, i) => (
                  <th key={i} className={`eyebrow font-bold py-3.5 ${i === 0 ? 'pl-1' : ''} ${i === 6 ? 'text-right pr-1' : 'pr-3'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => {
                const aiScore = Math.round(item.ai_score ?? item.aiScore ?? 0);
                const m = getScoreMood(aiScore);
                const isDocx = item.type === 'DOCX';
                const impAi = item.improved_ai_score !== null && item.improved_ai_score !== undefined ? Math.round(item.improved_ai_score) : null;
                return (
                  <tr key={item.id} onClick={() => navigate(`/analyzer?id=${item.id}`)} className="group border-b hair cursor-pointer hover:bg-hair transition-colors duration-450">
                    <td className="py-4 pl-1 pr-4 max-w-[320px]">
                      <span className="flex items-center gap-3 min-w-0">
                        {isDocx ? <FileType className="w-4 h-4 text-low shrink-0" strokeWidth={1.6} /> : <FileText className="w-4 h-4 text-low shrink-0" strokeWidth={1.6} />}
                        <span className="truncate text-[13.5px] font-semibold text-hi">{item.title_or_filename || item.title}</span>
                      </span>
                    </td>
                    <td className="py-4 pr-3 font-mono text-[11.5px] text-low">{isDocx ? '.docx' : 'texto'}</td>
                    <td className="py-4 pr-3">
                      <span className={`inline-flex items-center gap-2.5 num text-[13.5px] ${m.textClass}`} title={m.shortStatus}>
                        <span className="status-dot" style={{ color: `rgb(${m.cssVar} / .18)`, background: `rgb(${m.cssVar})` }} />{aiScore}%
                      </span>
                    </td>
                    <td className="py-4 pr-3 num text-[13.5px] text-azure">{item.similarity_score ?? item.similarityScore}%</td>
                    <td className="py-4 pr-3">
                      {impAi !== null ? (
                        <span className="num text-[12.5px] text-mid">IA {impAi}% <span className="text-low">·</span> sim {item.improved_similarity_score}%</span>
                      ) : (
                        <span className="text-[12px] text-low italic">No generada</span>
                      )}
                    </td>
                    <td className="py-4 pr-3 font-mono text-[11.5px] text-low whitespace-nowrap">
                      {new Date(item.created_at || item.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="py-4 pr-1 text-right whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 opacity-60 group-hover:opacity-100 transition-opacity">
                        <button type="button" onClick={(e) => { e.stopPropagation(); navigate(`/analyzer?id=${item.id}`); }} title="Ver informe" className="p-2 rounded-full text-low hover:text-azure hover:bg-azure/10 transition-colors"><Eye className="w-4 h-4" strokeWidth={1.7} /></button>
                        <button type="button" disabled={deletingId === item.id} onClick={(e) => handleDelete(item.id, e)} title="Eliminar" className="p-2 rounded-full text-low hover:text-ai hover:bg-ai/10 transition-colors disabled:opacity-40"><Trash2 className="w-4 h-4" strokeWidth={1.7} /></button>
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
};
