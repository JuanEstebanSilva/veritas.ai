import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { sound } from '../utils/soundEffects';
import { AuthShell } from '../components/auth/AuthShell';
import { Mail, Lock, ArrowRight, AlertCircle, Loader2, Check } from 'lucide-react';
import { validarPassword, PASSWORD_MIN, PASSWORD_MAX } from '../utils/passwordPolicy';

/** Fortaleza orientativa: longitud y variedad de clases de caracteres. */
const strengthOf = (pw: string) => {
  if (!pw) return { score: 0, label: '' };
  let s = 0;
  if (pw.length >= PASSWORD_MIN) s++;
  if (pw.length >= 14) s++;
  if (/[A-ZÁÉÍÓÚÑ]/.test(pw) && /[a-záéíóúñ]/.test(pw)) s++;
  if (/\d/.test(pw) && /[^\w\s]/.test(pw)) s++;
  return { score: s, label: ['Muy débil', 'Débil', 'Aceptable', 'Sólida', 'Muy sólida'][s] };
};

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ name: '', last_name: '', email: '', password: '', confirm_password: '' });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const strength = useMemo(() => strengthOf(formData.password), [formData.password]);
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
  const matchOk = formData.confirm_password.length > 0 && formData.confirm_password === formData.password;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    sound.playClick();

    if (!formData.name || !formData.last_name || !formData.email || !formData.password || !formData.confirm_password) {
      sound.playError(); setError('Todos los campos son obligatorios.'); return;
    }
    if (formData.password !== formData.confirm_password) { sound.playError(); setError('Las contraseñas ingresadas no coinciden.'); return; }
    const errorPassword = validarPassword(formData.password);
    if (errorPassword) { sound.playError(); setError(errorPassword); return; }
    if (loading) return;

    setLoading(true);
    setError(null);
    const res = await register(formData);
    setLoading(false);

    if (res.success) { sound.playSuccess(); navigate('/dashboard', { replace: true }); }
    else { sound.playError(); setError(res.message || 'Error al completar el registro.'); }
  };

  const strengthColor = strength.score >= 3 ? 'bg-human' : strength.score === 2 ? 'bg-mixed' : 'bg-ai';
  const strengthText = strength.score >= 3 ? 'text-human' : strength.score === 2 ? 'text-mixed' : 'text-ai';

  return (
    <AuthShell
      tone="human"
      headline={<>Cinco análisis<br /><span className="serif text-human">al día, gratis.</span></>}
      lede="Sin tarjeta y sin período de prueba que caduque. Informe completo de perplejidad, burstiness y similitud para texto y documentos .docx."
      aside={
        <ul className="flex flex-col gap-4 max-w-[520px]">
          {['Tus documentos no se usan para entrenar nada', 'Reescritura editorial que respeta citas y referencias', 'La licencia vitalicia quita la cuota diaria por un solo pago de $2'].map((t) => (
            <li key={t} className="flex items-start gap-3.5 text-[15px] leading-[1.55] text-mid">
              <Check className="w-[18px] h-[18px] text-human shrink-0 mt-0.5" strokeWidth={2.1} /><span>{t}</span>
            </li>
          ))}
        </ul>
      }
    >
      <div className="flex flex-col gap-2.5">
        <h2 className="text-d-4 font-medium">Crear cuenta</h2>
        <p className="text-sm text-low">¿Ya tienes una? <Link to="/login" onClick={() => sound.playClick()} className="text-azure hover:text-hi transition-colors">Inicia sesión</Link></p>
      </div>

      {error && (
        <div className="flex items-center gap-3 py-3.5 border-y border-ai/30 text-[13px] text-ai animate-fadeIn" role="alert">
          <AlertCircle className="w-4 h-4 shrink-0" strokeWidth={1.8} /><span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-5" noValidate aria-busy={loading}>
        <div className="grid grid-cols-2 gap-3">
          <div className="flex flex-col gap-2">
            <label htmlFor="reg-name" className="field-label">Nombre</label>
            <input id="reg-name" name="name" type="text" required autoComplete="given-name" value={formData.name} onChange={handleChange} placeholder="Carlos" className="field" />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="reg-last" className="field-label">Apellido</label>
            <input id="reg-last" name="last_name" type="text" required autoComplete="family-name" value={formData.last_name} onChange={handleChange} placeholder="Mendoza" className="field" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="reg-email" className="field-label">Correo electrónico</label>
          <div className="relative">
            <Mail className={`w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${emailOk ? 'text-human' : 'text-low'}`} strokeWidth={1.6} />
            <input id="reg-email" name="email" type="email" required autoComplete="email" value={formData.email} onChange={handleChange}
              placeholder="carlos@universidad.edu" className={`field pl-11 pr-11 ${emailOk ? 'border-human/40' : ''}`} />
            {emailOk && <Check className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-human" strokeWidth={2.2} />}
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="reg-password" className="field-label">Contraseña</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none" strokeWidth={1.6} />
            <input id="reg-password" name="password" type="password" required maxLength={PASSWORD_MAX} autoComplete="new-password" aria-describedby="reg-strength" value={formData.password} onChange={handleChange} placeholder="••••••••" className="field pl-11" />
          </div>
          <div id="reg-strength" className="flex items-center gap-3 mt-0.5" aria-live="polite">
            <div className="flex-1 flex gap-1" aria-hidden="true">
              {[1, 2, 3, 4].map((n) => (
                <span key={n} className={`h-[3px] flex-1 rounded-full transition-colors duration-450 ${strength.score >= n ? strengthColor : 'bg-hair'}`} />
              ))}
            </div>
            <span className={`text-[11.5px] font-semibold min-w-[70px] text-right ${strength.label ? strengthText : 'text-low'}`}>{strength.label || `Mínimo ${PASSWORD_MIN}`}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <label htmlFor="reg-confirm" className="field-label">Repetir contraseña</label>
          <div className="relative">
            <Lock className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-low pointer-events-none" strokeWidth={1.6} />
            <input id="reg-confirm" name="confirm_password" type="password" required maxLength={PASSWORD_MAX} autoComplete="new-password" value={formData.confirm_password} onChange={handleChange}
              placeholder="••••••••" className={`field pl-11 pr-11 ${matchOk ? 'border-human/40' : ''}`} />
            {matchOk && <Check className="w-4 h-4 absolute right-4 top-1/2 -translate-y-1/2 text-human" strokeWidth={2.2} />}
          </div>
        </div>

        <button type="submit" disabled={loading} className="btn btn-primary w-full mt-1">
          {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Creando tu cuenta…</>) : (<>Crear cuenta <ArrowRight className="w-4 h-4" strokeWidth={2} /></>)}
        </button>
      </form>

      <p className="text-[11.5px] leading-[1.6] text-low text-center">Al crear tu cuenta aceptas los términos y la política de privacidad.</p>
    </AuthShell>
  );
};
