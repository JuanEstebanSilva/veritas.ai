import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/soundEffects';
import { PlagelioLogo } from '../components/brand';
import { AuthShell } from '../components/auth/AuthShell';
import { Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

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
    if (loading) return;
    sound.playClick();
    if (!email || !password) { sound.playError(); setError('Por favor completa todos los campos.'); return; }

    setLoading(true);
    setError(null);
    const res = await login(email, password);
    setLoading(false);

    if (res.success) {
      sound.playSuccess();
      // Redirección por rol real, no por el texto del correo
      navigate(res.user?.role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    } else {
      sound.playError();
      setError(res.message || 'Credenciales inválidas.');
    }
  };

  return (
    <AuthShell
      tone="azure"
      headline={<>Cada texto<br /><span className="serif text-azure">deja una huella.</span></>}
      lede="Riqueza léxica, cadencia y similitud, medidas párrafo a párrafo. Accede para continuar donde dejaste tu último informe."
      aside={
        <div className="flex items-center gap-8">
          <div className="flex flex-col gap-1.5"><span className="eyebrow">Acceso</span><span className="text-[20px] font-bold text-human">100% Libre</span></div>
          <div className="h-10 w-px bg-hair" />
          <div className="flex flex-col gap-1.5"><span className="eyebrow">Licencia</span><span className="text-[20px] font-bold text-gold">Open Source</span></div>
          <div className="h-10 w-px bg-hair" />
          <div className="flex flex-col gap-1.5"><span className="eyebrow">Formatos</span><span className="text-[15px] font-semibold text-hi mt-1">Word · PDF · ODT · TXT</span></div>
        </div>
      }
    >
      <div className="flex flex-col gap-2.5">
        <h2 className="text-d-4 font-medium">Iniciar sesión</h2>
        <p className="text-sm text-low">¿Aún no tienes cuenta? <Link to="/register" onClick={() => sound.playClick()} className="text-azure hover:text-hi transition-colors">Créala en un minuto</Link></p>
      </div>

      {redirectNotice && !error && (
        <div className="flex items-center gap-3 py-3.5 border-y border-gold/30 text-[13px] text-gold" role="status">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          <span>Debes iniciar sesión para utilizar el analizador.</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-3 py-3.5 border-y border-ai/30 text-[13px] text-ai animate-fadeIn" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate aria-busy={loading}>
        <div className="flex flex-col gap-2">
          <label htmlFor="login-email" className="field-label">Correo electrónico</label>
          <div className="relative">
            <Mail className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none" strokeWidth={1.6} />
            <input id="login-email" type="email" required autoComplete="email" value={email} onChange={(e) => { setEmail(e.target.value); setError(null); }}
              placeholder="tu@universidad.edu" className="field pl-11" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="login-password" className="field-label">Contraseña</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none" strokeWidth={1.6} />
            <input id="login-password" type={showPassword ? 'text' : 'password'} required autoComplete="current-password" value={password}
              onChange={(e) => { setPassword(e.target.value); setError(null); }} placeholder="••••••••" className="field pl-11 pr-14" />
            <button type="button" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} aria-pressed={showPassword}
              className="btn-icon absolute right-1.5 top-1/2 -translate-y-1/2">
              {showPassword ? <EyeOff className="w-4 h-4" strokeWidth={1.6} /> : <Eye className="w-4 h-4" strokeWidth={1.6} />}
            </button>
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full mt-1">
          {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Verificando…</>) : (<>Acceder <ArrowRight className="w-4 h-4" strokeWidth={2} /></>)}
        </button>
      </form>

      <p className="text-[11.5px] leading-[1.6] text-low text-center mt-2">Al continuar aceptas los términos y la política de privacidad.</p>
      <div className="sm:hidden flex justify-center pt-2"><PlagelioLogo variant="compact" size="sm" /></div>
    </AuthShell>
  );
};
