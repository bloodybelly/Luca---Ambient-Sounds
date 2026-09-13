import React, { useState, useEffect } from 'react';
import {
  X,
  Coffee,
  Heart,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
  Sparkles,
} from 'lucide-react';
import QRCode from 'qrcode';
import { ThemeConfig } from '../types';

interface BuyCoffeeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeConfig;
}

// Preset amounts in INR
const COFFEE_PRESETS = [
  { cups: 1, amount: 50, label: '1 Coffee', emoji: '☕' },
  { cups: 2, amount: 100, label: '2 Coffees', emoji: '☕☕' },
  { cups: 3, amount: 150, label: '3 Coffees', emoji: '☕☕☕' },
  { cups: 5, amount: 250, label: '5 Coffees', emoji: '☕☕☕☕☕' },
];

const UPI_ID = 'paytoarchu@ybl';
const CREATOR_NAME = 'Archana Raj';

export const BuyCoffeeModal: React.FC<BuyCoffeeModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
}) => {
  const [selectedAmount, setSelectedAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [isCustom, setIsCustom] = useState<boolean>(false);
  const [supporterName, setSupporterName] = useState<string>('');
  const [supporterMessage, setSupporterMessage] = useState<string>('');

  // QR Code & copied state
  const [qrCodeUrl, setQrCodeUrl] = useState<string>('');
  const [copiedUpi, setCopiedUpi] = useState<boolean>(false);
  const [paymentSuccess, setPaymentSuccess] = useState<boolean>(false);

  const effectiveAmount = isCustom ? Math.max(10, Number(customAmount) || 50) : selectedAmount;

  // Build UPI deep-link URI
  const encodedName = encodeURIComponent(CREATOR_NAME);
  const encodedNote = encodeURIComponent(
    supporterMessage.trim()
      ? `Coffee from ${supporterName.trim() || 'Supporter'}: ${supporterMessage.trim()}`
      : `Buy Me a Coffee - ${supporterName.trim() || 'Luca Ambience'}`
  );
  const upiIntentUrl = `upi://pay?pa=${UPI_ID}&pn=${encodedName}&am=${effectiveAmount}&cu=INR&tn=${encodedNote}`;

  // Generate QR Code dynamically whenever the amount or note changes
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;
    QRCode.toDataURL(upiIntentUrl, {
      width: 260,
      margin: 1.5,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (isMounted) setQrCodeUrl(url);
      })
      .catch((err) => {
        console.warn('Failed to generate UPI QR code:', err);
      });

    return () => {
      isMounted = false;
    };
  }, [upiIntentUrl, isOpen]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset state on open
  useEffect(() => {
    if (isOpen) {
      setPaymentSuccess(false);
      setCopiedUpi(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Copy UPI ID helper
  const handleCopyUpi = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[92vh] transition-all"
        style={{
          backgroundColor: currentTheme.surface,
          borderColor: currentTheme.border,
          boxShadow: `0 25px 50px -12px ${currentTheme.glow}`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-white/10 bg-gradient-to-r from-amber-500/10 via-transparent to-orange-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-gradient-to-br from-amber-400 to-orange-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                  Buy Me a Coffee
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Direct UPI
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Support via Instant UPI • {UPI_ID}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {paymentSuccess ? (
            /* Success State */
            <div className="p-6 text-center space-y-4 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 mx-auto rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center">
                <Heart className="w-8 h-8 fill-current text-emerald-400 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-white">Thank You So Much!</h3>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">
                  Your kind support of ₹{effectiveAmount} helps fuel continuous updates and keep Luca Ambience ad-free and peaceful.
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 transition-all cursor-pointer shadow-md"
              >
                Back to Atmosphere
              </button>
            </div>
          ) : (
            <>
              {/* Coffee Cups / Amount Selector */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Select Support Amount
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {COFFEE_PRESETS.map((preset) => {
                    const active = !isCustom && selectedAmount === preset.amount;
                    return (
                      <button
                        key={preset.amount}
                        type="button"
                        onClick={() => {
                          setIsCustom(false);
                          setSelectedAmount(preset.amount);
                        }}
                        className={`p-2.5 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center justify-center gap-1 ${
                          active
                            ? 'bg-amber-500/20 border-amber-400 text-white shadow-md shadow-amber-500/10 ring-1 ring-amber-400'
                            : 'bg-black/30 border-white/10 text-slate-300 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <span className="text-sm">{preset.emoji}</span>
                        <span className="text-xs font-bold">₹{preset.amount}</span>
                        <span className="text-[10px] text-slate-400">{preset.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Custom Amount Option */}
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsCustom(!isCustom)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                      isCustom
                        ? 'bg-amber-500/20 border-amber-400 text-amber-300'
                        : 'bg-black/30 border-white/10 text-slate-400 hover:text-white'
                    }`}
                  >
                    Custom Amount
                  </button>

                  {isCustom && (
                    <div className="relative flex-1">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-amber-400">
                        ₹
                      </span>
                      <input
                        type="number"
                        min="10"
                        placeholder="Enter amount (e.g. 500)"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        className="w-full pl-7 pr-3 py-1.5 rounded-xl text-xs font-medium bg-black/40 border border-amber-500/40 text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-400"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Supporter Note */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Your Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Priya or Alex"
                    value={supporterName}
                    onChange={(e) => setSupporterName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-400 mb-1">
                    Message / Note (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Love the rain ambience!"
                    value={supporterMessage}
                    onChange={(e) => setSupporterMessage(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-black/30 border border-slate-700/70 text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
                  />
                </div>
              </div>

              {/* Direct UPI Payment Section */}
              <div className="space-y-3 p-4 rounded-2xl bg-black/30 border border-white/10">
                {/* UPI ID Copy Box */}
                <div className="flex items-center justify-between p-3 rounded-xl bg-black/40 border border-slate-700/80">
                  <div className="flex items-center gap-2.5">
                    <Smartphone className="w-4 h-4 text-amber-400" />
                    <div className="text-left">
                      <span className="text-[10px] uppercase text-slate-400 block font-mono">
                        UPI ID (Pay directly to)
                      </span>
                      <span className="text-xs sm:text-sm font-bold text-white font-mono tracking-wide">
                        {UPI_ID}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyUpi}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/15 text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedUpi ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 font-bold">Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy UPI</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Dynamic QR Code */}
                <div className="p-3.5 rounded-2xl bg-white text-slate-900 text-center flex flex-col items-center justify-center shadow-md">
                  {qrCodeUrl ? (
                    <img
                      src={qrCodeUrl}
                      alt={`Scan to pay ₹${effectiveAmount} to ${UPI_ID}`}
                      className="w-44 h-44 rounded-lg object-contain"
                    />
                  ) : (
                    <div className="w-44 h-44 flex items-center justify-center text-slate-400 text-xs">
                      Generating QR Code...
                    </div>
                  )}
                  <div className="mt-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                    <span>Scan & pay</span>
                    <span className="text-amber-600 font-extrabold text-sm">
                      ₹{effectiveAmount}
                    </span>
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Scan with Google Pay, PhonePe, Paytm, CRED or any UPI app
                  </span>
                </div>

                {/* Direct Mobile UPI App Intent Button */}
                <a
                  href={upiIntentUrl}
                  id="upi-intent-link"
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-amber-400 via-amber-300 to-orange-400 hover:from-amber-300 hover:to-orange-300 shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all cursor-pointer hover:scale-[1.01] active:scale-[0.99]"
                >
                  <Smartphone className="w-4 h-4" />
                  <span>Open in UPI App on Mobile (₹{effectiveAmount})</span>
                  <ExternalLink className="w-3.5 h-3.5 opacity-70" />
                </a>

                {/* I have paid button */}
                <div className="text-center pt-1">
                  <button
                    type="button"
                    onClick={() => setPaymentSuccess(true)}
                    className="text-xs text-amber-400/90 hover:text-amber-300 underline cursor-pointer flex items-center justify-center gap-1 mx-auto"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>I have completed the payment</span>
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-white/10 bg-black/30 flex items-center justify-between text-[11px] text-slate-400 px-4">
          <div className="flex items-center gap-1.5">
            <Heart className="w-3.5 h-3.5 text-rose-400 fill-current" />
            <span>Thank you for supporting independent open development</span>
          </div>
          <span className="font-mono text-slate-500">100% Direct to Creator</span>
        </div>
      </div>
    </div>
  );
};
