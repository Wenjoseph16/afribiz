'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Mic, MicOff, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface VoiceInputProps {
  /** Valeur actuelle du champ */
  value?: string;
  /** Callback quand la transcription change */
  onChange?: (value: string) => void;
  /** Callback quand l'utilisateur valide (Enter) */
  onConfirm?: (value: string) => void;
  /** Placeholder du champ */
  placeholder?: string;
  /** Langue de reconnaissance (défaut : fr-FR) */
  lang?: string;
  /** Désactiver le composant */
  disabled?: boolean;
  /** Classe CSS supplémentaire */
  className?: string;
  /** Étiquette du champ */
  label?: string;
}

/**
 * FormKit — VoiceInput
 * Saisie vocale réutilisable via Web Speech API natif.
 * Micro natif + Enter passe au champ suivant.
 * Réalité africaine : fonctionne hors-ligne partiellement (Chrome),
 * utile pour remplir le stock en parlant plutôt qu'en tapant.
 */
export function VoiceInput({
  value = '',
  onChange,
  onConfirm,
  placeholder = 'Parlez puis validez…',
  lang = 'fr-FR',
  disabled = false,
  className,
  label,
}: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [transcript, setTranscript] = useState(value);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const SpeechRecognition =
      typeof window !== 'undefined'
        ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
        : null;
    if (!SpeechRecognition) {
      setIsSupported(false);
    }
  }, []);

  useEffect(() => {
    setTranscript(value);
  }, [value]);

  const startListening = useCallback(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.interimResults = true;
    recognition.continuous = true;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += t;
        } else {
          interimTranscript += t;
        }
      }
      if (finalTranscript) {
        const newValue = transcript + finalTranscript;
        setTranscript(newValue);
        onChange?.(newValue);
      }
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [lang, transcript, onChange]);

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
    setIsListening(false);
  }, []);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && transcript.trim()) {
      e.preventDefault();
      onConfirm?.(transcript.trim());
    }
  };

  if (!isSupported) {
    return (
      <div className={cn('text-xs text-gray-400 italic', className)}>
        Saisie vocale non supportée par ce navigateur
      </div>
    );
  }

  return (
    <div className={cn('relative', className)}>
      {label && (
        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {label}
        </label>
      )}
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={transcript}
          onChange={(e) => {
            setTranscript(e.target.value);
            onChange?.(e.target.value);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/40 focus:border-brand transition-all"
        />
        <button
          type="button"
          onClick={toggleListening}
          disabled={disabled}
          className={cn(
            'shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all',
            isListening
              ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-brand/10 hover:text-brand'
          )}
          aria-label={isListening ? "Arrêter l'écoute" : 'Activer le micro'}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
        </button>
      </div>
      {isListening && (
        <p className="text-xs text-red-500 mt-1 animate-pulse">
          🎤 Écoute en cours… dites votre texte puis appuyez sur Entrée
        </p>
      )}
    </div>
  );
}
