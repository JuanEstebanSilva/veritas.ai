import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { paymentApi } from '../../services/api';
import { sound } from '../../utils/soundEffects';
import { VeritasLogo } from '../brand/VeritasLogo';
import {
  X,
  Crown,
  CheckCircle2,
  FileCheck2,
  CreditCard,
  ShieldCheck,
  Zap,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  ArrowLeft,
  Globe,
  Building,
  Check,
  Smartphone,
  Star,
  Wifi,
  User as UserIcon,
  Calendar,
  BadgeCheck,
  Layers,
  RefreshCw,
  MessageCircle,
  Infinity,
} from 'lucide-react';

// ============================================================
// TIPOS Y CONSTANTES
// ============================================================

type CheckoutStep = 'summary' | 'payment' | 'processing' | 'success' | 'error';
type PaymentMethodTab = 'card' | 'express' | 'pse';
type CardSkin = 'obsidian' | 'amethyst' | 'emerald';

interface FieldError {
  message: string;
  valid?: boolean;
}

// Detección de tarjetas de prueba sandbox
const isTestCard = (num: string): boolean => {
  const clean = num.replace(/\D/g, '');
  return clean.startsWith('4242') || clean.startsWith('5555');
};

// Algoritmo de Luhn para validar número de tarjeta
const luhnCheck = (num: string): boolean => {
  const digits = num.replace(/\D/g, '');
  if (digits.length < 13) return false;
  let sum = 0;
  let isEven = false;
  for (let i = digits.length - 1; i >= 0; i--) {
    let d = parseInt(digits[i], 10);
    if (isEven) { d *= 2; if (d > 9) d -= 9; }
    sum += d;
    isEven = !isEven;
  }
  return sum % 10 === 0;
};

// Detección de franquicia de tarjeta
const getCardBrand = (num: string): 'VISA' | 'MASTERCARD' | 'AMEX' | null => {
  const clean = num.replace(/\s+/g, '');
  if (!clean) return null;
  if (clean.startsWith('4')) return 'VISA';
  if (/^5[1-5]/.test(clean) || /^2[2-7]/.test(clean) || clean.startsWith('5555')) return 'MASTERCARD';
  if (/^3[47]/.test(clean)) return 'AMEX';
  return null;
};

// ============================================================
// COMPONENTE: STEP INDICATOR
// ============================================================

const StepIndicator: React.FC<{ currentStep: CheckoutStep }> = ({ currentStep }) => {
  const steps = [
    { key: 'summary', label: 'Resumen', num: 1 },
    { key: 'payment', label: 'Pago',    num: 2 },
    { key: 'summary', label: 'Listo',   num: 3 }, // 'processing'/'success'/'error' → step 3
  ];

  const getStepStatus = (stepKey: string, num: number): 'done' | 'active' | 'pending' => {
    if (currentStep === 'summary')    return num === 1 ? 'active' : 'pending';
    if (currentStep === 'payment')    return num === 1 ? 'done' : num === 2 ? 'active' : 'pending';
    if (currentStep === 'processing') return num < 3 ? 'done' : 'active';
    if (currentStep === 'success')    return 'done';
    if (currentStep === 'error')      return num === 1 ? 'done' : num === 2 ? 'active' : 'pending';
    return 'pending';
  };

  if (currentStep === 'success' || currentStep === 'processing') return null;

  return (
    <div className="flex items-center justify-center gap-0 mb-6 select-none">
      {[1, 2, 3].map((num, idx) => {
        const status = getStepStatus('', num);
        return (
          <React.Fragment key={num}>
            {/* Círculo del paso */}
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all duration-500 ${
                  status === 'done'
                    ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/30'
                    : status === 'active'
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/40 ring-4 ring-indigo-500/20'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-400 dark:text-slate-500'
                }`}
              >
                {status === 'done' ? <Check className="w-4 h-4" /> : num}
              </div>
              <span className={`text-[10px] font-bold tracking-wide ${
                status === 'active'
                  ? 'text-indigo-600 dark:text-indigo-400'
                  : status === 'done'
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-400'
              }`}>
                {['Resumen', 'Pago', 'Listo'][num - 1]}
              </span>
            </div>

            {/* Línea conectora */}
            {idx < 2 && (
              <div className="w-16 sm:w-24 h-[2px] mx-1 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden relative mb-5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    status === 'done' || (num === 1 && (currentStep === 'payment' || currentStep === 'error'))
                      ? 'w-full bg-emerald-500'
                      : 'w-0'
                  }`}
                />
              </div>
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
};

// ============================================================
// COMPONENTE: TARJETA 3D INTERACTIVA
// ============================================================

const VirtualCard: React.FC<{
  cardNumber: string;
  cardName: string;
  cardExpiry: string;
  skin: CardSkin;
}> = ({ cardNumber, cardName, cardExpiry, skin }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const brand = getCardBrand(cardNumber);

  const skinStyles: Record<CardSkin, string> = {
    obsidian:  'from-slate-950 via-slate-900 to-indigo-950 border-white/15',
    amethyst:  'from-purple-950 via-indigo-900 to-slate-950 border-purple-400/20',
    emerald:   'from-emerald-950 via-teal-900 to-slate-950 border-emerald-400/20',
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width  - 0.5;
    const y = (e.clientY - rect.top)  / rect.height - 0.5;
    card.style.transform = `perspective(800px) rotateY(${x * 18}deg) rotateX(${-y * 12}deg) scale(1.03)`;
  };

  const handleMouseLeave = () => {
    if (cardRef.current) {
      cardRef.current.style.transform = 'perspective(800px) rotateY(0deg) rotateX(0deg) scale(1)';
    }
  };

  return (
    <div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ transition: 'transform 0.15s ease-out', transformStyle: 'preserve-3d' }}
      className={`relative w-full max-w-sm mx-auto h-48 rounded-2xl p-5 text-white shadow-2xl overflow-hidden bg-gradient-to-tr ${skinStyles[skin]} border select-none cursor-pointer`}
    >
      {/* Texturas reflectantes */}
      <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

      <div className="relative z-10 flex flex-col justify-between h-full">
        {/* Fila superior: Chip EMV + Contactless + Franquicia */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Chip EMV dorado */}
            <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-200 via-amber-400 to-amber-300 p-1 flex items-center justify-center shadow-md border border-amber-500/50">
              <div className="w-full h-full border border-amber-700/40 rounded-sm grid grid-cols-2 gap-0.5 opacity-80">
                <div className="border-r border-b border-amber-800/30" />
                <div className="border-b border-amber-800/30" />
                <div className="border-r border-amber-800/30" />
                <div />
              </div>
            </div>
            {/* Contactless */}
            <div className="opacity-80">
              <Wifi className="w-5 h-5 rotate-90 text-white/80" />
            </div>
          </div>

          {/* Logo franquicia dinámico */}
          <div className="flex items-center min-w-[48px] justify-end">
            {brand === 'VISA' && (
              <span className="font-black italic text-xl tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">VISA</span>
            )}
            {brand === 'MASTERCARD' && (
              <div className="flex items-center -space-x-2">
                <div className="w-6 h-6 rounded-full bg-[#EB001B] shadow" />
                <div className="w-6 h-6 rounded-full bg-[#F79E1B] opacity-90 shadow" />
              </div>
            )}
            {brand === 'AMEX' && (
              <div className="bg-[#007AC1] text-white font-black text-[11px] px-2 py-0.5 rounded tracking-tighter italic">AMEX</div>
            )}
            {!brand && (
              <CreditCard className="w-6 h-6 text-white/40" />
            )}
          </div>
        </div>

        {/* Número de tarjeta */}
        <div className="font-mono text-lg sm:text-xl tracking-widest font-bold text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
          {cardNumber || '•••• •••• •••• ••••'}
        </div>

        {/* Titular y Expiración */}
        <div className="flex items-center justify-between text-xs font-mono tracking-wider text-slate-200">
          <div className="max-w-[180px]">
            <span className="text-[8px] text-slate-400 block tracking-normal uppercase font-sans">Titular</span>
            <span className="font-bold uppercase truncate block">{cardName || 'NOMBRE DEL TITULAR'}</span>
          </div>
          <div className="text-right">
            <span className="text-[8px] text-slate-400 block tracking-normal uppercase font-sans">Expira</span>
            <span className="font-bold">{cardExpiry || 'MM/AA'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

export const ModalCheckout: React.FC = () => {
  const { isPremiumModalOpen, closePremiumModal, refreshProfile, user } = useAuth();

  // ── Flujo de pasos ──────────────────────────────────────────
  const [checkoutStep, setCheckoutStep] = useState<CheckoutStep>('summary');
  const [prevStep, setPrevStep]         = useState<CheckoutStep>('summary');

  // ── Estado de pago ──────────────────────────────────────────
  const [loading,        setLoading]        = useState(false);
  const [loadingStep,    setLoadingStep]    = useState<string>('');
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [loadingStage,   setLoadingStage]   = useState<0 | 1 | 2>(0);
  const [errorMessage,   setErrorMessage]   = useState<string | null>(null);

  // ── Método de pago y skins ──────────────────────────────────
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodTab>('card');
  const [cardSkin,      setCardSkin]      = useState<CardSkin>('obsidian');

  // ── Formulario de tarjeta ────────────────────────────────────
  const [cardName,    setCardName]    = useState('');
  const [cardNumber,  setCardNumber]  = useState('');
  const [cardExpiry,  setCardExpiry]  = useState('');
  const [cardCvc,     setCardCvc]     = useState('');
  const [zipCode,     setZipCode]     = useState('');

  // ── Validación en tiempo real ────────────────────────────────
  const [fieldErrors,   setFieldErrors]   = useState<Record<string, FieldError>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [shakingField,  setShakingField]  = useState<string | null>(null);

  // ── PSE ──────────────────────────────────────────────────────
  const [pseBank,      setPseBank]      = useState('bancolombia');
  const [pseDocType,   setPseDocType]   = useState('CC');
  const [pseDocNumber, setPseDocNumber] = useState('');

  // ── Sandbox ──────────────────────────────────────────────────
  const [testScenario, setTestScenario] = useState<'success' | 'fail'>('success');

  // ── Autofill nombre ──────────────────────────────────────────
  useEffect(() => {
    if (user && !cardName) {
      setCardName(`${user.name} ${user.last_name}`.toUpperCase());
    }
  }, [user, cardName]);

  // Auto-cargar tarjeta de prueba al ingresar al paso de pago si está vacío
  useEffect(() => {
    if (checkoutStep === 'payment' && !cardNumber) {
      fillTestCard('success');
    }
  }, [checkoutStep, cardNumber]);

  // Resetear estado al abrir modal
  useEffect(() => {
    if (isPremiumModalOpen) {
      setCheckoutStep('summary');
      setErrorMessage(null);
      setLoadingProgress(0);
    }
  }, [isPremiumModalOpen]);

  // ── Navegación de pasos ──────────────────────────────────────
  const goTo = (step: CheckoutStep) => {
    sound.playClick();
    setPrevStep(checkoutStep);
    setCheckoutStep(step);
  };

  const goBack = () => {
    sound.playClick();
    if (checkoutStep === 'payment') goTo('summary');
    if (checkoutStep === 'error')   goTo('payment');
  };

  // ── Formateadores ────────────────────────────────────────────
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const fmt = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(fmt);
    validateField('cardNumber', fmt);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    setCardExpiry(raw);
    validateField('cardExpiry', raw);
  };

  // ── Validación en tiempo real ────────────────────────────────
  const validateField = (field: string, value: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
    let error: FieldError = { message: '', valid: true };

    switch (field) {
      case 'cardName':
        if (!value.trim() || value.trim().length < 2) {
          error = { message: 'Ingresa el nombre tal como aparece en la tarjeta', valid: false };
        }
        break;
      case 'cardNumber': {
        const clean = value.replace(/\D/g, '');
        if (!isTestCard(clean) && !luhnCheck(value)) {
          error = { message: 'Número de tarjeta inválido', valid: false };
        }
        break;
      }
      case 'cardExpiry': {
        const parts = value.split('/');
        const month = parseInt(parts[0], 10);
        const year  = parseInt(`20${parts[1]}`, 10);
        const now   = new Date();
        const expDate = new Date(year, month, 0); // último día del mes
        if (!parts[1] || isNaN(month) || month < 1 || month > 12 || expDate < now) {
          error = { message: 'Fecha inválida o tarjeta vencida', valid: false };
        }
        break;
      }
      case 'cardCvc': {
        const brand = getCardBrand(cardNumber);
        const len = brand === 'AMEX' ? 4 : 3;
        if (value.length < len) {
          error = { message: `CVC debe tener ${len} dígitos`, valid: false };
        }
        break;
      }
    }

    setFieldErrors(prev => ({ ...prev, [field]: error }));
  };

  const shakeField = (field: string) => {
    setShakingField(field);
    setTimeout(() => setShakingField(null), 600);
  };

  const isFormValid = (): boolean => {
    const cleanNum = cardNumber.replace(/\D/g, '');
    const isCardValid = (isTestCard(cleanNum) && cleanNum.length >= 16) || luhnCheck(cardNumber);
    const isNameValid = cardName.trim().length >= 2 || Boolean(user);
    const isExpiryValid = cardExpiry.includes('/') && cardExpiry.length >= 4;
    const isCvcValid = cardCvc.length >= 3;
    return Boolean(isCardValid && isNameValid && isExpiryValid && isCvcValid);
  };

  // ── Llenado de tarjetas de prueba (sandbox) ──────────────────
  const fillTestCard = (type: 'success' | 'fail') => {
    sound.playClick();
    setTestScenario(type);
    if (!cardName) {
      setCardName(user ? `${user.name} ${user.last_name}`.toUpperCase() : 'TITULAR DE LA TARJETA');
    }
    if (type === 'success') {
      setCardNumber('4242 4242 4242 4242');
      setCardExpiry('12/28');
      setCardCvc('123');
    } else {
      setCardNumber('5555 5555 5555 5555');
      setCardExpiry('08/27');
      setCardCvc('000');
    }
    // Marcar campos como válidos para sandbox
    setFieldErrors({
      cardName:   { message: '', valid: true },
      cardNumber: { message: '', valid: true },
      cardExpiry: { message: '', valid: true },
      cardCvc:    { message: '', valid: true },
    });
    setTouchedFields(new Set(['cardName', 'cardNumber', 'cardExpiry', 'cardCvc']));
  };

  // ── Procesamiento del pago ────────────────────────────────────
  const handleProcessPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!user) {
      sound.playError();
      setErrorMessage('Debes iniciar sesión con tu cuenta para activar la licencia Premium.');
      goTo('error');
      return;
    }

    // Validar todos los campos antes de procesar
    if (paymentMethod === 'card') {
      const currentName = cardName.trim() || `${user.name} ${user.last_name}`.toUpperCase();
      if (!cardName.trim()) setCardName(currentName);

      validateField('cardName',   currentName);
      validateField('cardNumber', cardNumber);
      validateField('cardExpiry', cardExpiry);
      validateField('cardCvc',    cardCvc);

      if (!isFormValid()) {
        sound.playError();
        ['cardName', 'cardNumber', 'cardExpiry', 'cardCvc'].forEach(f => shakeField(f));
        return;
      }
    }

    setLoading(true);
    setErrorMessage(null);
    setLoadingProgress(10);
    setLoadingStage(0);
    goTo('processing');

    try {
      // Etapa 1: Cifrado bancario
      setLoadingStep('Cifrando credenciales bancarias con TLS 1.3 / AES-256...');
      for (let p = 10; p <= 30; p += 5) {
        await new Promise(r => setTimeout(r, 25));
        setLoadingProgress(p);
      }

      // Etapa 2: Autorización con red de pagos
      setLoadingStep('Contactando red adquirente y validando fondos...');
      setLoadingStage(1);

      const initRes = await paymentApi.initSandbox();
      if (!initRes.data?.success || !initRes.data.transaction) {
        throw new Error(initRes.error || 'No se pudo iniciar la transacción bancaria.');
      }
      const txId = initRes.data.transaction.transactionId;

      for (let p = 30; p <= 70; p += 5) {
        await new Promise(r => setTimeout(r, 20));
        setLoadingProgress(p);
      }

      // Etapa 3: Activación de licencia
      setLoadingStep('Activando tu licencia Premium Vitalicia...');
      setLoadingStage(2);
      const cleanNum = cardNumber.replace(/\D/g, '');
      const simulateSuccess = testScenario === 'success' && !cleanNum.startsWith('5555');
      const confirmRes = await paymentApi.confirmSandbox(txId, simulateSuccess);

      if (!confirmRes.data?.success) {
        throw new Error(
          confirmRes.error || 'La tarjeta fue declinada por la entidad emisora (Fondos insuficientes o fondos retenidos).'
        );
      }

      for (let p = 70; p <= 100; p += 5) {
        await new Promise(r => setTimeout(r, 20));
        setLoadingProgress(p);
      }

      await refreshProfile();
      sound.playSuccess();
      goTo('success');
    } catch (err: any) {
      sound.playError();
      setErrorMessage(err.message || 'Ocurrió un error al procesar el pago.');
      goTo('error');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleStripeCheckout = async () => {
    setLoading(true);
    setErrorMessage(null);
    const res = await paymentApi.createCheckout();
    setLoading(false);
    if (res.data?.checkoutUrl) {
      window.location.href = res.data.checkoutUrl;
    } else {
      setErrorMessage('Stripe requiere configuración adicional. Usa la pasarela directa a continuación.');
    }
  };

  // ── Campo de formulario con validación visual ─────────────────
  const FormField: React.FC<{
    id: string;
    label: string;
    children: React.ReactNode;
    hint?: string;
  }> = ({ id, label, children, hint }) => {
    const err = fieldErrors[id];
    const touched = touchedFields.has(id);
    const isShaking = shakingField === id;

    return (
      <div className={isShaking ? 'animate-shake' : ''}>
        <label htmlFor={id} className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
          {label}
        </label>
        <div className="relative">
          {children}
          {/* Icono de estado en la derecha del campo */}
          {touched && err && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              {err.valid
                ? <Check className="w-4 h-4 text-emerald-500 animate-scaleIn" />
                : <AlertCircle className="w-4 h-4 text-red-500 animate-scaleIn" />
              }
            </div>
          )}
        </div>
        {touched && err && !err.valid && (
          <p className="mt-1 text-[11px] text-red-500 dark:text-red-400 animate-fadeIn flex items-center gap-1">
            <span>{err.message}</span>
          </p>
        )}
        {hint && !touched && (
          <p className="mt-1 text-[10px] text-slate-400">{hint}</p>
        )}
      </div>
    );
  };

  const inputClass = (fieldId: string, extra = '') => {
    const err = fieldErrors[fieldId];
    const touched = touchedFields.has(fieldId);
    const base = `w-full px-3.5 py-3 rounded-xl border text-sm font-medium transition-all duration-200 outline-none bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 ${extra}`;
    if (!touched) return `${base} border-slate-200 dark:border-slate-700 focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500`;
    if (err?.valid) return `${base} border-emerald-400 dark:border-emerald-600 ring-1 ring-emerald-400/30`;
    return `${base} border-red-400 dark:border-red-600 ring-1 ring-red-400/30 focus:ring-2 focus:ring-red-500/30`;
  };

  const currentBrand = getCardBrand(cardNumber);

  // ================================================================
  // RENDERIZADO SEGÚN EL PASO ACTUAL
  // ================================================================

  // ── PASO 1: RESUMEN DEL PLAN ──────────────────────────────────
  const renderSummaryStep = () => (
    <div className="animate-stepEnter space-y-5">

      {/* Hero de precio */}
      <div className="relative rounded-2xl overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 border border-blue-900/40 p-6 text-white shadow-xl shadow-blue-950/30">
        {/* Luces decorativas */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-indigo-500/15 rounded-full blur-xl pointer-events-none" />

        <div className="relative z-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-black mb-3">
            <Crown className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
            <span>LICENCIA INSTITUCIONAL • TARIFA ESPECIAL</span>
          </div>

          <div className="flex items-end gap-3 mb-1">
            <span className="text-5xl font-black tracking-tight">$2</span>
            <div className="mb-2">
              <span className="text-lg font-bold text-white/80">.00 USD</span>
              <div className="text-sm text-white/60 line-through">$19.99 USD</div>
            </div>
            <div className="mb-2 ml-auto">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-black">AHORRA $17.99</span>
            </div>
          </div>

          <p className="text-sm text-slate-300 font-medium">
            Licencia <strong className="text-white">Editorial Vitalicia</strong> — Un único pago institucional, acceso para siempre.
          </p>
        </div>
      </div>

      {/* Lista de beneficios */}
      <div className="space-y-2.5">
        <span className="text-[11px] font-bold uppercase tracking-widest text-slate-400 block">Incluido en tu licencia:</span>
        <ul className="space-y-2">
          {[
            { icon: <Infinity className="w-3.5 h-3.5" />, colorClass: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400', title: 'Auditorías ilimitadas', desc: 'Textos y documentos Word (.docx) sin límite diario.' },
            { icon: <FileCheck2 className="w-3.5 h-3.5" />, colorClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300', title: 'Reescritura estilométrica', desc: 'Asistencia editorial para balance sintáctico y fluidez natural.' },
            { icon: <Zap className="w-3.5 h-3.5" />, colorClass: 'bg-blue-100 dark:bg-blue-950/80 text-blue-600 dark:text-blue-400', title: 'Descarga de informes .docx', desc: 'Reporte académico editable con desglose de perplejidad.' },
            { icon: <ShieldCheck className="w-3.5 h-3.5" />, colorClass: 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400', title: 'Garantía 30 días', desc: 'Reembolso completo sin condiciones.' },
          ].map((item, i) => (
            <li
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/50"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              <div className={`p-1.5 rounded-lg ${item.colorClass} shrink-0 mt-0.5`}>
                {item.icon}
              </div>
              <div>
                <span className="text-xs font-bold text-slate-900 dark:text-white block">{item.title}</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{item.desc}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Rating + Testimonios */}
      <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-100 dark:border-amber-900/50">
        <div className="flex text-amber-400">
          {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
        </div>
        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">4.9/5</span>
        <span className="text-xs text-slate-400">• Más de 1,200 investigadores y estudiantes</span>
      </div>

      {/* Sellos de seguridad */}
      <div className="grid grid-cols-3 gap-2 py-1 border-y border-slate-100 dark:border-slate-800">
        {[
          { icon: <Lock className="w-3.5 h-3.5 text-emerald-500" />, label: 'TLS 1.3 256-bit' },
          { icon: <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />, label: 'PCI-DSS Niv.1' },
          { icon: <BadgeCheck className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />, label: 'Stripe Verified' },
        ].map((s, i) => (
          <div key={i} className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-500 dark:text-slate-400">
            {s.icon} {s.label}
          </div>
        ))}
      </div>

      {/* CTA principal */}
      <button
        onClick={() => goTo('payment')}
        className="relative w-full py-4 px-6 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 hover:from-blue-600 hover:via-indigo-600 hover:to-slate-800 text-white font-black text-sm shadow-xl shadow-blue-900/25 transition-all hover:scale-[1.015] active:scale-[0.985] overflow-hidden group flex items-center justify-center gap-2"
      >
        <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer pointer-events-none" />
        <Lock className="w-4 h-4" />
        <span>Continuar al Pago — $2.00 USD</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>

      <p className="text-center text-[11px] text-slate-400">
        🔒 Pago 100% seguro. Sin suscripciones ni cargos ocultos.
      </p>
    </div>
  );

  // ── PASO 2: FORMULARIO DE PAGO ────────────────────────────────
  const renderPaymentStep = () => (
    <div className="animate-stepEnter space-y-5">

      {/* Selector de método de pago */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800 rounded-2xl">
        {([
          { key: 'card',    icon: <CreditCard className="w-4 h-4" />, label: 'Tarjeta' },
          { key: 'express', icon: <Smartphone className="w-4 h-4" />, label: 'Apple/Google' },
          { key: 'pse',     icon: <Building className="w-4 h-4" />,   label: 'PSE' },
        ] as const).map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => { sound.playToggle(); setPaymentMethod(tab.key); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-bold transition-all duration-200 ${
              paymentMethod === tab.key
                ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            {tab.icon}
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        ))}
      </div>

      {/* ── TARJETA ─────────────────────────────────────────────── */}
      {paymentMethod === 'card' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Selector de skin */}
          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <Layers className="w-3 h-3 text-indigo-400" /> Estilo de tarjeta:
            </span>
            <div className="flex items-center gap-2">
              {([
                { skin: 'obsidian', bg: 'bg-slate-900',   ring: 'ring-blue-500'    },
                { skin: 'amethyst', bg: 'bg-purple-700',  ring: 'ring-purple-400'  },
                { skin: 'emerald',  bg: 'bg-emerald-600', ring: 'ring-emerald-400' },
              ] as const).map(s => (
                <button
                  key={s.skin}
                  type="button"
                  onClick={() => { sound.playToggle(); setCardSkin(s.skin); }}
                  title={s.skin}
                  className={`w-4 h-4 rounded-full ${s.bg} border-2 transition-all ${
                    cardSkin === s.skin ? `${s.ring} ring-2 ring-offset-1 scale-125` : 'border-transparent opacity-60'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Tarjeta 3D */}
          <VirtualCard
            cardNumber={cardNumber}
            cardName={cardName}
            cardExpiry={cardExpiry}
            skin={cardSkin}
          />

          {/* Simulador sandbox */}
          <div className="flex items-center gap-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 flex-wrap">
            <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300 text-[11px] font-bold">
              <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              Tarjetas de prueba:
            </div>
            <div className="flex gap-1.5 ml-auto">
              <button type="button" onClick={() => fillTestCard('success')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  testScenario === 'success' && cardNumber.startsWith('4242')
                    ? 'bg-emerald-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                <Check className="w-3 h-3" /> Aprobada
              </button>
              <button type="button" onClick={() => fillTestCard('fail')}
                className={`px-3 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 ${
                  cardNumber.startsWith('5555')
                    ? 'bg-red-600 text-white shadow-md' : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700'
                }`}>
                Declinada
              </button>
            </div>
          </div>

          {/* Formulario */}
          <form onSubmit={handleProcessPayment} className="space-y-4">
            {/* Nombre titular */}
            <FormField id="cardName" label="Nombre del Titular">
              <div className="relative">
                <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="cardName"
                  type="text"
                  required
                  autoComplete="cc-name"
                  value={cardName}
                  onChange={e => { setCardName(e.target.value.toUpperCase()); validateField('cardName', e.target.value); }}
                  onBlur={e => validateField('cardName', e.target.value)}
                  placeholder="COMO APARECE EN EL PLÁSTICO"
                  className={inputClass('cardName', 'pl-10 pr-10 font-semibold tracking-wide')}
                />
              </div>
            </FormField>

            {/* Número de tarjeta */}
            <FormField id="cardNumber" label="Número de Tarjeta">
              <div className="relative">
                <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  id="cardNumber"
                  type="text"
                  required
                  autoComplete="cc-number"
                  inputMode="numeric"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  onBlur={e => validateField('cardNumber', e.target.value)}
                  placeholder="4242 4242 4242 4242"
                  className={inputClass('cardNumber', 'pl-10 pr-20 font-mono font-bold tracking-widest')}
                />
                {/* Badge de franquicia inline */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {currentBrand === 'VISA' && (
                    <span className="font-black italic text-[13px] text-slate-700 dark:text-slate-200">VISA</span>
                  )}
                  {currentBrand === 'MASTERCARD' && (
                    <div className="flex -space-x-1.5">
                      <div className="w-4 h-4 rounded-full bg-[#EB001B]" />
                      <div className="w-4 h-4 rounded-full bg-[#F79E1B] opacity-90" />
                    </div>
                  )}
                  {currentBrand === 'AMEX' && (
                    <span className="text-[9px] font-black italic px-1 rounded bg-[#007AC1] text-white">AMEX</span>
                  )}
                </div>
              </div>
            </FormField>

            {/* Expiración + CVC + CP */}
            <div className="grid grid-cols-3 gap-3">
              <FormField id="cardExpiry" label="MM/AA">
                <input
                  id="cardExpiry"
                  type="text"
                  required
                  autoComplete="cc-exp"
                  inputMode="numeric"
                  value={cardExpiry}
                  onChange={handleExpiryChange}
                  onBlur={e => validateField('cardExpiry', e.target.value)}
                  placeholder="12/28"
                  className={inputClass('cardExpiry', 'text-center font-mono font-bold pr-6')}
                />
              </FormField>

              <FormField id="cardCvc" label="CVC / CVV">
                <div className="relative">
                  <input
                    id="cardCvc"
                    type="password"
                    required
                    autoComplete="cc-csc"
                    inputMode="numeric"
                    maxLength={currentBrand === 'AMEX' ? 4 : 3}
                    value={cardCvc}
                    onChange={e => { setCardCvc(e.target.value.replace(/\D/g, '')); validateField('cardCvc', e.target.value); }}
                    onBlur={e => validateField('cardCvc', e.target.value)}
                    placeholder="•••"
                    className={inputClass('cardCvc', 'text-center font-mono font-bold pl-3 pr-8')}
                  />
                  <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </FormField>

              <FormField id="zipCode" label="C. Postal">
                <input
                  id="zipCode"
                  type="text"
                  autoComplete="postal-code"
                  inputMode="numeric"
                  value={zipCode}
                  onChange={e => setZipCode(e.target.value)}
                  placeholder="110111"
                  className={inputClass('zipCode', 'text-center font-medium')}
                />
              </FormField>
            </div>

            {/* Botón de pago */}
            <button
              type="submit"
              disabled={loading}
              className="relative w-full py-4 px-5 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 hover:from-blue-600 hover:via-indigo-600 hover:to-slate-800 text-white font-black text-sm shadow-xl shadow-blue-900/25 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 overflow-hidden flex items-center justify-center gap-2 group"
            >
              <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer pointer-events-none" />
              <Lock className="w-4 h-4" />
              <span>Pagar $2.00 USD — Acceso Vitalicio</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>

            {/* Link a Stripe externo */}
            <div className="text-center">
              <button type="button" onClick={handleStripeCheckout} disabled={loading}
                className="text-[11px] text-slate-400 hover:text-indigo-500 transition-colors inline-flex items-center gap-1 font-medium">
                <Globe className="w-3 h-3" />
                <span>Pagar en ventana externa (Stripe Checkout)</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ── APPLE / GOOGLE PAY ───────────────────────────────────── */}
      {paymentMethod === 'express' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center mx-auto shadow-lg shadow-indigo-500/30">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Pago rápido con biometría</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
              Autoriza instantáneamente con Face ID, Touch ID o tu cuenta de Google.
            </p>
          </div>

          <button type="button" onClick={() => handleProcessPayment()} disabled={loading}
            className="w-full py-4 rounded-2xl bg-black hover:bg-neutral-900 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]">
            <span className="text-lg"></span>
            <span>Pagar $2.00 con Apple Pay</span>
          </button>

          <button type="button" onClick={() => handleProcessPayment()} disabled={loading}
            className="w-full py-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm border border-slate-300 dark:border-slate-600 shadow-md flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.98]">
            <span className="font-black text-blue-500">G</span>
            <span className="font-bold">Pagar $2.00 con Google Pay</span>
          </button>
        </div>
      )}

      {/* ── PSE ─────────────────────────────────────────────────── */}
      {paymentMethod === 'pse' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900 flex items-center justify-between">
            <div>
              <span className="text-[10px] uppercase font-bold text-blue-500 block">Conversión automática</span>
              <span className="text-xl font-black text-slate-900 dark:text-white">$8,500 COP</span>
            </div>
            <span className="text-xs text-slate-500 font-medium">≈ $2.00 USD</span>
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Banco</label>
              <select value={pseBank} onChange={e => setPseBank(e.target.value)}
                className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                {[
                  ['bancolombia', 'Bancolombia'], ['nequi', 'Nequi'], ['davivienda', 'Davivienda / Daviplata'],
                  ['bbva', 'BBVA Colombia'], ['bogota', 'Banco de Bogotá'], ['occidente', 'Banco de Occidente'], ['scotiabank', 'Scotiabank Colpatria'],
                ].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Tipo Doc.</label>
                <select value={pseDocType} onChange={e => setPseDocType(e.target.value)}
                  className="w-full px-2 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40">
                  {[['CC', 'C.C.'], ['CE', 'C.E.'], ['NIT', 'NIT'], ['PAS', 'Pasaporte']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </select>
              </div>
              <div className="col-span-2">
                <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">Número de Documento</label>
                <input type="text" inputMode="numeric" value={pseDocNumber} onChange={e => setPseDocNumber(e.target.value)}
                  placeholder="Ej: 1020304050"
                  className="w-full px-3.5 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/40" />
              </div>
            </div>
          </div>

          <button type="button" onClick={() => handleProcessPayment()} disabled={loading}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-500 hover:to-indigo-600 text-white font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all hover:scale-[1.01]">
            <Building className="w-4 h-4" />
            <span>Continuar con PSE — $8,500 COP</span>
          </button>
        </div>
      )}
    </div>
  );

  // ── PASO 3: PROCESANDO ────────────────────────────────────────
  const renderProcessingStep = () => {
    const stages = [
      { icon: <Lock className="w-5 h-5" />,        label: 'Cifrando conexión TLS 1.3...',         activeClass: 'bg-blue-100 dark:bg-blue-950/80 text-blue-500' },
      { icon: <Building className="w-5 h-5" />,    label: 'Validando con entidad emisora...',     activeClass: 'bg-indigo-100 dark:bg-indigo-950/80 text-indigo-500' },
      { icon: <ShieldCheck className="w-5 h-5" />, label: 'Activando licencia institucional...',  activeClass: 'bg-blue-100 dark:bg-blue-950/80 text-blue-500' },
    ];

    return (
      <div className="flex flex-col items-center justify-center py-8 space-y-8 animate-fadeIn">
        {/* Ícono central animado */}
        <div className="relative w-24 h-24 flex items-center justify-center">
          <div className="absolute inset-0 rounded-full bg-indigo-500/20 animate-ping" />
          <div className="absolute inset-2 rounded-full bg-indigo-500/30 animate-pulse" />
          <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-indigo-600 to-violet-600 flex items-center justify-center shadow-xl shadow-indigo-500/40 z-10">
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </div>
        </div>

        <div className="w-full max-w-xs space-y-2">
          <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-slate-400 mb-1">
            <span>Procesando pago seguro</span>
            <span>{Math.round(loadingProgress)}%</span>
          </div>
          {/* Barra de progreso */}
          <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-violet-500 to-purple-500 transition-all duration-200 ease-out animate-progressPulse"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>

        {/* Etapas */}
        <div className="w-full max-w-xs space-y-3">
          {stages.map((stage, i) => (
            <div key={i} className={`flex items-center gap-3 p-3 rounded-xl transition-all duration-500 ${
              i === loadingStage
                ? 'bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800'
                : i < loadingStage
                ? 'opacity-60'
                : 'opacity-30'
            }`}>
              <div className={`p-2 rounded-lg ${
                i < loadingStage  ? 'bg-emerald-100 dark:bg-emerald-950/80 text-emerald-500'
                : i === loadingStage ? stage.activeClass
                : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              }`}>
                {i < loadingStage ? <Check className="w-5 h-5" /> : stage.icon}
              </div>
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{stage.label}</span>
              {i === loadingStage && <Loader2 className="w-3.5 h-3.5 text-indigo-500 animate-spin ml-auto" />}
            </div>
          ))}
        </div>

        <p className="text-[11px] text-slate-400 text-center max-w-xs">
          No cierres esta ventana. Tu transacción está siendo procesada de forma segura.
        </p>
      </div>
    );
  };

  // ── PANTALLA DE ÉXITO ─────────────────────────────────────────
  const renderSuccessScreen = () => (
    <div className="flex flex-col items-center justify-center py-6 space-y-6 animate-scaleIn">
      {/* Partículas de confetti */}
      <div className="absolute inset-x-0 top-0 pointer-events-none overflow-hidden h-48">
        {[
          { left: '10%',  color: 'bg-indigo-500', cls: 'animate-confetti-1', size: 'w-2 h-2' },
          { left: '25%',  color: 'bg-violet-500', cls: 'animate-confetti-2', size: 'w-1.5 h-3' },
          { left: '40%',  color: 'bg-amber-400',  cls: 'animate-confetti-3', size: 'w-2 h-2' },
          { left: '55%',  color: 'bg-emerald-500',cls: 'animate-confetti-4', size: 'w-1.5 h-1.5' },
          { left: '70%',  color: 'bg-pink-500',   cls: 'animate-confetti-5', size: 'w-2 h-3' },
          { left: '80%',  color: 'bg-blue-400',   cls: 'animate-confetti-6', size: 'w-1.5 h-2' },
          { left: '90%',  color: 'bg-indigo-400', cls: 'animate-confetti-7', size: 'w-2 h-2' },
          { left: '5%',   color: 'bg-purple-500', cls: 'animate-confetti-8', size: 'w-1.5 h-3' },
        ].map((p, i) => (
          <div key={i} className={`absolute ${p.size} ${p.color} rounded-sm ${p.cls} opacity-0`}
            style={{ left: p.left, top: '0px' }} />
        ))}
      </div>

      {/* Check SVG animado */}
      <div className="relative w-28 h-28 flex items-center justify-center">
        <div className="absolute inset-0 rounded-full bg-emerald-100 dark:bg-emerald-950/60 animate-scaleIn" />
        <svg viewBox="0 0 100 100" className="w-24 h-24 z-10" fill="none">
          <circle
            cx="50" cy="50" r="45"
            stroke="#10B981" strokeWidth="4"
            className="animate-circleDraw"
          />
          <path
            d="M 28 52 L 44 68 L 72 36"
            stroke="#10B981" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round"
            className="animate-checkDraw"
          />
        </svg>
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-2xl font-black text-slate-900 dark:text-white">¡Pago Exitoso!</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
          Tu cuenta ahora tiene acceso <strong className="text-slate-900 dark:text-white">Premium Vitalicio</strong>. Todo desbloqueado.
        </p>
      </div>

      {/* Resumen del pedido */}
      <div className="w-full max-w-xs p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-2.5">
        {[
          { label: 'Plan',    value: 'Premium Vitalicio' },
          { label: 'Monto',   value: '$2.00 USD' },
          { label: 'Estado',  value: '✅ Aprobado', green: true },
          { label: 'Fecha',   value: new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' }) },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between text-xs">
            <span className="text-slate-500 dark:text-slate-400">{row.label}</span>
            <span className={`font-bold ${row.green ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-white'}`}>{row.value}</span>
          </div>
        ))}
      </div>

      <button
        onClick={() => { sound.playClick(); closePremiumModal(); }}
        className="relative w-full max-w-xs py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-sm shadow-xl shadow-emerald-500/30 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 overflow-hidden group"
      >
        <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer pointer-events-none" />
        <ShieldCheck className="w-4 h-4" />
        <span>Explorar Veritas AI Premium</span>
        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  );

  // ── PANTALLA DE ERROR ─────────────────────────────────────────
  const renderErrorScreen = () => (
    <div className="flex flex-col items-center justify-center py-8 space-y-6 animate-stepEnter">
      {/* Ícono de error */}
      <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-950/60 flex items-center justify-center shadow-lg shadow-red-500/20">
        <AlertCircle className="w-10 h-10 text-red-500" />
      </div>

      <div className="text-center space-y-2">
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Pago no procesado</h2>
        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-xs">
          No se realizó ningún cargo a tu cuenta. Revisa los datos e intenta nuevamente.
        </p>
      </div>

      {/* Mensaje de error */}
      {errorMessage && (
        <div className="w-full max-w-xs p-4 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900">
          <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed font-medium">{errorMessage}</p>
        </div>
      )}

      {/* Posibles causas */}
      <div className="w-full max-w-xs p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700 space-y-2">
        <p className="text-[11px] font-bold uppercase tracking-wide text-slate-400 mb-2">Posibles causas:</p>
        {[
          'Fondos insuficientes o límite excedido',
          'Tarjeta de prueba en modo rechazo (5555...)',
          'Tarjeta no habilitada para pagos en línea',
          'Entidad bancaria rechazó la solicitud por seguridad',
        ].map((cause, i) => (
          <div key={i} className="flex items-start gap-2 text-xs text-slate-600 dark:text-slate-400">
            <span className="text-slate-400 shrink-0 mt-0.5">•</span>
            <span>{cause}</span>
          </div>
        ))}
      </div>

      {/* Botones de recuperación */}
      <div className="w-full max-w-xs space-y-2.5">
        {!user ? (
          <a
            href="/login"
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-black text-sm shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01] block text-center"
          >
            <UserIcon className="w-4 h-4" />
            <span>Iniciar Sesión para Activar</span>
          </a>
        ) : (
          <>
            <button
              onClick={() => { setErrorMessage(null); goTo('payment'); }}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-black text-sm shadow-lg shadow-indigo-500/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Intentar nuevamente</span>
            </button>

            <button
              onClick={() => { setErrorMessage(null); setPaymentMethod('express'); goTo('payment'); }}
              className="w-full py-3.5 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-sm border border-slate-200 dark:border-slate-700 flex items-center justify-center gap-2 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>Usar otro método de pago</span>
            </button>
          </>
        )}

        <div className="text-center pt-1">
          <button
            onClick={() => goTo('summary')}
            className="text-[11px] text-slate-400 hover:text-indigo-500 transition-colors inline-flex items-center gap-1"
          >
            <ArrowLeft className="w-3 h-3" />
            <span>Volver al resumen</span>
          </button>
        </div>
      </div>

      {/* Soporte */}
      <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
        <MessageCircle className="w-3.5 h-3.5" />
        <span>¿Necesitas ayuda? Escríbenos a <span className="text-indigo-500 font-medium">soporte@veritas.ai</span></span>
      </div>
    </div>
  );

  // ================================================================
  // RENDER PRINCIPAL
  // ================================================================
  if (!isPremiumModalOpen) return null;

  const isFullscreen = checkoutStep === 'success' || checkoutStep === 'processing';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-xl animate-fadeIn">
      {/* Luces ambientales */}
      <div className="fixed top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="fixed bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      <div className="flex min-h-full items-center justify-center p-3 sm:p-5">
        {/* Contenedor principal */}
        <div className={`relative w-full bg-white dark:bg-slate-900 rounded-[28px] shadow-[0_25px_80px_rgba(0,0,0,0.45)] border border-slate-200/90 dark:border-slate-800/90 overflow-hidden my-auto animate-slideUp transition-all duration-300 ${
          isFullscreen ? 'max-w-md' : 'max-w-4xl'
        }`}>
          {/* Borde superior gradiente */}
          <div className="h-[3px] w-full shrink-0 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

          {/* Botón de cierre */}
          {checkoutStep !== 'processing' && (
            <button
              onClick={() => { sound.playClick(); closePremiumModal(); }}
              className="absolute top-4 right-4 z-30 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 backdrop-blur-sm transition-all"
              title="Cerrar"
            >
              <X className="w-5 h-5" />
            </button>
          )}

          {/* Layout de pantallas fullscreen (success / processing) */}
          {isFullscreen ? (
            <div className="p-6 sm:p-8 min-h-[440px] flex flex-col justify-center">
              {checkoutStep === 'processing' && renderProcessingStep()}
              {checkoutStep === 'success'    && renderSuccessScreen()}
            </div>
          ) : (
            /* Layout de 2 columnas para el flujo normal */
            <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[580px]">

              {/* ── COLUMNA IZQUIERDA: SIEMPRE VISIBLE (resumen compacto) ── */}
              <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 to-slate-100/90 dark:from-slate-950 dark:to-slate-900/90 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-6">
                <div className="space-y-5">
                  {/* Badge Veritas AI */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <VeritasLogo variant="compact" size="md" />
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <BadgeCheck className="w-2.5 h-2.5" /> Oficial
                      </span>
                    </div>
                    <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span>En Línea</span>
                    </div>
                  </div>

                  {/* Precio compacto en col izquierda */}
                  <div className="p-4 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">Plan Vitalicio</span>
                        <div className="flex items-baseline gap-1 mt-0.5">
                          <span className="text-3xl font-black text-slate-900 dark:text-white">$2.00</span>
                          <span className="text-xs text-slate-400 font-bold">USD</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-slate-400 line-through block">$19.99</span>
                        <span className="px-1.5 py-0.5 rounded bg-rose-100 dark:bg-rose-950 text-rose-600 dark:text-rose-400 text-[10px] font-black border border-rose-200 dark:border-rose-900">90% OFF</span>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                      <Check className="w-3 h-3" /> Pago único — sin mensualidades
                    </div>
                  </div>

                  {/* Beneficios compactos */}
                  <ul className="space-y-2 text-xs">
                    {[
                      { icon: <Check className="w-3 h-3" />, colorClass: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400', text: 'Auditorías ilimitadas de texto y .docx' },
                      { icon: <FileCheck2 className="w-3 h-3" />, colorClass: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400', text: 'Reescritura estilométrica avanzada' },
                      { icon: <Zap className="w-3 h-3" />, colorClass: 'bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400', text: 'Descargas .docx completas sin límite' },
                      { icon: <ShieldCheck className="w-3 h-3" />, colorClass: 'bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400', text: 'Garantía 30 días — 100% de reembolso' },
                    ].map((b, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <div className={`p-0.5 rounded-full ${b.colorClass} mt-0.5 shrink-0`}>{b.icon}</div>
                        <span className="text-slate-600 dark:text-slate-300">{b.text}</span>
                      </li>
                    ))}
                  </ul>

                  {/* Rating */}
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800">
                    <div className="flex text-amber-400">
                      {[...Array(5)].map((_, i) => <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />)}
                    </div>
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">
                      <strong className="text-slate-800 dark:text-slate-200">4.9/5</strong> — +2,400 usuarios
                    </span>
                  </div>
                </div>

                {/* Sellos en el footer de col izquierda */}
                <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 font-semibold">
                  <span className="flex items-center gap-1"><Lock className="w-3.5 h-3.5 text-emerald-500" /> SSL 256-Bit</span>
                  <span>PCI-DSS Niv.1</span>
                  <span>Stripe Verified</span>
                </div>
              </div>

              {/* ── COLUMNA DERECHA: PASO ACTIVO ─────────────────────────── */}
              <div className="lg:col-span-7 p-6 sm:p-8 bg-white dark:bg-slate-900 flex flex-col justify-between space-y-4">
                <div>
                  {/* Step Indicator */}
                  <StepIndicator currentStep={checkoutStep} />

                  {/* Botón volver (solo en payment y error) */}
                  {(checkoutStep === 'payment' || checkoutStep === 'error') && (
                    <button onClick={goBack}
                      className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-indigo-500 transition-colors mb-4 -mt-2 w-fit">
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>{checkoutStep === 'payment' ? 'Volver al resumen' : 'Volver al pago'}</span>
                    </button>
                  )}

                  {/* Contenido del paso activo */}
                  <div>
                    {checkoutStep === 'summary' && renderSummaryStep()}
                    {checkoutStep === 'payment' && renderPaymentStep()}
                    {checkoutStep === 'error'   && renderErrorScreen()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
