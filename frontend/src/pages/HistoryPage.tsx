import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { analysisApi } from '../services/api';
import { getScoreMood } from '../utils/scoreMood';
import { sound } from '../utils/soundEffects';
import { SkeletonRows, useConfirm, useToast } from '../components/ui';
import { Search, Eye, Trash2, FileText, FileType, ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();
  const { confirm } = useConfirm();
  const toast = useToast();
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const fetchHistory = async () => {
    setLoading(true);
    setError(null);
    const res = await analysisApi.getHistory();
    if (res.data?.analyses) setAnalyses(res.data.analyses);
    else setError(res.error || 'No se pudo cargar el historial.');
    setLoading(false);
  };
  useEffect(() => { fetchHistory(); }, []);

  const open = (id: string) => { sound.playClick(); navigate(`/analyzer?id=${id}`); };

  const handleDelete = async (id: string, title: string) => {
    const ok = await confirm({ title: 'Eliminar este análisis', description: `«${title}» desaparecerá de tu historial. Esta acción no se puede deshacer.`, confirmLabel: 'Eliminar', tone: 'danger' });
    if (!ok) return;
    setDeletingId(id);
    const res = await analysisApi.deleteAnalysis(id);
    setDeletingId(null);
    if (res.data?.success) {
      setAnalyses((prev) => prev.filter((a) => a.id !== id));
      toast.show({ title: 'Análisis eliminado', tone: 'human' });
    } else {
      sound.playError();
      toast.show({ title: 'No se pudo eliminar', description: res.error, tone: 'ai' });
    }
  };

  const filtered = analyses.filter((a) => (a.title_or_filename || a.title || '').toLowerCase().includes(search.toLowerCase()));
  const fmtDate = (d: string, long = false) => new Date(d).toLocaleDateString('es-ES', long ? { day: '2-digit', month: 'short', year: 'numeric' } : { day: '2-digit', month: 'short' });

  return (
    <div className="max-w-[1100px] flex flex-col gap-8 pb-16">
      <div className="flex flex-wrap items-end justify-between gap-5">
        <div className="flex flex-col gap-3">
          <h1 className="text-d-4 font-light">Tus <span className="serif text-azure">verificaciones.</span></h1>
          <p className="text-[14px] text-low">Consulta o vuelve a abrir cualquier informe anterior.</p>
        </div>
        <div className="relative w-full sm:w-72">
          <label htmlFor="history-search" className="sr-only">Buscar por título o archivo</label>
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none" strokeWidth={1.6} />
          <input id="history-search" type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por título o archivo" className="field h-11 pl-11 text-[13.5px]" />
        </div>
      </div>

      {loading ? (
        <SkeletonRows rows={5} />
      ) : error ? (
        <div className="py-16 flex flex-col items-center text-center gap-5 border-y hair" role="alert">
          <AlertCircle className="w-7 h-7 text-ai" strokeWidth={1.4} />
          <div className="flex flex-col gap-2">
            <h3 className="text-[16px] font-semibold text-hi">No se pudo cargar el historial</h3>
            <p className="text-[13px] text-low max-w-sm">{error}</p>
          </div>
          <button type="button" onClick={fetchHistory} className="btn btn-ghost btn-sm"><RefreshCw className="w-4 h-4" strokeWidth={1.8} /> Reintentar</button>
        </div>
      ) : filtered.length === 0 ? (
        <div className="py-20 flex flex-col items-center text-center gap-5 border-y hair">
          <FileText className="w-8 h-8 text-low" strokeWidth={1.3} />
          <div className="flex flex-col gap-2">
            <h3 className="text-[16px] font-semibold text-hi">{search ? 'Sin coincidencias' : 'Aún no hay verificaciones'}</h3>
            <p className="text-[13px] text-low max-w-sm">{search ? `Nada coincide con «${search}».` : 'Cada análisis que hagas se archiva aquí para consultarlo cuando quieras.'}</p>
          </div>
          {search ? (
            <button type="button" onClick={() => setSearch('')} className="btn btn-ghost btn-sm">Limpiar búsqueda</button>
          ) : (
            <button type="button" onClick={() => navigate('/analyzer')} className="btn btn-primary btn-sm">Analizar un texto <ArrowRight className="w-4 h-4" strokeWidth={2} /></button>
          )}
        </div>
      ) : (
        <div>
          {/* Móvil: lista apilada, sin scroll horizontal */}
          <ul className="sm:hidden flex flex-col">
            {filtered.map((item, i) => {
              const aiScore = Math.round(item.ai_score ?? item.aiScore ?? 0);
              const m = getScoreMood(aiScore);
              const impAi = item.improved_ai_score !== null && item.improved_ai_score !== undefined ? Math.round(item.improved_ai_score) : null;
              const title = item.title_or_filename || item.title;
              return (
                <li key={item.id} className={`flex items-center gap-3 border-b hair ${i === 0 ? 'border-t' : ''}`}>
                  <button type="button" onClick={() => open(item.id)} className="flex flex-1 min-w-0 items-center gap-4 py-4 text-left">
                    <span className={`num text-[20px] w-14 shrink-0 ${m.textClass}`}>{aiScore}%</span>
                    <span className="flex flex-col gap-1 min-w-0 flex-1">
                      <span className="text-[13.5px] font-semibold text-hi truncate">{title}</span>
                      <span className="font-mono text-[11px] text-low">{item.type === 'DOCX' ? '.docx' : 'texto'} · sim {item.similarity_score ?? item.similarityScore}%{impAi !== null ? ` · reescrito a ${impAi}%` : ''} · {fmtDate(item.created_at || item.createdAt)}</span>
                    </span>
                  </button>
                  <button type="button" disabled={deletingId === item.id} onClick={() => handleDelete(item.id, title)} aria-label={`Eliminar ${title}`} className="btn-icon hover:!text-ai disabled:opacity-40"><Trash2 className="w-4 h-4" strokeWidth={1.7} /></button>
                </li>
              );
            })}
          </ul>

          <div className="relative hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[680px]">
              <thead>
                <tr className="border-b hair-2">
                  {['Documento', 'Formato', 'IA', 'Similitud', 'Reescritura', 'Fecha', ''].map((h, i) => (
                    <th key={i} scope="col" className={`eyebrow font-bold py-3.5 ${i === 0 ? 'pl-1' : ''} ${i === 6 ? 'text-right pr-1' : 'pr-3'}`}>{h || <span className="sr-only">Acciones</span>}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const aiScore = Math.round(item.ai_score ?? item.aiScore ?? 0);
                  const m = getScoreMood(aiScore);
                  const isDocx = item.type === 'DOCX';
                  const impAi = item.improved_ai_score !== null && item.improved_ai_score !== undefined ? Math.round(item.improved_ai_score) : null;
                  const title = item.title_or_filename || item.title;
                  return (
                    <tr key={item.id} onClick={() => open(item.id)} className="group border-b hair cursor-pointer hover:bg-hair transition-colors duration-240">
                      <td className="py-4 pl-1 pr-4 max-w-[320px]">
                        <button type="button" onClick={(e) => { e.stopPropagation(); open(item.id); }} className="flex items-center gap-3 min-w-0 w-full text-left rounded-md">
                          {isDocx ? <FileType className="w-4 h-4 text-low shrink-0" strokeWidth={1.6} /> : <FileText className="w-4 h-4 text-low shrink-0" strokeWidth={1.6} />}
                          <span className="truncate text-[13.5px] font-semibold text-hi">{title}</span>
                        </button>
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
                      <td className="py-4 pr-3 font-mono text-[11.5px] text-low whitespace-nowrap">{fmtDate(item.created_at || item.createdAt, true)}</td>
                      <td className="py-4 pr-1 text-right whitespace-nowrap">
                        <span className="inline-flex items-center gap-0.5 opacity-70 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                          <button type="button" onClick={(e) => { e.stopPropagation(); open(item.id); }} aria-label={`Ver informe de ${title}`} title="Ver informe" className="btn-icon hover:!text-azure hover:!bg-azure/10"><Eye className="w-4 h-4" strokeWidth={1.7} /></button>
                          <button type="button" disabled={deletingId === item.id} onClick={(e) => { e.stopPropagation(); handleDelete(item.id, title); }} aria-label={`Eliminar ${title}`} title="Eliminar" className="btn-icon hover:!text-ai hover:!bg-ai/10 disabled:opacity-40"><Trash2 className="w-4 h-4" strokeWidth={1.7} /></button>
                        </span>
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
