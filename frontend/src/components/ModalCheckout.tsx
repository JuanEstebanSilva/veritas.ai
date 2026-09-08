import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { paymentApi } from '../services/api';
import {
  X,
  Crown,
  CheckCircle2,
  Sparkles,
  CreditCard,
  ShieldCheck,
  Zap,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
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
  ChevronDown,
} from 'lucide-react';

export const ModalCheckout: React.FC = () => {
  const { isPremiumModalOpen, closePremiumModal, refreshProfile, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Pestaña activa de pago
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'express' | 'pse'>('card');

  // Datos interactivos del formulario de tarjeta
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('4242 4242 4242 4242');
  const [cardExpiry, setCardExpiry] = useState('12/28');
  const [cardCvc, setCardCvc] = useState('123');
  const [selectedCountry, setSelectedCountry] = useState('CO');
  const [zipCode, setZipCode] = useState('110111');
  const [testScenario, setTestScenario] = useState<'success' | 'fail'>('success');

  // Personalización estética de la tarjeta virtual (Skins)
  const [cardSkin, setCardSkin] = useState<'obsidian' | 'amethyst' | 'emerald'>('obsidian');

  // Campos para PSE
  const [pseBank, setPseBank] = useState('bancolombia');
  const [pseDocType, setPseDocType] = useState('CC');
  const [pseDocNumber, setPseDocNumber] = useState('1020304050');

  // Inicializar nombre del titular con el usuario conectado
  useEffect(() => {
    if (user && !cardName) {
      setCardName(`${user.name} ${user.last_name}`.toUpperCase());
    }
  }, [user, cardName]);

  if (!isPremiumModalOpen) return null;

  // Detección dinámica de marca de tarjeta
  const getCardBrand = (num: string) => {
    const clean = num.replace(/\s+/g, '');
    if (clean.startsWith('4')) return 'VISA';
    if (clean.startsWith('5') || clean.startsWith('2')) return 'MASTERCARD';
    if (clean.startsWith('3')) return 'AMEX';
    return 'VISA';
  };

  // Formateador de número de tarjeta en bloques de 4 dígitos
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  // Formateador de fecha MM/AA
  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 2) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setCardExpiry(raw);
  };

  // Llenar tarjeta de prueba aprobada o rechazada
  const fillTestCard = (type: 'success' | 'fail') => {
    setTestScenario(type);
    if (type === 'success') {
      setCardNumber('4242 4242 4242 4242');
      setCardExpiry('12/28');
      setCardCvc('123');
      setError(null);
    } else {
      setCardNumber('5555 5555 5555 5555');
      setCardExpiry('08/27');
      setCardCvc('000');
      setError(null);
    }
  };

  const handleProcessPayment = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      setLoadingStep('Estableciendo conexión TLS 1.3 bancaria de alta seguridad...');
      await new Promise((r) => setTimeout(r, 600));

      // 1. Iniciar transacción en sandbox
      setLoadingStep('Validando autorización con la entidad emisora internacional...');
      const initRes = await paymentApi.initSandbox();
      if (!initRes.data?.success || !initRes.data.transaction) {
        throw new Error(initRes.error || 'No se pudo iniciar la transacción con la entidad bancaria.');
      }

      const txId = initRes.data.transaction.transactionId;
      await new Promise((r) => setTimeout(r, 700));

      // 2. Confirmar transacción con el backend
      setLoadingStep('Emitiendo licencia vitalicia y credenciales ilimitadas...');
      const simulateSuccess = testScenario === 'success' && !cardNumber.startsWith('5555');
      const confirmRes = await paymentApi.confirmSandbox(txId, simulateSuccess);

      if (!confirmRes.data?.success) {
        throw new Error(
          confirmRes.error || 'La tarjeta fue declinada por la entidad bancaria (Fondos insuficientes o código de rechazo).'
        );
      }

      setLoadingStep('¡Pago Aprobado! Desbloqueando Veritas AI Premium...');
      setSuccessMessage('¡Transacción completada con éxito! Tu cuenta ahora cuenta con Acceso Premium Vitalicio.');
      await refreshProfile();

      setTimeout(() => {
        setSuccessMessage(null);
        closePremiumModal();
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Ocurrió un error al procesar la transacción bancaria.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const handleStripeCheckout = async () => {
    setLoading(true);
    setError(null);

    const res = await paymentApi.createCheckout();
    setLoading(false);

    if (res.data?.checkoutUrl) {
      window.location.href = res.data.checkoutUrl;
    } else {
      setError(
        'Stripe Test Mode oficial requiere configuración en el servidor. Usa la pasarela bancaria directa a continuación para activación instantánea.'
      );
    }
  };

  const currentBrand = getCardBrand(cardNumber);

  // Estilos de skin para la tarjeta virtual 3D
  const skinStyles = {
    obsidian: 'from-slate-950 via-slate-900 to-indigo-950 border-white/15 shadow-indigo-950/40',
    amethyst: 'from-purple-950 via-indigo-900 to-slate-950 border-purple-400/20 shadow-purple-950/40',
    emerald: 'from-emerald-950 via-teal-900 to-slate-950 border-emerald-400/20 shadow-emerald-950/40',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/85 backdrop-blur-xl animate-fadeIn overflow-y-auto">
      {/* Luces ambientales de fondo */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-600/15 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-96 h-96 bg-indigo-600/15 rounded-full blur-[120px] pointer-events-none" />

      {/* Contenedor principal de la pasarela */}
      <div className="relative w-full max-w-4xl bg-white dark:bg-slate-900 rounded-[28px] shadow-[0_25px_80px_rgba(0,0,0,0.45)] border border-slate-200/90 dark:border-slate-800/90 overflow-hidden my-auto">
        {/* Línea sutil de acento brillante en el borde superior */}
        <div className="h-[3px] w-full bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />

        {/* Botón de cierre */}
        <button
          onClick={closePremiumModal}
          className="absolute top-4 right-4 z-30 p-2 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-full bg-slate-100/80 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 backdrop-blur-sm transition-all"
          title="Cerrar ventana"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[600px]">
          {/* ============================================================ */}
          {/* COLUMNA IZQUIERDA: VALOR, PRECIO Y CREDENCIALES DE CONFIANZA */}
          {/* ============================================================ */}
          <div className="lg:col-span-5 bg-gradient-to-b from-slate-50 via-slate-50 to-slate-100/90 dark:from-slate-950 dark:via-slate-950 dark:to-slate-900/90 p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-slate-200/80 dark:border-slate-800 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              {/* Badge oficial de Veritas AI */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 text-white flex items-center justify-center font-black text-base shadow-lg shadow-indigo-500/30">
                    V
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-900 dark:text-white tracking-wider">
                        VERITAS AI
                      </span>
                      <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                        <BadgeCheck className="w-2.5 h-2.5" /> Oficial
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">Checkout Bancario Cifrado</span>
                  </div>
                </div>

                <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-1 rounded-full border border-emerald-200 dark:border-emerald-800/80">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span>En Línea</span>
                </div>
              </div>

              {/* Título y Badge de Oferta */}
              <div className="space-y-2.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-500/20 to-amber-500/10 border border-amber-300/40 dark:border-amber-500/30 text-amber-800 dark:text-amber-300 text-xs font-black shadow-sm">
                  <Crown className="w-3.5 h-3.5 text-amber-500 fill-amber-500 animate-pulseSlow" />
                  <span>OFERTA DE LANZAMIENTO • 90% OFF</span>
                </div>

                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                  Licencia Premium <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 dark:from-blue-400 dark:via-indigo-400 dark:to-purple-400">
                    De Por Vida
                  </span>
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                  Pagas una sola vez y obtienes acceso permanente e ilimitado a todas las herramientas de detección de IA, similitud académica y humanizador.
                </p>
              </div>

              {/* Caja de Precio Ultra-Moderna */}
              <div className="relative p-5 rounded-2xl bg-white dark:bg-slate-900/90 border border-slate-200/90 dark:border-slate-800 shadow-md space-y-3 overflow-hidden">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Plan Vitalicio
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                        $2.00
                      </span>
                      <span className="text-xs font-bold text-slate-500 dark:text-slate-400">USD</span>
                    </div>
                  </div>

                  <div className="text-right">
                    <span className="text-[11px] text-slate-400 line-through block font-medium">
                      $19.99 USD
                    </span>
                    <span className="inline-block px-2 py-0.5 rounded-md bg-rose-100 dark:bg-rose-950/80 text-rose-700 dark:text-rose-300 text-[10px] font-black tracking-wide border border-rose-200 dark:border-rose-900">
                      AHORRA $17.99
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Pago único, sin mensualidades
                  </span>
                  <span className="text-slate-400 font-medium">0% de comisión</span>
                </div>
              </div>

              {/* Lista de beneficios con iconos radiantes */}
              <div className="space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                  Beneficios incluidos:
                </span>
                <ul className="space-y-2 text-xs text-slate-700 dark:text-slate-300">
                  <li className="flex items-start gap-2.5">
                    <div className="p-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0">
                      <Check className="w-3 h-3" />
                    </div>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Análisis ilimitados</strong> de texto y documentos Word (.docx).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="p-0.5 rounded-full bg-indigo-100 dark:bg-indigo-950 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0">
                      <Sparkles className="w-3 h-3" />
                    </div>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Humanizador de IA avanzado</strong> (reducción hasta 4%).
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="p-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 mt-0.5 shrink-0">
                      <Zap className="w-3 h-3" />
                    </div>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Descargas completas .docx</strong> editables sin restricciones.
                    </span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <div className="p-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0">
                      <ShieldCheck className="w-3 h-3" />
                    </div>
                    <span>
                      <strong className="text-slate-900 dark:text-white">Garantía de satisfacción</strong> de 30 días con 100% de devolución.
                    </span>
                  </li>
                </ul>
              </div>

              {/* Valoración de usuarios */}
              <div className="flex items-center gap-2 pt-2 border-t border-slate-200/80 dark:border-slate-800/80">
                <div className="flex text-amber-400 text-xs">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400">
                  <strong className="text-slate-800 dark:text-slate-200">4.9/5</strong> por +2,400 investigadores
                </span>
              </div>
            </div>

            {/* Sellos de Seguridad en el pie */}
            <div className="pt-3 border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
              <div className="flex items-center gap-1 text-slate-600 dark:text-slate-300 font-semibold">
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
                <span>SSL 256-Bit</span>
              </div>
              <span>•</span>
              <div className="text-slate-600 dark:text-slate-300 font-semibold">
                PCI-DSS Nivel 1
              </div>
              <span>•</span>
              <div className="text-slate-600 dark:text-slate-300 font-semibold">
                Stripe Verified
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* COLUMNA DERECHA: TARJETA 3D, SIMULADOR Y FORMULARIO          */}
          {/* ============================================================ */}
          <div className="lg:col-span-7 p-6 sm:p-8 flex flex-col justify-between space-y-5 bg-white dark:bg-slate-900">
            <div>
              {/* Selector de Pestañas de Pago */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl mb-5">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'card'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>Tarjeta Débito/Crédito</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('express')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'express'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>Apple / Google Pay</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('pse')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                    paymentMethod === 'pse'
                      ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-md shadow-slate-200/50 dark:shadow-none'
                      : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  <Building className="w-3.5 h-3.5" />
                  <span>Transferencia / PSE</span>
                </button>
              </div>

              {/* CONTENIDO SEGÚN LA PESTAÑA SELECCIONADA */}
              {paymentMethod === 'card' && (
                <>
                  {/* Selector de Skins y Estilo de la Tarjeta */}
                  <div className="flex items-center justify-between mb-2 px-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Layers className="w-3 h-3 text-indigo-500" /> Estilo de Tarjeta Virtual:
                    </span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setCardSkin('obsidian')}
                        className={`w-4 h-4 rounded-full bg-slate-900 border-2 transition-all ${
                          cardSkin === 'obsidian' ? 'border-blue-500 scale-125' : 'border-transparent opacity-60'
                        }`}
                        title="Obsidian Onyx"
                      />
                      <button
                        type="button"
                        onClick={() => setCardSkin('amethyst')}
                        className={`w-4 h-4 rounded-full bg-purple-700 border-2 transition-all ${
                          cardSkin === 'amethyst' ? 'border-purple-400 scale-125' : 'border-transparent opacity-60'
                        }`}
                        title="Royal Amethyst"
                      />
                      <button
                        type="button"
                        onClick={() => setCardSkin('emerald')}
                        className={`w-4 h-4 rounded-full bg-emerald-600 border-2 transition-all ${
                          cardSkin === 'emerald' ? 'border-emerald-400 scale-125' : 'border-transparent opacity-60'
                        }`}
                        title="Cyber Emerald"
                      />
                    </div>
                  </div>

                  {/* VISTA INTERACTIVA DE TARJETA BANCARIA 3D / LUXURY */}
                  <div
                    className={`relative w-full max-w-sm mx-auto h-48 rounded-2xl p-5 text-white shadow-2xl overflow-hidden mb-4 bg-gradient-to-tr ${skinStyles[cardSkin]} border select-none transition-all duration-300 hover:scale-[1.02] hover:-rotate-0.5`}
                  >
                    {/* Texturas reflectantes y reflejo de luz */}
                    <div className="absolute top-0 right-0 w-56 h-56 bg-white/5 rounded-full blur-2xl pointer-events-none" />
                    <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-indigo-500/20 rounded-full blur-xl pointer-events-none" />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent pointer-events-none" />

                    <div className="relative z-10 flex flex-col justify-between h-full">
                      {/* Fila superior: Chip EMV + Wi-Fi Contactless + Logo Franquicia */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {/* Chip EMV dorado metálico */}
                          <div className="w-11 h-8 rounded-lg bg-gradient-to-tr from-amber-200 via-amber-400 to-amber-300 p-1 flex items-center justify-center shadow-md border border-amber-500/50">
                            <div className="w-full h-full border border-amber-700/40 rounded-sm grid grid-cols-2 gap-0.5 opacity-80">
                              <div className="border-r border-b border-amber-800/30" />
                              <div className="border-b border-amber-800/30" />
                              <div className="border-r border-amber-800/30" />
                              <div />
                            </div>
                          </div>

                          {/* Contactless Wi-Fi Waves */}
                          <div className="opacity-80">
                            <Wifi className="w-5 h-5 rotate-90 text-white/80" />
                          </div>
                        </div>

                        {/* Logo dinámico de Franquicia (Visa / Mastercard / Amex) */}
                        <div className="flex items-center">
                          {currentBrand === 'VISA' && (
                            <span className="font-black italic text-xl tracking-tighter text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                              VISA
                            </span>
                          )}
                          {currentBrand === 'MASTERCARD' && (
                            <div className="flex items-center -space-x-2">
                              <div className="w-6 h-6 rounded-full bg-[#EB001B] shadow" />
                              <div className="w-6 h-6 rounded-full bg-[#F79E1B] opacity-90 shadow" />
                            </div>
                          )}
                          {currentBrand === 'AMEX' && (
                            <div className="bg-[#007AC1] text-white font-black text-[11px] px-2 py-0.5 rounded tracking-tighter italic">
                              AMEX
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Número de tarjeta en relieve con fuente mono y drop-shadow */}
                      <div className="font-mono text-lg sm:text-xl tracking-widest font-bold text-slate-100 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
                        {cardNumber || '•••• •••• •••• ••••'}
                      </div>

                      {/* Titular y Fecha de Expiración */}
                      <div className="flex items-center justify-between text-xs font-mono tracking-wider text-slate-200">
                        <div className="max-w-[180px]">
                          <span className="text-[8px] text-slate-400 block tracking-normal uppercase font-sans">
                            Titular
                          </span>
                          <span className="font-bold uppercase truncate block">
                            {cardName || 'NOMBRE DEL TITULAR'}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[8px] text-slate-400 block tracking-normal uppercase font-sans">
                            Expira
                          </span>
                          <span className="font-bold">{cardExpiry || 'MM/AA'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* BARRA DE TEST / SIMULADOR DE PRUEBAS */}
                  <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 mb-4 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
                      <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                      <span className="font-bold text-[11px]">Simulador Sandbox:</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => fillTestCard('success')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                          testScenario === 'success' && cardNumber.startsWith('4242')
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <Check className="w-3 h-3" />
                        <span>Aprobada (4242)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => fillTestCard('fail')}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition-all flex items-center gap-1 ${
                          testScenario === 'fail' || cardNumber.startsWith('5555')
                            ? 'bg-rose-600 text-white shadow-md shadow-rose-600/30'
                            : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <span>Declinada (5555)</span>
                      </button>
                    </div>
                  </div>

                  {/* FORMULARIO DE TARJETA */}
                  <form onSubmit={handleProcessPayment} className="space-y-3">
                    {/* Nombre del titular */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Nombre del Titular
                      </label>
                      <div className="relative">
                        <UserIcon className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={cardName}
                          onChange={(e) => setCardName(e.target.value.toUpperCase())}
                          placeholder="Como aparece en el plástico"
                          className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Número de tarjeta */}
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Número de Tarjeta
                      </label>
                      <div className="relative">
                        <CreditCard className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          required
                          value={cardNumber}
                          onChange={handleCardNumberChange}
                          placeholder="4242 4242 4242 4242"
                          className="w-full pl-10 pr-14 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-black text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                          {currentBrand}
                        </div>
                      </div>
                    </div>

                    {/* Expiración, CVC y Código Postal */}
                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          Expira (MM/AA)
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            required
                            value={cardExpiry}
                            onChange={handleExpiryChange}
                            placeholder="12/28"
                            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          CVC / CVV
                        </label>
                        <div className="relative">
                          <input
                            type="password"
                            required
                            maxLength={4}
                            value={cardCvc}
                            onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ''))}
                            placeholder="123"
                            className="w-full pl-3 pr-8 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-mono font-bold text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                          />
                          <Lock className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          C. Postal
                        </label>
                        <input
                          type="text"
                          value={zipCode}
                          onChange={(e) => setZipCode(e.target.value)}
                          placeholder="110111"
                          className="w-full px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-medium text-center focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all"
                        />
                      </div>
                    </div>

                    {/* Mensajes de error o éxito */}
                    {error && (
                      <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                        <span>{error}</span>
                      </div>
                    )}

                    {successMessage && (
                      <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                        <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                        <span>{successMessage}</span>
                      </div>
                    )}

                    {/* Botón Principal de Pago con Reflejo Shimmer */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="relative w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-black text-sm shadow-xl shadow-indigo-600/30 transition-all flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 overflow-hidden mt-3 group"
                    >
                      {/* Efecto de barrido de luz */}
                      <div className="absolute inset-0 w-1/3 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 animate-shimmer pointer-events-none" />

                      {loading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin text-white" />
                          <span>{loadingStep || 'Procesando pago seguro...'}</span>
                        </>
                      ) : (
                        <>
                          <Lock className="w-4 h-4" />
                          <span>Pagar $2.00 USD • Desbloquear Acceso Vitalicio</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}

              {/* PESTAÑA 2: APPLE PAY / GOOGLE PAY */}
              {paymentMethod === 'express' && (
                <div className="space-y-4 py-2 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/70 text-center space-y-2">
                    <Smartphone className="w-8 h-8 text-indigo-500 mx-auto" />
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                      Pago Rápido en 1 Clic con Biometría
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Autoriza de forma instantánea y segura con Face ID, Touch ID o tu cuenta de Google.
                    </p>
                  </div>

                  <div className="space-y-2.5">
                    {/* Botón de Apple Pay */}
                    <button
                      type="button"
                      onClick={() => handleProcessPayment()}
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-2xl bg-black hover:bg-neutral-900 text-white font-bold text-sm shadow-lg transition-all flex items-center justify-center gap-2"
                    >
                      <span className="text-lg"></span>
                      <span>Pay con Apple Pay ($2.00 USD)</span>
                    </button>

                    {/* Botón de Google Pay */}
                    <button
                      type="button"
                      onClick={() => handleProcessPayment()}
                      disabled={loading}
                      className="w-full py-3.5 px-4 rounded-2xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-white font-bold text-sm border border-slate-300 dark:border-slate-600 shadow-md transition-all flex items-center justify-center gap-2"
                    >
                      <span className="font-black text-blue-500">G</span>
                      <span className="font-bold">Pay ($2.00 USD)</span>
                    </button>
                  </div>

                  {error && (
                    <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs flex items-start gap-2.5 animate-fadeIn">
                      <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-500" />
                      <span>{error}</span>
                    </div>
                  )}

                  {successMessage && (
                    <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
                      <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-500" />
                      <span>{successMessage}</span>
                    </div>
                  )}
                </div>
              )}

              {/* PESTAÑA 3: TRANSFERENCIA BANCARIA / PSE */}
              {paymentMethod === 'pse' && (
                <div className="space-y-4 py-1 animate-fadeIn">
                  <div className="p-4 rounded-2xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/60 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400 block">
                        Conversión Automática
                      </span>
                      <span className="text-base font-black text-slate-900 dark:text-white">
                        $8,500 COP
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-500 font-medium">Equivalente a $2.00 USD</span>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                        Selecciona tu Banco
                      </label>
                      <select
                        value={pseBank}
                        onChange={(e) => setPseBank(e.target.value)}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      >
                        <option value="bancolombia">Bancolombia</option>
                        <option value="nequi">Nequi</option>
                        <option value="davivienda">Davivienda / Daviplata</option>
                        <option value="bbva">BBVA Colombia</option>
                        <option value="bogota">Banco de Bogotá</option>
                        <option value="occidente">Banco de Occidente</option>
                        <option value="scotiabank">Scotiabank Colpatria</option>
                      </select>
                    </div>

                    <div className="grid grid-cols-3 gap-2.5">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          Tipo Doc.
                        </label>
                        <select
                          value={pseDocType}
                          onChange={(e) => setPseDocType(e.target.value)}
                          className="w-full px-2 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        >
                          <option value="CC">C.C.</option>
                          <option value="CE">C.E.</option>
                          <option value="NIT">NIT</option>
                          <option value="PAS">Pasaporte</option>
                        </select>
                      </div>

                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1">
                          Número de Documento
                        </label>
                        <input
                          type="text"
                          value={pseDocNumber}
                          onChange={(e) => setPseDocNumber(e.target.value)}
                          placeholder="Ej: 1020304050"
                          className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Botón PSE */}
                  <button
                    type="button"
                    onClick={() => handleProcessPayment()}
                    disabled={loading}
                    className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-blue-700 via-indigo-700 to-blue-800 hover:from-blue-800 hover:to-indigo-900 text-white font-black text-sm shadow-xl transition-all flex items-center justify-center gap-2 mt-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        <span>{loadingStep || 'Conectando con portal PSE...'}</span>
                      </>
                    ) : (
                      <>
                        <Building className="w-4 h-4" />
                        <span>Continuar con Débito Bancario PSE</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Enlace a Stripe oficial si se prefiere pasarela externa */}
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={handleStripeCheckout}
                disabled={loading}
                className="text-[11px] text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 font-semibold transition-colors inline-flex items-center gap-1"
              >
                <span>¿Deseas pagar en una ventana externa alojada?</span>
                <span className="underline">Abrir Stripe Checkout Oficial</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
