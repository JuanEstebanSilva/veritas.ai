import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { paymentApi } from '../../services/api';
import { sound } from '../../utils/soundEffects';
import { PlagelioLogo } from '../brand';
import { Dialog } from '../ui/Dialog';
import { hasFinePointer } from '../../motion';
import {
  X, Check, CreditCard, ShieldCheck, AlertCircle, Loader2, Lock, ArrowRight, ArrowLeft,
  Globe, Building, Smartphone, Wifi, User as UserIcon, RefreshCw, Infinity as InfinityIcon, FileCheck2, Download,
} from 'lucide-react';

/* ────────────────────────────────────────────────────────────
   Tipos, constantes y validadores
   ──────────────────────────────────────────────────────────── */
type CheckoutStep = 'summary' | 'payment' | 'processing' | 'success' | 'error';
type PaymentMethodTab = 'card' | 'express' | 'pse';
type CardSkin = 'graphite' | 'azure' | 'gold';
interface FieldError { message: string; valid?: boolean; }

const isTestCard = (num: string): boolean => {
  const clean = num.replace(/\D/g, '');
  return clean.startsWith('4242') || clean.startsWith('5555');
};

const luhnCheck = (num: string): boolean => {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13) return false;
  let sum = 0, isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (isEven) { d *= 2; if (d > 9) d -= 9; }
    sum += d; isEven = !isEven;
  }
  return sum % 10 === 0;
};

const getCardBrand = (num: string): 'VISA' | 'MASTERCARD' | 'AMEX' | null => {
  const clean = num.replace(/\s+/g, '');
  if (!clean) return null;
  if (clean.startsWith('4')) return 'VISA';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean) || clean.startsWith('5555')) return 'MASTERCARD';
  if (/^3[47]/.test(clean)) return 'AMEX';
  return null;
};

/* ────────────────────────────────────────────────────────────
   Indicador de pasos: filetes, no círculos
   ──────────────────────────────────────────────────────────── */
const StepIndicator: React.FC<{ currentStep: CheckoutStep }> = ({ currentStep }) => {
  if (currentStep === 'success' || currentStep === 'processing') return null;
  const active = currentStep === 'summary' ? 0 : 1;
  return (
    <div className="flex items-center gap-3 mb-7 select-none">
      {['Resumen', 'Pago', 'Listo'].map((label, i) => (
        <React.Fragment key={label}>
          <span className={`text-[11px] font-bold uppercase tracking-[0.16em] ${i < active ? 'text-human' : i === active ? 'text-hi' : 'text-low'}`}>{label}</span>
          {i < 2 && <span className={`h-px flex-1 ${i < active ? 'bg-human' : 'bg-hair-2'}`} />}
        </React.Fragment>
      ))}
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Tarjeta con inclinación al ratón
   ──────────────────────────────────────────────────────────── */
const VirtualCard: React.FC<{ cardNumber: string; cardName: string; cardExpiry: string; skin: CardSkin }> = ({ cardNumber, cardName, cardExpiry, skin }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const fine = useMemo(() => hasFinePointer(), []);
  const brand = getCardBrand(cardNumber);
  const skins: Record<CardSkin, React.CSSProperties> = {
    graphite: { background: 'linear-gradient(135deg, #1c1f26 0%, #0d0f13 60%, #17191f 100%)' },
    azure: { background: 'linear-gradient(135deg, #0a2f45 0%, #0d0f13 60%, #06304a 100%)' },
    gold: { background: 'linear-gradient(135deg, #3d2b06 0%, #0d0f13 60%, #2f2205 100%)' },
  };

  const onMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current; if (!card) return;
    const r = card.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 16}deg) rotateX(${-y * 11}deg) scale(1.02)`;
  };
  const onLeave = () => { if (cardRef.current) cardRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)'; };

  return (
    <div ref={cardRef} onMouseMove={fine ? onMove : undefined} onMouseLeave={fine ? onLeave : undefined}
      style={{ ...skins[skin], transition: 'transform .35s cubic-bezier(.16,1,.3,1)', transformStyle: 'preserve-3d' }}
      className="relative w-full max-w-sm mx-auto h-48 rounded-2xl p-5 text-[#f4f5f8] border border-white/10 shadow-panel overflow-hidden select-none">
      <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/[.06] blur-2xl pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none" style={{ background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,.05) 50%, transparent 60%)' }} />
      <div className="relative z-10 flex flex-col justify-between h-full">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-7 rounded-md border border-[#dda733]/60" style={{ background: 'linear-gradient(135deg, #f1d38a, #c9962f)' }} />
            <Wifi className="w-4 h-4 rotate-90 text-white/60" strokeWidth={1.6} />
          </div>
          <div className="min-w-[48px] flex justify-end">
            {brand === 'VISA' && <span className="font-extrabold italic text-lg tracking-tighter">VISA</span>}
            {brand === 'MASTERCARD' && <div className="flex -space-x-2"><div className="w-6 h-6 rounded-full bg-[#EB001B]" /><div className="w-6 h-6 rounded-full bg-[#F79E1B] opacity-90" /></div>}
            {brand === 'AMEX' && <span className="bg-[#007AC1] text-[11px] font-extrabold italic px-2 py-0.5 rounded tracking-tighter">AMEX</span>}
            {!brand && <CreditCard className="w-6 h-6 text-white/30" strokeWidth={1.4} />}
          </div>
        </div>
        <div className="num text-lg sm:text-xl tracking-[.18em] font-medium">{cardNumber || '•••• •••• •••• ••••'}</div>
        <div className="flex items-end justify-between font-mono text-[11px] tracking-wider">
          <div className="max-w-[180px] flex flex-col gap-0.5"><span className="text-[9px] text-white/45 uppercase tracking-[.16em] font-sans">Titular</span><span className="font-medium uppercase truncate">{cardName || 'NOMBRE DEL TITULAR'}</span></div>
          <div className="text-right flex flex-col gap-0.5"><span className="text-[9px] text-white/45 uppercase tracking-[.16em] font-sans">Expira</span><span className="font-medium">{cardExpiry || 'MM/AA'}</span></div>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────────────────────
   Modal
   ──────────────────────────────────────────────────────────── */
export const ModalCheckout: React.FC = () => {
  const { isPremiumModalOpen, closePremiumModal, refreshProfile, user } = useAuth();

  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('summary');
  const [, setPrevStep] = useState<CheckoutStep>('summary');

  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage, setLoadingStage] = useState<0 | 1 | 2>(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodTab>('card');
  const [cardSkin, setCardSkin] = useState<CardSkin>('graphite');

  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvc, setCardCvc] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [fieldErrors, setFieldErrors] = useState<Record<string, FieldError>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [shakingField, setShakingField] = useState<string | null>(null);

  const [pseBank, setPseBank] = useState('bancolombia');
  const [pseDocType, setPseDocType] = useState('CC');
  const [pseDocNumber, setPseDocNumber] = useState('');

  const [testScenario, setTestScenario] = useState<'success' | 'fail'>('success');

  useEffect(() => { if (user && !cardName) setCardName(`${user.name} ${user.last_name}`.toUpperCase()); }, [user, cardName]);
  useEffect(() => { if (checkoutStep === 'payment' && !cardNumber) fillTestCard('success'); }, [checkoutStep, cardNumber]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { if (isPremiumModalOpen) { setCheckoutStep('summary'); setErrorMessage(null); setLoadingProgress(0); } }, [isPremiumModalOpen]);

  const goTo = (step: CheckoutStep) => { sound.playClick(); setPrevStep(checkoutStep); setCheckoutStep(step); };
  const goBack = () => { sound.playClick(); if (checkoutStep === 'payment') goTo('summary'); if (checkoutStep === 'error') goTo('payment'); };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const fmt = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(fmt); validateField('cardNumber', fmt);
  };
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    setCardExpiry(raw); validateField('cardExpiry', raw);
  };

  const validateField = (field: string, value: string) => {
    setTouchedFields((prev) => new Set(prev).add(field));
    let error: FieldError = { message: '', valid: true };
    switch (field) {
      case 'cardName':
        if (!value.trim() || value.trim().length < 2) error = { message: 'Ingresa el nombre tal como aparece en la tarjeta', valid: false };
        break;
      case 'cardNumber': {
        const clean = value.replace(/\D/g, '');
        if (!isTestCard(clean) && !luhnCheck(value)) error = { message: 'Número de tarjeta inválido', valid: false };
        break;
      }
      case 'cardExpiry': {
        const parts = value.split('/');
        const month = parseInt(parts[0], 10), year = parseInt(`20${parts[1]}`, 10);
        const expDate = new Date(year, month, 0);
        if (!parts[1] || isNaN(month) || month < 1 || month > 12 || expDate < new Date()) error = { message: 'Fecha inválida o tarjeta vencida', valid: false };
        break;
      }
      case 'cardCvc': {
        const len = getCardBrand(cardNumber) === 'AMEX' ? 4 : 3;
        if (value.length < len) error = { message: `CVC debe tener ${len} dígitos`, valid: false };
        break;
      }
    }
    setFieldErrors((prev) => ({ ...prev, [field]: error }));
  };

  const shakeField = (field: string) => { setShakingField(field); setTimeout(() => setShakingField(null), 600); };

  const isFormValid = (): boolean => {
    const cleanNum = cardNumber.replace(/\D/g, '');
    const isCardValid = (isTestCard(cleanNum) && cleanNum.length >= 16) || luhnCheck(cardNumber);
    const isNameValid = cardName.trim().length >= 2 || Boolean(user);
    const isExpiryValid = cardExpiry.includes('/') && cardExpiry.length >= 4;
    const isCvcValid = cardCvc.length >= 3;
    return Boolean(isCardValid && isNameValid && isExpiryValid && isCvcValid);
  };

  const fillTestCard = (type: 'success' | 'fail') => {
    sound.playClick();
    setTestScenario(type);
    if (!cardName) setCardName(user ? `${user.name} ${user.last_name}`.toUpperCase() : 'TITULAR DE LA TARJETA');
    if (type === 'success') { setCardNumber('4242 4242 4242 4242'); setCardExpiry('12/28'); setCardCvc('123'); }
    else { setCardNumber('5555 5555 5555 5555'); setCardExpiry('08/27'); setCardCvc('000'); }
    setFieldErrors({ cardName: { message: '', valid: true }, cardNumber: { message: '', valid: true }, cardExpiry: { message: '', valid: true }, cardCvc: { message: '', valid: true } });
    setTouchedFields(new Set(['cardName', 'cardNumber', 'cardExpiry', 'cardCvc']));
  };

  const handleProcessPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!user) { sound.playError(); setErrorMessage('Debes iniciar sesión con tu cuenta para activar la licencia.'); goTo('error'); return; }

    if (paymentMethod === 'card') {
      const currentName = cardName.trim() || `${user.name} ${user.last_name}`.toUpperCase();
      if (!cardName.trim()) setCardName(currentName);
      validateField('cardName', currentName); validateField('cardNumber', cardNumber); validateField('cardExpiry', cardExpiry); validateField('cardCvc', cardCvc);
      if (!isFormValid()) { sound.playError(); ['cardName', 'cardNumber', 'cardExpiry', 'cardCvc'].forEach(shakeField); return; }
    }

    setLoading(true); setErrorMessage(null); setLoadingProgress(10); setLoadingStage(0);
    goTo('processing');

    try {
      setLoadingStep('Cifrando la conexión…');
      for (let p = 10; p <= 30; p += 5) { await new Promise((r) => setTimeout(r, 25)); setLoadingProgress(p); }

      setLoadingStep('Validando con la red de pagos…');
      setLoadingStage(1);
      const initRes = await paymentApi.initSandbox();
      if (!initRes.data?.success || !initRes.data.transaction) throw new Error(initRes.error || 'No se pudo iniciar la transacción.');
      const txId = initRes.data.transaction.transactionId;
      for (let p = 30; p <= 70; p += 5) { await new Promise((r) => setTimeout(r, 20)); setLoadingProgress(p); }

      setLoadingStep('Activando la licencia…');
      setLoadingStage(2);
      const cleanNum = cardNumber.replace(/\D/g, '');
      const simulateSuccess = testScenario === 'success' && !cleanNum.startsWith('5555');
      const confirmRes = await paymentApi.confirmSandbox(txId, simulateSuccess);
      if (!confirmRes.data?.success) throw new Error(confirmRes.error || 'La tarjeta fue declinada por la entidad emisora.');
      for (let p = 70; p <= 100; p += 5) { await new Promise((r) => setTimeout(r, 20)); setLoadingProgress(p); }

      await refreshProfile();
      sound.playSuccess();
      goTo('success');
    } catch (err: any) {
      sound.playError();
      setErrorMessage(err.message || 'Ocurrió un error al procesar el pago.');
      goTo('error');
    } finally {
      setLoading(false); setLoadingStep('');
    }
  };

  const handleStripeCheckout = async () => {
    setLoading(true); setErrorMessage(null);
    const res = await paymentApi.createCheckout();
    setLoading(false);
    if (res.data?.checkoutUrl) window.location.href = res.data.checkoutUrl;
    else setErrorMessage('Stripe requiere configuración adicional. Usa la pasarela directa a continuación.');
  };

  /* ── campo con validación visual ── */
  const FormField: React.FC<{ id: string; label: string; children: React.ReactNode; hint?: string }> = ({ id, label, children, hint }) => {
    const err = fieldErrors[id]; const touched = touchedFields.has(id);
    return (
      <div className={`flex flex-col gap-2 ${shakingField === id ? 'animate-shake' : ''}`}>
        <label htmlFor={id} className="field-label">{label}</label>
        <div className="relative">
          {children}
          {touched && err && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
              {err.valid ? <Check className="w-4 h-4 text-human animate-scaleIn" strokeWidth={2.4} /> : <AlertCircle className="w-4 h-4 text-ai animate-scaleIn" strokeWidth={1.8} />}
            </div>
          )}
        </div>
        {touched && err && !err.valid && <p className="text-[11.5px] text-ai animate-fadeIn">{err.message}</p>}
        {hint && !touched && <p className="text-[11px] text-low">{hint}</p>}
      </div>
    );
  };

  const inputClass = (fieldId: string, extra = '') => {
    const err = fieldErrors[fieldId]; const touched = touchedFields.has(fieldId);
    const base = `field h-12 text-[14px] ${extra}`;
    if (!touched) return base;
    return err?.valid ? `${base} !border-human/40` : `${base} !border-ai/50`;
  };

  const currentBrand = getCardBrand(cardNumber);

  /* ── paso 1: resumen ── */
  const renderSummaryStep = () => (
    <div className="animate-stepEnter flex flex-col gap-7">
      <div className="flex flex-col gap-3">
        <span className="eyebrow text-azure">Licencia vitalicia</span>
        <div className="flex items-baseline gap-2"><span className="num text-[56px] leading-none">$2</span><span className="text-sm text-mid">USD, un solo pago</span></div>
        <p className="text-[14px] leading-[1.65] text-mid">Acceso permanente. Sin suscripciones, sin renovaciones, sin cargos ocultos.</p>
      </div>

      <ul className="flex flex-col border-y hair">
        {[
          { Icon: InfinityIcon, title: 'Análisis ilimitados', desc: 'Textos y documentos .docx sin cuota diaria.' },
          { Icon: FileCheck2, title: 'Reescritura editorial', desc: 'Cadencia, léxico y conectores; citas intactas.' },
          { Icon: Download, title: 'Descargas sin límite', desc: 'Documento reescrito en Word con formato.' },
          { Icon: ShieldCheck, title: 'Historial permanente', desc: 'Todas tus verificaciones, siempre disponibles.' },
        ].map((b, i) => (
          <li key={b.title} className={`flex items-start gap-4 py-3.5 ${i > 0 ? 'border-t hair' : ''}`}>
            <b.Icon className="w-[18px] h-[18px] text-azure shrink-0 mt-0.5" strokeWidth={1.6} />
            <span className="flex flex-col gap-0.5"><span className="text-[13.5px] font-semibold text-hi">{b.title}</span><span className="text-[12.5px] text-low">{b.desc}</span></span>
          </li>
        ))}
      </ul>

      <button type="button" onClick={() => goTo('payment')} className="btn btn-primary w-full">
        <Lock className="w-4 h-4" strokeWidth={1.8} /> Continuar al pago <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </button>
      <p className="text-center text-[11.5px] text-low">Pasarela en modo de pruebas: no se realiza ningún cargo real.</p>
    </div>
  );

  /* ── paso 2: pago ── */
  const renderPaymentStep = () => (
    <div className="animate-stepEnter flex flex-col gap-6">
      <div className="inline-flex p-1 rounded-full border hair self-start">
        {([{ key: 'card', Icon: CreditCard, label: 'Tarjeta' }, { key: 'express', Icon: Smartphone, label: 'Apple / Google' }, { key: 'pse', Icon: Building, label: 'PSE' }] as const).map((tab) => (
          <button key={tab.key} type="button" onClick={() => { sound.playToggle(); setPaymentMethod(tab.key); }}
            className={`inline-flex items-center gap-2 h-9 px-4 rounded-full text-[12.5px] font-semibold transition-all duration-450 ${paymentMethod === tab.key ? 'bg-hair-2 text-hi' : 'text-mid hover:text-hi'}`}>
            <tab.Icon className="w-3.5 h-3.5" strokeWidth={1.7} /><span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {paymentMethod === 'card' && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="eyebrow">Tarjeta</span>
            <div className="flex items-center gap-2">
              {([{ skin: 'graphite', bg: '#22252b' }, { skin: 'azure', bg: '#0a3552' }, { skin: 'gold', bg: '#3d2b06' }] as const).map((s) => (
                <button key={s.skin} type="button" onClick={() => { sound.playToggle(); setCardSkin(s.skin); }} title={s.skin} aria-label={`Estilo ${s.skin}`} aria-pressed={cardSkin === s.skin}
                  className={`h-7 w-7 rounded-full inline-flex items-center justify-center transition-[opacity,box-shadow] duration-160 ${cardSkin === s.skin ? 'ring-1 ring-hi' : 'opacity-60 hover:opacity-100'}`}>
                  <span className="h-3.5 w-3.5 rounded-full" style={{ background: s.bg }} />
                </button>
              ))}
            </div>
          </div>

          <VirtualCard cardNumber={cardNumber} cardName={cardName} cardExpiry={cardExpiry} skin={cardSkin} />

          <div className="flex flex-wrap items-center justify-between gap-3 py-3 border-y hair">
            <span className="text-[12px] font-semibold text-mid">Tarjetas de prueba</span>
            <div className="flex gap-2">
              <button type="button" onClick={() => fillTestCard('success')} className={`btn btn-sm h-8 px-3.5 text-[12px] ${testScenario === 'success' && cardNumber.startsWith('4242') ? 'bg-human text-[rgb(var(--on-accent))]' : 'btn-ghost'}`}><Check className="w-3.5 h-3.5" strokeWidth={2.4} /> Aprobada</button>
              <button type="button" onClick={() => fillTestCard('fail')} className={`btn btn-sm h-8 px-3.5 text-[12px] ${cardNumber.startsWith('5555') ? 'bg-ai text-[rgb(var(--on-accent))]' : 'btn-ghost'}`}>Declinada</button>
            </div>
          </div>

          <form onSubmit={handleProcessPayment} className="flex flex-col gap-4">
            <FormField id="cardName" label="Nombre del titular">
              <div className="relative">
                <UserIcon className="w-4 h-4 text-low absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.6} />
                <input id="cardName" type="text" required autoComplete="cc-name" value={cardName}
                  onChange={(e) => { setCardName(e.target.value.toUpperCase()); validateField('cardName', e.target.value); }} onBlur={(e) => validateField('cardName', e.target.value)}
                  placeholder="COMO APARECE EN LA TARJETA" className={inputClass('cardName', 'pl-11 pr-10 tracking-wide')} />
              </div>
            </FormField>

            <FormField id="cardNumber" label="Número de tarjeta">
              <div className="relative">
                <CreditCard className="w-4 h-4 text-low absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" strokeWidth={1.6} />
                <input id="cardNumber" type="text" required autoComplete="cc-number" inputMode="numeric" value={cardNumber}
                  onChange={handleCardNumberChange} onBlur={(e) => validateField('cardNumber', e.target.value)}
                  placeholder="4242 4242 4242 4242" className={inputClass('cardNumber', 'pl-11 pr-20 font-mono tracking-[.14em]')} />
                <div className="absolute right-10 top-1/2 -translate-y-1/2 flex items-center">
                  {currentBrand === 'VISA' && <span className="font-extrabold italic text-[13px] text-hi">VISA</span>}
                  {currentBrand === 'MASTERCARD' && <div className="flex -space-x-1.5"><div className="w-4 h-4 rounded-full bg-[#EB001B]" /><div className="w-4 h-4 rounded-full bg-[#F79E1B] opacity-90" /></div>}
                  {currentBrand === 'AMEX' && <span className="text-[9px] font-extrabold italic px-1 rounded bg-[#007AC1] text-white">AMEX</span>}
                </div>
              </div>
            </FormField>

            <div className="grid grid-cols-3 gap-3">
              <FormField id="cardExpiry" label="MM/AA">
                <input id="cardExpiry" type="text" required autoComplete="cc-exp" inputMode="numeric" value={cardExpiry} onChange={handleExpiryChange} onBlur={(e) => validateField('cardExpiry', e.target.value)} placeholder="12/28" className={inputClass('cardExpiry', 'text-center font-mono px-2')} />
              </FormField>
              <FormField id="cardCvc" label="CVC">
                <input id="cardCvc" type="password" required autoComplete="cc-csc" inputMode="numeric" maxLength={currentBrand === 'AMEX' ? 4 : 3} value={cardCvc}
                  onChange={(e) => { setCardCvc(e.target.value.replace(/\D/g, '')); validateField('cardCvc', e.target.value); }} onBlur={(e) => validateField('cardCvc', e.target.value)} placeholder="•••" className={inputClass('cardCvc', 'text-center font-mono px-2')} />
              </FormField>
              <FormField id="zipCode" label="C. postal">
                <input id="zipCode" type="text" autoComplete="postal-code" inputMode="numeric" value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="110111" className={inputClass('zipCode', 'text-center px-2')} />
              </FormField>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary w-full mt-1">
              <Lock className="w-4 h-4" strokeWidth={1.8} /> Pagar $2 USD <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
            <button type="button" onClick={handleStripeCheckout} disabled={loading} className="self-center inline-flex items-center gap-1.5 text-[11.5px] text-low hover:text-azure transition-colors">
              <Globe className="w-3 h-3" strokeWidth={1.8} /> Pagar en ventana externa (Stripe Checkout)
            </button>
          </form>
        </div>
      )}

      {paymentMethod === 'express' && (
        <div className="flex flex-col gap-4 animate-fadeIn">
          <div className="flex items-start gap-4 py-5 border-y hair">
            <Smartphone className="w-5 h-5 text-azure shrink-0 mt-0.5" strokeWidth={1.6} />
            <div className="flex flex-col gap-1"><span className="text-[14px] font-semibold text-hi">Pago rápido con biometría</span><span className="text-[12.5px] text-low">Autoriza con Face ID, Touch ID o tu cuenta de Google.</span></div>
          </div>
          <button type="button" onClick={() => handleProcessPayment()} disabled={loading} className="btn w-full bg-black text-white border-white/10 hover:bg-neutral-900">Pagar $2 con Apple Pay</button>
          <button type="button" onClick={() => handleProcessPayment()} disabled={loading} className="btn btn-ghost w-full"><span className="font-extrabold text-azure">G</span> Pagar $2 con Google Pay</button>
        </div>
      )}

      {paymentMethod === 'pse' && (
        <div className="flex flex-col gap-5 animate-fadeIn">
          <div className="flex items-baseline justify-between py-4 border-y hair">
            <span className="flex flex-col gap-1"><span className="eyebrow text-azure">Conversión</span><span className="num text-[24px] text-hi">$8.500 COP</span></span>
            <span className="text-[12.5px] text-low">≈ $2 USD</span>
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="pse-bank" className="field-label">Banco</label>
            <select id="pse-bank" value={pseBank} onChange={(e) => setPseBank(e.target.value)} className="field h-12 text-[14px]">
              {[['bancolombia', 'Bancolombia'], ['nequi', 'Nequi'], ['davivienda', 'Davivienda / Daviplata'], ['bbva', 'BBVA Colombia'], ['bogota', 'Banco de Bogotá'], ['occidente', 'Banco de Occidente'], ['scotiabank', 'Scotiabank Colpatria']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-2">
              <label htmlFor="pse-doctype" className="field-label">Tipo</label>
              <select id="pse-doctype" value={pseDocType} onChange={(e) => setPseDocType(e.target.value)} className="field h-12 text-[14px] px-2">
                {[['CC', 'C.C.'], ['CE', 'C.E.'], ['NIT', 'NIT'], ['PAS', 'Pasaporte']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
            <div className="col-span-2 flex flex-col gap-2">
              <label htmlFor="pse-doc" className="field-label">Número de documento</label>
              <input id="pse-doc" type="text" inputMode="numeric" value={pseDocNumber} onChange={(e) => setPseDocNumber(e.target.value)} placeholder="1020304050" className="field h-12 text-[14px]" />
            </div>
          </div>
          <button type="button" onClick={() => handleProcessPayment()} disabled={loading} className="btn btn-primary w-full"><Building className="w-4 h-4" strokeWidth={1.8} /> Continuar con PSE · $8.500 COP</button>
        </div>
      )}
    </div>
  );

  /* ── paso 3: procesando ── */
  const renderProcessingStep = () => {
    const stages = [
      { Icon: Lock, label: 'Cifrando la conexión' },
      { Icon: Building, label: 'Validando con la entidad emisora' },
      { Icon: ShieldCheck, label: 'Activando la licencia' },
    ];
    return (
      <div className="flex flex-col items-center py-6 gap-9 animate-fadeIn">
        <div className="relative w-20 h-20 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-azure/15 animate-ringPulse" />
          <div className="w-14 h-14 rounded-full bg-azure/15 border border-azure/40 flex items-center justify-center z-10"><Loader2 className="w-6 h-6 text-azure animate-spin" strokeWidth={1.8} /></div>
        </div>
        <div className="w-full max-w-xs flex flex-col gap-2.5">
          <div className="flex justify-between text-[11px] font-bold uppercase tracking-[0.14em] text-low"><span>Procesando</span><span className="num text-hi">{Math.round(loadingProgress)}%</span></div>
          <div className="h-[3px] rounded-full bg-hair overflow-hidden" role="progressbar" aria-valuenow={Math.round(loadingProgress)} aria-valuemin={0} aria-valuemax={100}><div className="h-full w-full rounded-full bg-azure origin-left transition-transform duration-200 ease-out" style={{ transform: `scaleX(${loadingProgress / 100})` }} /></div>
        </div>
        <ul className="w-full max-w-xs flex flex-col">
          {stages.map((s, i) => (
            <li key={s.label} className={`flex items-center gap-4 py-3.5 border-b hair transition-opacity duration-500 ${i === 0 ? 'border-t' : ''} ${i === loadingStage ? 'opacity-100' : i < loadingStage ? 'opacity-70' : 'opacity-35'}`}>
              {i < loadingStage ? <Check className="w-4 h-4 text-human" strokeWidth={2.4} /> : <s.Icon className={`w-4 h-4 ${i === loadingStage ? 'text-azure' : 'text-low'}`} strokeWidth={1.7} />}
              <span className="text-[13px] text-mid">{s.label}</span>
              {i === loadingStage && <Loader2 className="w-3.5 h-3.5 text-azure animate-spin ml-auto" />}
            </li>
          ))}
        </ul>
        <p className="text-[11.5px] text-low text-center max-w-xs">{loadingStep || 'No cierres esta ventana.'}</p>
      </div>
    );
  };

  /* ── éxito ── */
  const renderSuccessScreen = () => (
    <div className="relative flex flex-col items-center py-4 gap-7 animate-scaleIn">
      <div className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden h-48" aria-hidden="true">
        {[
          { left: '10%', color: 'bg-azure', size: 'w-2 h-2' }, { left: '25%', color: 'bg-gold', size: 'w-1.5 h-3' },
          { left: '40%', color: 'bg-human', size: 'w-2 h-2' }, { left: '55%', color: 'bg-azure', size: 'w-1.5 h-1.5' },
          { left: '70%', color: 'bg-gold', size: 'w-2 h-3' }, { left: '80%', color: 'bg-human', size: 'w-1.5 h-2' },
          { left: '90%', color: 'bg-azure', size: 'w-2 h-2' }, { left: '5%', color: 'bg-gold', size: 'w-1.5 h-3' },
        ].map((p, i) => <div key={i} className={`absolute ${p.size} ${p.color} rounded-sm animate-confetti opacity-0`} style={{ left: p.left, top: 0, ['--delay' as string]: `${(i * 0.06).toFixed(2)}s` }} />)}
      </div>

      <div className="relative w-24 h-24 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-24 h-24" fill="none">
          <circle cx="50" cy="50" r="45" stroke="rgb(var(--human))" strokeWidth="3" className="animate-circleDraw" />
          <path d="M 28 52 L 44 68 L 72 36" stroke="rgb(var(--human))" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="animate-checkDraw" />
        </svg>
      </div>

      <div className="text-center flex flex-col gap-2">
        <h2 className="text-d-5 font-semibold">Licencia <span className="serif text-human">activada.</span></h2>
        <p className="text-[14px] text-mid max-w-xs">Tu cuenta ya no tiene cuota diaria. Todo desbloqueado, para siempre.</p>
      </div>

      <ul className="w-full max-w-xs flex flex-col border-y hair">
        {[['Plan', 'Licencia vitalicia'], ['Importe', '$2 USD'], ['Estado', 'Aprobado'], ['Fecha', new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })]].map(([k, v], i) => (
          <li key={k} className={`flex items-center justify-between py-3 text-[13px] ${i > 0 ? 'border-t hair' : ''}`}><span className="text-low">{k}</span><span className={`font-semibold ${k === 'Estado' ? 'text-human' : 'text-hi'}`}>{v}</span></li>
        ))}
      </ul>

      <button type="button" onClick={() => { sound.playClick(); closePremiumModal(); }} className="btn btn-primary w-full max-w-xs">
        <ShieldCheck className="w-4 h-4" strokeWidth={1.8} /> Continuar <ArrowRight className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );

  /* ── error ── */
  const renderErrorScreen = () => (
    <div className="flex flex-col items-center py-4 gap-7 animate-stepEnter">
      <div className="w-16 h-16 rounded-full bg-ai/10 border border-ai/30 flex items-center justify-center"><AlertCircle className="w-7 h-7 text-ai" strokeWidth={1.6} /></div>
      <div className="text-center flex flex-col gap-2">
        <h2 className="text-d-5 font-semibold">Pago no procesado</h2>
        <p className="text-[14px] text-mid max-w-xs">No se realizó ningún cargo. Revisa los datos e intenta de nuevo.</p>
      </div>
      {errorMessage && <p className="w-full max-w-xs py-3.5 border-y border-ai/30 text-[12.5px] leading-relaxed text-ai text-center">{errorMessage}</p>}
      <ul className="w-full max-w-xs flex flex-col gap-2 text-[12.5px] text-mid">
        <li className="eyebrow mb-1">Posibles causas</li>
        {['Fondos insuficientes o límite excedido', 'Tarjeta de prueba en modo rechazo (5555…)', 'Tarjeta no habilitada para pagos en línea', 'La entidad rechazó la solicitud por seguridad'].map((c) => (
          <li key={c} className="flex items-start gap-3"><span className="h-px w-3 bg-ai shrink-0 relative top-[9px]" /><span>{c}</span></li>
        ))}
      </ul>
      <div className="w-full max-w-xs flex flex-col gap-2.5">
        {!user ? (
          <Link to="/login" onClick={closePremiumModal} className="btn btn-primary w-full"><UserIcon className="w-4 h-4" strokeWidth={1.8} /> Iniciar sesión para activar</Link>
        ) : (
          <>
            <button type="button" onClick={() => { setErrorMessage(null); goTo('payment'); }} className="btn btn-primary w-full"><RefreshCw className="w-4 h-4" strokeWidth={1.8} /> Intentar de nuevo</button>
            <button type="button" onClick={() => { setErrorMessage(null); setPaymentMethod('express'); goTo('payment'); }} className="btn btn-ghost w-full"><Smartphone className="w-4 h-4" strokeWidth={1.7} /> Usar otro método</button>
          </>
        )}
        <button type="button" onClick={() => goTo('summary')} className="self-center inline-flex items-center gap-1.5 text-[11.5px] text-low hover:text-hi transition-colors pt-1"><ArrowLeft className="w-3 h-3" strokeWidth={1.8} /> Volver al resumen</button>
      </div>
    </div>
  );

  const isFullscreen = checkoutStep === 'success' || checkoutStep === 'processing';
  const close = () => { sound.playClick(); closePremiumModal(); };

  return (
    <Dialog open={isPremiumModalOpen} onClose={close} dismissible={checkoutStep !== 'processing'} size={isFullscreen ? 'md' : 'xl'} label="Licencia vitalicia" className="overflow-hidden">
          {checkoutStep !== 'processing' && (
            <button type="button" onClick={close} title="Cerrar" aria-label="Cerrar" className="btn-icon absolute top-3 right-3 z-30"><X className="w-5 h-5" strokeWidth={1.7} /></button>
          )}

          {isFullscreen ? (
            <div className="p-7 sm:p-9 min-h-[440px] flex flex-col justify-center">
              {checkoutStep === 'processing' && renderProcessingStep()}
              {checkoutStep === 'success' && renderSuccessScreen()}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">
              <div className="lg:col-span-5 p-7 sm:p-8 border-b lg:border-b-0 lg:border-r hair flex flex-col justify-between gap-8" style={{ background: 'linear-gradient(180deg, rgb(var(--base)), rgb(var(--ground)))' }}>
                <div className="flex flex-col gap-7">
                  <div className="flex items-center justify-between">
                    <PlagelioLogo variant="compact" size="md" />
                    <span className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-human"><span className="status-dot" style={{ color: 'rgb(var(--human) / .18)', background: 'rgb(var(--human))' }} />En línea</span>
                  </div>
                  <div className="flex flex-col gap-2 py-5 border-y hair">
                    <span className="eyebrow">Licencia vitalicia</span>
                    <div className="flex items-baseline gap-2"><span className="num text-[44px] leading-none">$2</span><span className="text-[13px] text-low">USD</span></div>
                    <span className="text-[12.5px] text-human font-semibold inline-flex items-center gap-1.5"><Check className="w-3.5 h-3.5" strokeWidth={2.4} /> Pago único, sin mensualidades</span>
                  </div>
                  <ul className="flex flex-col gap-3 text-[13px] text-mid">
                    {['Análisis ilimitados de texto y .docx', 'Reescritura editorial que respeta citas', 'Descargas en Word sin límite', 'Historial permanente'].map((t) => (
                      <li key={t} className="flex items-start gap-3"><Check className="w-3.5 h-3.5 text-azure shrink-0 mt-1" strokeWidth={2.4} /><span>{t}</span></li>
                    ))}
                  </ul>
                </div>
                <div className="pt-4 border-t hair flex items-center gap-2 text-[11.5px] text-low"><Lock className="w-3.5 h-3.5 text-human" strokeWidth={1.8} /> Conexión cifrada · pasarela en modo de pruebas</div>
              </div>

              <div className="lg:col-span-7 p-7 sm:p-8 flex flex-col">
                <StepIndicator currentStep={checkoutStep} />
                {(checkoutStep === 'payment' || checkoutStep === 'error') && (
                  <button type="button" onClick={goBack} className="inline-flex items-center gap-1.5 text-[12px] text-low hover:text-hi transition-colors mb-5 -mt-3 w-fit">
                    <ArrowLeft className="w-3.5 h-3.5" strokeWidth={1.8} /> {checkoutStep === 'payment' ? 'Volver al resumen' : 'Volver al pago'}
                  </button>
                )}
                {checkoutStep === 'summary' && renderSummaryStep()}
                {checkoutStep === 'payment' && renderPaymentStep()}
                {checkoutStep === 'error' && renderErrorScreen()}
              </div>
            </div>
          )}
    </Dialog>
  );
};
