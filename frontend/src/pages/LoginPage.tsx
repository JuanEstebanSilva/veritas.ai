import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/soundEffects';
import { VeritasLogo } from '../components/brand';
import { AuthShell } from '../components/auth/AuthShell';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2, Crown, User as UserIcon } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectNotice = new URLSearchParams(location.search).get('notice');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();
    if (!email || !password) { sound.playError(); setError('Por favor completa todos los campos.'); return; }

    setLoading(true);
    setError(null);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      sound.playSuccess();
      // Redirección por rol real, no por el texto del correo
      navigate(res.user?.role === 'ADMIN' ? '/admin' : '/dashboard');
    } else {
      sound.playError();
      setError(res.message || 'Credenciales inválidas.');
    }
  };

  const fillDemoUser = (type: 'admin' | 'user') => {
    sound.playClick();
    if (type === 'admin') { setEmail('admin@veritas.ai'); setPassword('Admin123!Secure*'); }
    else { setEmail('usuario@veritas.ai'); setPassword('User123!Secure*'); }
    setError(null);
  };

  return (
    <AuthShell
      tone="azure"
      headline={<>Cada texto<br /><span className="serif text-azure">deja una huella.</span></>}
      lede="Perplejidad, cadencia y similitud, medidas párrafo a párrafo. Accede para continuar donde dejaste tu último informe."
      aside={
        <div className="flex items-center gap-8">
          <div className="flex flex-col gap-1.5"><span className="eyebrow">Cuota gratuita</span><span className="num text-[25px] text-hi">5<span className="text-low text-[15px]"> / día</span></span></div>
          <div className="h-10 w-px bg-hair" />
          <div className="flex flex-col gap-1.5"><span className="eyebrow">Licencia</span><span className="num text-[25px] text-human">$2</span></div>
          <div className="h-10 w-px bg-hair" />
          <div className="flex flex-col gap-1.5"><span className="eyebrow">Formatos</span><span className="text-[15px] font-semibold text-hi mt-1">Texto · .docx</span></div>
        </div>
      }
    >
      <div className="flex flex-col gap-2.5">
        <h2 className="text-d-4 font-medium">Iniciar sesión</h2>
        <p className="text-sm text-low">¿Aún no tienes cuenta? <Link to="/register" onClick={() => sound.playClick()} className="text-azure hover:text-hi transition-colors">Créala en un minuto</Link></p>
      </div>

      {redirectNotice && (
        <div className="flex items-center gap-3 py-3.5 border-y border-gold/30 text-[13px] text-gold">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          <span>Debes iniciar sesión para utilizar el analizador.</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 py-3.5 border-y border-ai/30 text-[13px] text-ai animate-page-in">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate>
        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className="field-label">Correo electrónico</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none" strokeWidth={1.6} />
            <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)}
              placeholder="tu@universidad.edu" className="field pl-11" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="login-password" className="field-label">Contraseña</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none" strokeWidth={1.6} />
            <input id="login-password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password}
              onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="field pl-11 pr-12" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-low hover:text-hi transition-colors">
              {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.6} /> : <Eye className="w-4 h-4" strokeWidth={1.6} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full mt-1">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (<>Acceder <ArrowRight className="w-4 h-4" strokeWidth={2} /></>)}
        </button>
      </form>

      <div className="flex items-center gap-4">
        <span className="h-px flex-1 bg-hair" />
        <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-low">Acceso de demostración</span>
        <span className="h-px flex-1 bg-hair" />
      </div>

      <div className="flex flex-col">
        {[
          { key: 'admin' as const, Icon: Crown, tone: 'text-gold', title: 'Administrador', mail: 'admin@veritas.ai' },
          { key: 'user' as const, Icon: UserIcon, tone: 'text-azure', title: 'Usuario de prueba', mail: 'usuario@veritas.ai' },
        ].map((d, i) => (
          <button key={d.key} type="button" onClick={() => fillDemoUser(d.key)}
            className={`group flex items-center justify-between gap-4 h-14 border-b hair text-left transition-colors ${i === 0 ? 'border-t' : ''}`}>
            <span className="flex items-center gap-3.5">
              <d.Icon className={`w-[17px] h-[17px] ${d.tone}`} strokeWidth={1.7} />
              <span className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold text-hi">{d.title}</span>
                <span className="font-mono text-[11px] text-low">{d.mail}</span>
              </span>
            </span>
            <span className={`text-[11.5px] font-semibold ${d.tone} group-hover:text-hi transition-colors`}>Rellenar</span>
          </button>
        ))}
      </div>

      <p className="text-[11.5px] leading-[1.6] text-low text-center">Al continuar aceptas los términos y la política de privacidad.</p>
      <div className="sm:hidden flex justify-center pt-2"><VeritasLogo variant="compact" size="sm" /></div>
    </AuthShell>
  );
};
