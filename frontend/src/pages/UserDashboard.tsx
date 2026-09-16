import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { analysisApi } from '../services/api';
import { sound } from '../utils/soundEffects';
import { getScoreMood } from '../utils/scoreMood';
import { CountUp } from '../motion';
import { Skeleton, SkeletonRows } from '../components/ui';
import { ArrowRight, FileText, FileType, ShieldCheck, Crown, RefreshCw } from 'lucide-react';

export const UserDashboard: React.FC = () => {
  const { user, isPremium, openPremiumModal } = useAuth();
  const navigate = useNavigate();
  const [allAnalyses, setAllAnalyses] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [historyError, setHistoryError] = useState<string | null>(null);

  const fetchRecent = async () => {
    setLoadingHistory(true);
    setHistoryError(null);
    const res = await analysisApi.getHistory();
    if (res.data?.analyses) setAllAnalyses(res.data.analyses);
    else setHistoryError(res.error || 'No se pudo cargar el historial.');
    setLoadingHistory(false);
  };
  useEffect(() => { fetchRecent(); }, []);

  const usedToday = user?.daily_analysis_count || 0;
  const availableToday = Math.max(0, 5 - usedToday);
  const score = (a: any) => a.ai_score ?? a.aiScore ?? 0;
  const n = allAnalyses.length;

  const totalAnalysesCount = n || (user?.total_analyses || 0);
  const avgAiScore = n > 0 ? Math.round(allAnalyses.reduce((acc, a) => acc + score(a), 0) / n) : 0;
  const avgHumanScore = n > 0 ? 100 - avgAiScore : 0;
  const avgSimilarityScore = n > 0 ? Math.round(allAnalyses.reduce((acc, a) => acc + (a.similarity_score ?? a.similarityScore ?? 0), 0) / n) : 0;

  const highAuthenticity = allAnalyses.filter((a) => score(a) < 30).length;
  const moderateAi = allAnalyses.filter((a) => score(a) >= 30 && score(a) <= 65).length;
  const highAi = allAnalyses.filter((a) => score(a) > 65).length;

  const improvedDocs = allAnalyses.filter((a) => a.improved_ai_score !== null && a.improved_ai_score !== undefined);
  const avgReduction = improvedDocs.length > 0
    ? Math.round(improvedDocs.reduce((acc, a) => acc + Math.max(0, score(a) - (a.improved_ai_score ?? a.improvedAiScore ?? 0)), 0) / improvedDocs.length)
    : 0;

  const docxCount = allAnalyses.filter((a) => a.type === 'DOCX').length;
  const textCount = allAnalyses.filter((a) => a.type === 'TEXT').length;
  const recent = allAnalyses.slice(0, 5);
  const frac = (x: number) => (n > 0 ? x / n : 0);

  const Stat: React.FC<{ label: string; children: React.ReactNode; tone?: string }> = ({ label, children, tone = 'text-hi' }) => (
    <div className="flex flex-col gap-2 py-5 pr-6 border-r hair last:border-r-0">
      <span className="eyebrow">{label}</span>
      <span className={`num text-[30px] leading-none ${tone}`}>{children}</span>
    </div>
  );

  return (
    <div className="max-w-[1100px] flex flex-col gap-9 pb-16">
      {/* Cabecera */}
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div className="flex flex-col gap-3">
          <h1 className="text-d-4 font-light">Hola, <span className="serif text-azure">{user?.name}.</span></h1>
          <p className="text-[14px] text-low">
            {isPremium ? 'Licencia vitalicia activa: análisis y descargas sin límite.' : availableToday === 0 ? 'Has usado tus 5 análisis gratuitos de hoy.' : `Te quedan ${availableToday} análisis gratuitos hoy.`}
          </p>
        </div>
        <Link to="/analyzer" onClick={() => sound.playClick()} className="btn btn-primary btn-sm">Analizar un texto <ArrowRight className="w-4 h-4" strokeWidth={2} /></Link>
      </div>

      {/* Cifras del día */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-6 border-y hair">
        <Stat label="Usados hoy">{isPremium ? <span className="text-[18px] text-hi">Sin cuota</span> : <><CountUp value={usedToday} /><span className="text-low text-[16px]"> / 5</span></>}</Stat>
        <Stat label="Disponibles" tone={availableToday === 0 && !isPremium ? 'text-ai' : 'text-human'}>{isPremium ? <span className="text-[18px]">Ilimitados</span> : <CountUp value={availableToday} />}</Stat>
        <Stat label="Licencia" tone={isPremium ? 'text-gold' : 'text-mid'}><span className="text-[18px]">{isPremium ? 'Vitalicia' : 'Estándar'}</span></Stat>
        <Stat label="Documentos">{loadingHistory ? <Skeleton className="h-7 w-10 mt-0.5" /> : <CountUp value={totalAnalysesCount} />}</Stat>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_1fr] gap-6">
        {/* Estilometría acumulada */}
        <div className="card p-7 flex flex-col gap-7">
          <div className="flex flex-wrap items-baseline justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="eyebrow">Tu estilometría</span>
              <h2 className="text-d-5 font-semibold">Promedios de tus documentos</h2>
            </div>
            <span className="font-mono text-[11.5px] text-low">{loadingHistory ? 'cargando…' : `${n} analizados`}</span>
          </div>

          {loadingHistory ? (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} className="flex flex-col gap-2"><Skeleton className="h-9 w-20" /><Skeleton className="h-3 w-24" /></div>)}</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { label: 'Índice humano', value: avgHumanScore, tone: 'text-human' },
                { label: 'Probabilidad IA', value: avgAiScore, tone: n > 0 ? getScoreMood(avgAiScore).textClass : 'text-low' },
                { label: 'Similitud', value: avgSimilarityScore, tone: 'text-azure' },
              ].map((s) => (
                <div key={s.label} className="flex sm:flex-col items-baseline sm:items-start justify-between sm:justify-start gap-2">
                  <span className={`text-[34px] leading-none ${s.tone}`}>{n > 0 ? <CountUp value={s.value} suffix="%" /> : <span className="num">—</span>}</span>
                  <span className="eyebrow">{s.label}</span>
                </div>
              ))}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-5 border-t hair">
            <div className="flex items-baseline justify-between"><span className="eyebrow">Distribución por veredicto</span><span className="font-mono text-[11px] text-low">{n} docs</span></div>
            <div className="flex h-[6px] rounded-full overflow-hidden bg-hair" role="img" aria-label={`Humano ${highAuthenticity}, mixto ${moderateAi}, IA ${highAi}`}>
              {[['bg-human', highAuthenticity], ['bg-mixed', moderateAi], ['bg-ai', highAi]].map(([cls, v]) => (
                <div key={cls as string} className={`${cls} h-full origin-left transition-[flex-basis] duration-900 ease-out`} style={{ flexBasis: `${frac(v as number) * 100}%` }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-1.5 text-[12.5px] text-mid">
              <span className="inline-flex items-center gap-2"><span className="h-[5px] w-[5px] rounded-full bg-human" />Humano <span className="num text-hi">{highAuthenticity}</span></span>
              <span className="inline-flex items-center gap-2"><span className="h-[5px] w-[5px] rounded-full bg-mixed" />Mixto <span className="num text-hi">{moderateAi}</span></span>
              <span className="inline-flex items-center gap-2"><span className="h-[5px] w-[5px] rounded-full bg-ai" />IA <span className="num text-hi">{highAi}</span></span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 pt-5 border-t hair">
            <div className="flex flex-col gap-1.5"><span className="num text-[26px] leading-none text-hi"><CountUp value={improvedDocs.length} animate={!loadingHistory} /></span><span className="eyebrow">Documentos reescritos</span></div>
            <div className="flex flex-col gap-1.5"><span className="num text-[26px] leading-none text-human">−<CountUp value={avgReduction} animate={!loadingHistory} /> pts</span><span className="eyebrow">Reducción media de IA</span></div>
          </div>
        </div>

        {/* Formatos y consejos */}
        <div className="flex flex-col gap-6">
          <div className="card p-7 flex flex-col gap-5">
            <span className="eyebrow">Formatos</span>
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between"><span className="flex items-center gap-3 text-[14px] text-mid"><FileText className="w-4 h-4 text-low" strokeWidth={1.6} /> Texto plano</span><span className="num text-[16px] text-hi">{textCount}</span></div>
              <div className="flex items-center justify-between"><span className="flex items-center gap-3 text-[14px] text-mid"><FileType className="w-4 h-4 text-low" strokeWidth={1.6} /> Documentos .docx</span><span className="num text-[16px] text-hi">{docxCount}</span></div>
            </div>
          </div>
          <div className="card p-7 flex flex-col gap-4">
            <span className="eyebrow">Buenas prácticas</span>
            <ul className="flex flex-col gap-3 text-[13.5px] leading-[1.6] text-mid">
              {['Cita con formato APA: las coincidencias atribuidas no cuentan como plagio.', 'Analiza párrafos largos: menos de 15 palabras no permiten inferir estilometría.', 'Reescribe y vuelve a analizar para comprobar la reducción real.'].map((t) => (
                <li key={t} className="flex items-start gap-3"><span className="h-px w-3 bg-azure shrink-0 relative top-[11px]" /><span>{t}</span></li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Licencia vitalicia para cuentas estándar */}
      {!isPremium && (
        <div className="halo relative overflow-hidden rounded-[20px] border border-azure/30 p-7 sm:p-8 flex flex-wrap items-center justify-between gap-6"
          style={{ background: 'linear-gradient(165deg, rgb(var(--azure) / .09), rgb(var(--azure) / .015) 60%)' }}>
          <div className="glow" style={{ width: 420, height: 420, top: -220, right: -160, ['--glow-color' as string]: 'rgb(var(--azure) / .18)' }} aria-hidden="true" />
          <div className="relative flex flex-col gap-2 max-w-[560px]">
            <span className="eyebrow text-azure">Licencia vitalicia</span>
            <h3 className="text-d-5 font-semibold">Sin cuota diaria, <span className="serif">para siempre.</span></h3>
            <p className="text-[13.5px] leading-[1.65] text-mid">Un solo pago de $2. Análisis ilimitados, descargas sin límite y prioridad en documentos extensos.</p>
          </div>
          <button type="button" onClick={() => { sound.playClick(); openPremiumModal(); }} className="btn btn-primary shrink-0 relative"><Crown className="w-4 h-4" strokeWidth={1.8} /> Activar por $2</button>
        </div>
      )}
      {isPremium && (
        <div className="flex items-center gap-4 py-5 border-y border-gold/30 text-[13.5px] text-mid"><ShieldCheck className="w-5 h-5 text-gold shrink-0" strokeWidth={1.6} /> Licencia vitalicia activa desde {user?.premium_since ? new Date(user.premium_since).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : 'hoy'}.</div>
      )}

      {/* Recientes */}
      <div className="flex flex-col gap-5">
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="text-d-5 font-light">Últimas <span className="serif">verificaciones.</span></h2>
          <Link to="/history" onClick={() => sound.playClick()} className="text-[13px] text-azure hover:text-hi transition-colors inline-flex items-center gap-1.5">Ver historial <ArrowRight className="w-3.5 h-3.5" strokeWidth={2} /></Link>
        </div>

        {loadingHistory ? (
          <SkeletonRows rows={3} />
        ) : historyError ? (
          <div className="py-10 flex flex-col items-center text-center gap-4 border-y hair" role="alert">
            <p className="text-[13.5px] text-mid max-w-sm">{historyError}</p>
            <button type="button" onClick={fetchRecent} className="btn btn-ghost btn-sm"><RefreshCw className="w-4 h-4" strokeWidth={1.8} /> Reintentar</button>
          </div>
        ) : recent.length === 0 ? (
          <div className="py-14 flex flex-col items-center text-center gap-4 border-y hair">
            <p className="text-[13.5px] text-low max-w-sm">Aún no has analizado nada. Tu primer informe aparecerá aquí.</p>
            <Link to="/analyzer" onClick={() => sound.playClick()} className="btn btn-ghost btn-sm">Empezar</Link>
          </div>
        ) : (
          <ul className="flex flex-col">
            {recent.map((item, i) => {
              const aiScore = Math.round(score(item));
              const m = getScoreMood(aiScore);
              return (
                <li key={item.id}>
                  <button type="button" onClick={() => { sound.playClick(); navigate(`/analyzer?id=${item.id}`); }}
                    className={`group w-full flex items-center gap-5 py-4 border-b hair text-left hover:bg-hair transition-colors duration-240 -mx-2 px-2 rounded-lg ${i === 0 ? 'border-t' : ''}`} style={{ width: 'calc(100% + 16px)' }}>
                    <span className={`num text-[20px] w-16 shrink-0 ${m.textClass}`}>{aiScore}%</span>
                    <span className="flex flex-col gap-0.5 min-w-0 flex-1">
                      <span className="text-[13.5px] font-semibold text-hi truncate">{item.title_or_filename || item.title}</span>
                      <span className="font-mono text-[11px] text-low">{item.type === 'DOCX' ? '.docx' : 'texto'} · sim {item.similarity_score ?? item.similarityScore}%{item.improved_ai_score !== null && item.improved_ai_score !== undefined ? ` · reescrito a ${Math.round(item.improved_ai_score)}%` : ''}</span>
                    </span>
                    <span className="hidden sm:block font-mono text-[11px] text-low whitespace-nowrap">{new Date(item.created_at || item.createdAt).toLocaleDateString('es-ES', { day: '2-digit', month: 'short' })}</span>
                    <ArrowRight className="w-4 h-4 text-low opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-[opacity,transform] duration-240" strokeWidth={1.8} />
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
};
