'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AudioRecorderProps {
  /** Callback when recording is complete and audio blob is ready */
  onRecordingComplete: (blob: Blob) => void;
  /** Whether upload is in progress */
  isUploading?: boolean;
  /** Disabled state */
  disabled?: boolean;
}

export function AudioRecorder({
  onRecordingComplete,
  isUploading = false,
  disabled = false,
}: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
          ? 'audio/webm;codecs=opus'
          : 'audio/webm',
      });

      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        if (blob.size > 0) {
          onRecordingComplete(blob);
        }
        // Stop all tracks
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        setDuration(0);
      };

      mediaRecorder.start(250); // Collect data every 250ms
      setIsRecording(true);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration((prev) => {
          if (prev >= 60) {
            // Auto-stop at 60 seconds
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error('Failed to start recording:', err);
    }
  }, [onRecordingComplete]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setIsRecording(false);
  }, []);

  // SVG waveform animation while recording
  const Waveform = () => (
    <span className="inline-flex items-center gap-0.5 h-4">
      {[1, 2, 3, 4, 3, 2, 1].map((h, i) => (
        <span
          key={i}
          className="w-0.5 bg-red-500 rounded-full animate-pulse"
          style={{
            height: `${h * 4}px`,
            animationDelay: `${i * 0.1}s`,
            animationDuration: '0.8s',
          }}
        />
      ))}
    </span>
  );

  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-1">
      {isRecording ? (
        <>
          <button
            onClick={stopRecording}
            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-500 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            title="Arrêter l'enregistrement"
          >
            <Square className="h-4 w-4" />
          </button>
          <span className="text-xs font-medium text-red-500 flex items-center gap-1.5 min-w-[60px]">
            <Waveform />
            {formatDuration(duration)}
          </span>
        </>
      ) : (
        <button
          onClick={startRecording}
          disabled={disabled || isUploading}
          className={cn(
            'p-2 rounded-lg transition-colors',
            disabled || isUploading
              ? 'text-gray-300 dark:text-gray-600 cursor-not-allowed'
              : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-brand'
          )}
          title="Message vocal"
        >
          {isUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Mic className="h-5 w-5" />}
        </button>
      )}
    </div>
  );
}
