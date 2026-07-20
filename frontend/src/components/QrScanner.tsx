'use client';

import { useEffect, useRef, useState } from 'react';

interface QrScannerProps {
  onScan: (data: string) => void;
  onClose?: () => void;
}

export default function QrScanner({ onScan, onClose }: QrScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let scanner: any = null;

    import('html5-qrcode').then(({ Html5Qrcode }) => {
      scanner = new Html5Qrcode('qr-reader');
      scanner
        .start(
          { facingMode: 'environment' },
          { fps: 10, qrbox: { width: 250, height: 250 } },
          (decodedText: string) => {
            scanner.stop().catch(() => {});
            onScan(decodedText);
          },
          () => {}
        )
        .catch((err: any) => {
          setError("Impossible d'accéder à la caméra");
        });
    });

    return () => {
      if (scanner) {
        scanner.stop().catch(() => {});
      }
    };
  }, [onScan]);

  return (
    <div className="relative">
      {error && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-xl">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}
      <div id="qr-reader" className="rounded-xl overflow-hidden" style={{ maxWidth: 400 }} />
    </div>
  );
}
