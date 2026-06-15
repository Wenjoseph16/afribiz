'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useMutation } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle, Pen, RotateCcw, Shield } from 'lucide-react';

export default function SignPage() {
  const params = useParams();
  const token = params.token as string;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [signatureData, setSignatureData] = useState<string | null>(null);
  const [signed, setSigned] = useState(false);

  const signMutation = useMutation({
    mutationFn: async (data: string) => {
      const res = await apiClient.post('/documents/sign/' + token, { signatureData: data });
      return res.data.data;
    },
    onSuccess: () => setSigned(true),
  });

  const startDrawing = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.beginPath(); ctx.moveTo(x, y);
  }, []);

  const draw = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    const x = 'touches' in e ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = 'touches' in e ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1f2937';
    ctx.lineTo(x, y); ctx.stroke();
  }, [isDrawing]);

  const stopDrawing = useCallback(() => {
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (canvas) setSignatureData(canvas.toDataURL());
  }, []);

  const clearCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setSignatureData(null);
  }, []);

  if (signed) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center py-12">
          <CheckCircle className="h-20 w-20 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Document signé ! ✅</h1>
          <p className="text-gray-500 mb-4">Votre signature a été enregistrée avec succès.</p>
          <p className="text-xs text-gray-400 flex items-center justify-center gap-1"><Shield className="h-3 w-3" />Signature horodatée et sécurisée</p>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-lg w-full">
        <div className="text-center mb-6">
          <Pen className="h-10 w-10 text-brand mx-auto mb-3" />
          <h1 className="text-xl font-bold">Signature électronique</h1>
          <p className="text-sm text-gray-500 mt-1">Veuillez signer dans le cadre ci-dessous</p>
        </div>
        <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden mb-4 bg-white">
          <canvas ref={canvasRef} width={500} height={200} className="w-full h-48 cursor-crosshair touch-none"
            onMouseDown={startDrawing} onMouseMove={draw} onMouseUp={stopDrawing} onMouseLeave={stopDrawing}
            onTouchStart={startDrawing} onTouchMove={draw} onTouchEnd={stopDrawing} />
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={clearCanvas}><RotateCcw className="h-4 w-4 mr-1.5" />Effacer</Button>
          <Button size="lg" onClick={() => signatureData && signMutation.mutate(signatureData)}
            disabled={!signatureData || signMutation.isPending} className="flex-1">
            {signMutation.isPending ? 'Signature...' : 'Signer le document'}
          </Button>
        </div>
        {signMutation.isError && <p className="text-xs text-red-500 mt-3 text-center">Erreur de signature. Réessayez.</p>}
        <p className="text-xs text-gray-400 text-center mt-4"><Shield className="h-3 w-3 inline mr-1" />Signature électronique avec valeur légale</p>
      </Card>
    </div>
  );
}
