'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Send, Paperclip, X, Loader2, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { getSocket } from '@/services/socket';
import { apiClient } from '@/services/apiClient';
import { AudioRecorder } from './AudioRecorder';
import { cn } from '@/lib/utils';

export interface ChatInputProps {
  conversationId: string | null;
  value: string;
  onChange: (value: string) => void;
  onSend: (attachment?: { url: string; type: string }) => void;
  isLoading?: boolean;
  placeholder?: string;
  className?: string;
}

const ACCEPTED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'audio/webm',
  'audio/mp3',
  'audio/ogg',
  'audio/wav',
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export function ChatInput({
  conversationId,
  value,
  onChange,
  onSend,
  isLoading = false,
  placeholder = 'Écrivez votre message...',
  className = '',
}: ChatInputProps) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [attachPreview, setAttachPreview] = useState<{
    url: string;
    type: string;
    name: string;
  } | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup
  useEffect(() => {
    return () => {
      if (isTyping && conversationId) {
        const socket = getSocket();
        socket?.emit('typing:stop', conversationId);
      }
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [conversationId]);

  const handleTyping = useCallback(
    (newValue: string) => {
      onChange(newValue);
      if (!conversationId) return;
      const socket = getSocket();
      if (!socket) return;

      if (!isTyping) {
        setIsTyping(true);
        socket.emit('typing:start', conversationId);
      }
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => {
        socket.emit('typing:stop', conversationId);
        setIsTyping(false);
      }, 2000);
    },
    [conversationId, onChange, isTyping]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const stopTyping = () => {
    if (conversationId && isTyping) {
      const socket = getSocket();
      socket?.emit('typing:stop', conversationId);
      setIsTyping(false);
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
  };

  const handleSend = () => {
    if (isLoading || uploading) return;
    if (!value.trim() && !attachPreview) return;

    stopTyping();

    if (attachPreview) {
      onSend({ url: attachPreview.url, type: attachPreview.type });
      setAttachPreview(null);
    } else {
      onSend();
    }
  };

  /** Upload a file and store the preview */
  const handleFilePick = async (file: File) => {
    if (!ACCEPTED_TYPES.some((t) => file.type.startsWith(t.split('/')[0]))) {
      alert('Format non supporté. Utilisez une image ou un fichier audio.');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      alert('Fichier trop volumineux (max 10MB)');
      return;
    }

    setUploading(true);
    try {
      const res = await apiClient.uploadMedia(file);
      const url = res.data.data?.url;
      if (!url) throw new Error('Upload failed');
      setAttachPreview({ url, type: file.type, name: file.name });
    } catch (err) {
      console.error('Upload failed:', err);
      alert("Échec de l'upload. Réessayez.");
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFilePick(file);
    e.target.value = '';
  };

  /** Called when audio recording is complete */
  const handleAudioComplete = async (blob: Blob) => {
    const file = new File([blob], 'voice-message.webm', { type: 'audio/webm' });
    await handleFilePick(file);
  };

  const clearAttachment = () => {
    setAttachPreview(null);
  };

  const isImage = attachPreview?.type.startsWith('image/');
  const isAudio = attachPreview?.type.startsWith('audio/');

  return (
    <div className={className}>
      {/* Attachment preview */}
      {attachPreview && (
        <div className="mb-2 p-2 bg-gray-50 dark:bg-gray-700/30 rounded-xl border border-gray-200 dark:border-gray-700 relative">
          <button
            onClick={clearAttachment}
            className="absolute -top-2 -right-2 w-5 h-5 bg-gray-700 dark:bg-gray-500 text-white rounded-full flex items-center justify-center hover:bg-gray-900 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
          <div className="flex items-center gap-2">
            {isImage && (
              <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 bg-gray-200 dark:bg-gray-700">
                <Image
                  src={attachPreview.url}
                  alt=""
                  width={48}
                  height={48}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            {isAudio && (
              <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center shrink-0">
                <ImageIcon className="h-5 w-5 text-brand" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate">
                {attachPreview.name || (isImage ? 'Image' : 'Audio')}
              </p>
              <p className="text-[10px] text-gray-400">
                {isImage ? 'Image prête à envoyer' : 'Fichier prêt à envoyer'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        {/* File picker (images) */}
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/jpeg,image/png,image/webp,image/gif,audio/webm,audio/mp3,audio/ogg,audio/wav"
          onChange={handleFileSelect}
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          title="Joindre une image"
        >
          {uploading ? (
            <Loader2 className="h-5 w-5 text-gray-400 animate-spin" />
          ) : (
            <Paperclip className="h-5 w-5 text-gray-400" />
          )}
        </button>

        {/* Audio recorder */}
        <AudioRecorder
          onRecordingComplete={handleAudioComplete}
          isUploading={uploading}
          disabled={!conversationId}
        />

        <input
          type="text"
          placeholder={placeholder}
          value={value}
          onChange={(e) => handleTyping(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 px-4 py-2.5 text-sm text-gray-900 dark:text-gray-100 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand/20"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={(!value.trim() && !attachPreview) || uploading}
          isLoading={isLoading}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
