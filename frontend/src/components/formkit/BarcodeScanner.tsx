'use client';

import { useState, useRef, useCallback, useEffect, useId } from 'react';
import { ScanBarcode, Camera, X, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BarcodeScannerProps {
  /** Callback quand un code-barres est détecté */
  onDetected: (code: string) => void;
  /** Désactiver le scanner */
  disabled?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
  /** Texte du bouton d'ouverture */
  label?: string;
}

interface BarcodeResult {
  rawValue: string;
  format: string;
}

/**
 * FormKit — BarcodeScanner
 * Scanner code-barres via l'API BarcodeDetector native (Chrome Android, Edge).
 * Enregistre un flux vidéo en direct, détecte les codes-barres en temps réel.
 * Réalité africaine : le gérant scanne le produit, le code est lookupé
 * dans la base partagée AfriBiz pour pré-remplir nom/prix/catégorie.
 */
export function BarcodeScanner({
  onDetected,
  disabled = false,
  className,
  label = 'Scanner un code-barres',
}: BarcodeScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number>(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const supported = 'BarcodeDetector' in window;
    setIsSupported(supported);

    // Inject scan animation keyframes
    const styleId = 'barcode-scanner-keyframes';
    if (!document.getElementById(styleId)) {
      const style = document.createElement('style');
      style.id = styleId;
      style.textContent = `
        @keyframes scanLine {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(80px); }
        }
      `;
      document.head.appendChild(style);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
    }
  }, []);

  const startScanning = useCallback(async () => {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const detector = new (window as any).BarcodeDetector({
        formats: ['ean_13', 'ean_8', 'upc_a', 'upc_e', 'code_128', 'code_39', 'qr_code'],
      });

      const scan = async () => {
        if (!videoRef.current || videoRef.current.readyState < 2) {
          animFrameRef.current = requestAnimationFrame(scan);
          return;
        }
        try {
          const results: BarcodeResult[] = await detector.detect(videoRef.current);
          if (results.length > 0) {
            const code = results[0].rawValue;
            onDetected(code);
            stopCamera();
            setIsOpen(false);
            return;
          }
        } catch {
          // ignore detection errors
        }
        animFrameRef.current = requestAnimationFrame(scan);
      };
      scan();
    } catch (err: any) {
      setError(err.message || "Impossible d'accéder à la caméra");
    }
  }, [onDetected, stopCamera]);

  const handleOpen = useCallback(() => {
    setIsOpen(true);
    // Délai pour laisser le video se monter
    setTimeout(() => startScanning(), 100);
  }, [startScanning]);

  const handleClose = useCallback(() => {
    stopCamera();
    setIsOpen(false);
    setError(null);
  }, [stopCamera]);

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  if (!isSupported) {
    return (
      <div className={cn('text-xs text-gray-400 italic', className)}>
        Scanner code-barres non supporté par ce navigateur
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {!isOpen && (
        <button
          type="button"
          onClick={handleOpen}
          disabled={disabled}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 hover:border-brand/50 hover:bg-brand/5 transition-all"
        >
          <ScanBarcode className="w-4 h-4 text-brand" />
          {label}
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 bg-black/80">
            <p className="text-white text-sm font-medium">
              <ScanBarcode className="w-4 h-4 inline mr-2" />
              Scanner le code-barres
            </p>
            <button
              type="button"
              onClick={handleClose}
              className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Video */}
          <div className="flex-1 relative overflow-hidden">
            <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
            {/* Overlay de scan */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-64 h-32 border-2 border-white/60 rounded-2xl relative">
                <div className="absolute -top-px -left-px w-6 h-6 border-t-2 border-l-2 border-brand rounded-tl-2xl" />
                <div className="absolute -top-px -right-px w-6 h-6 border-t-2 border-r-2 border-brand rounded-tr-2xl" />
                <div className="absolute -bottom-px -left-px w-6 h-6 border-b-2 border-l-2 border-brand rounded-bl-2xl" />
                <div className="absolute -bottom-px -right-px w-6 h-6 border-b-2 border-r-2 border-brand rounded-br-2xl" />
                {/* Ligne de scan animée */}
                <div
                  className="absolute left-2 right-2 h-0.5 bg-brand/80"
                  style={{ animation: 'scanLine 2s ease-in-out infinite' }}
                />
              </div>
            </div>
            <p className="absolute bottom-6 left-0 right-0 text-center text-white/70 text-xs">
              Placez le code-barres dans le cadre
            </p>
          </div>

          {error && (
            <div className="p-4 bg-red-900/50 text-red-200 text-sm text-center">{error}</div>
          )}
        </div>
      )}
    </div>
  );
}
