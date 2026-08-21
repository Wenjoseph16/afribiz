'use client';

import { useState } from 'react';
import {
  CheckCheck,
  Play,
  Pause,
  ImageIcon,
  FileText,
  ShoppingBag,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { MessageReactions } from './MessageReactions';
import Image from 'next/image';

interface MessageBubbleProps {
  message: {
    id: string;
    content: string;
    senderId: string;
    senderType?: string;
    attachment?: string | null;
    attachmentType?: string | null;
    createdAt?: string;
    read?: boolean;
    readAt?: string | null;
    productId?: string | null;
    productName?: string | null;
    productPrice?: string | null;
    productImage?: string | null;
    productSlug?: string | null;
    businessId?: string | null;
  };
  /** ID of the "other" participant (not the current user) */
  otherParticipantId?: string;
  /** Current user's ID */
  currentUserId: string;
  isOutgoing: boolean;
  className?: string;
}

export function MessageBubble({
  message,
  otherParticipantId,
  currentUserId,
  isOutgoing,
  className,
}: MessageBubbleProps) {
  const isImage =
    message.attachmentType?.startsWith('image/') || (message.attachment && !message.attachmentType);
  const isAudio = message.attachmentType?.startsWith('audio/');
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioRef, setAudioRef] = useState<HTMLAudioElement | null>(null);
  const [imgError, setImgError] = useState(false);
  const [productImgError, setProductImgError] = useState(false);

  const toggleAudio = () => {
    if (!audioRef && message.attachment) {
      const audio = new Audio(message.attachment);
      audio.onended = () => setAudioPlaying(false);
      audio.play();
      setAudioRef(audio);
      setAudioPlaying(true);
    } else if (audioRef) {
      if (audioPlaying) {
        audioRef.pause();
        setAudioPlaying(false);
      } else {
        audioRef.play();
        setAudioPlaying(true);
      }
    }
  };

  return (
    <div className={cn('flex flex-col', isOutgoing ? 'items-end' : 'items-start', className)}>
      {/* Message bubble */}
      <div
        className={cn(
          'max-w-[75%] rounded-2xl px-4 py-2.5',
          isOutgoing
            ? 'bg-brand text-white rounded-br-sm'
            : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-bl-sm border border-gray-100 dark:border-gray-700'
        )}
      >
        {/* Image attachment */}
        {isImage && message.attachment && !imgError && (
          <div className="mb-2 -mx-4 -mt-2.5 rounded-t-2xl overflow-hidden bg-gray-100 dark:bg-gray-700">
            <Image
              src={message.attachment}
              alt="Pièce jointe"
              width={400}
              height={256}
              className="w-full max-h-64 object-cover cursor-pointer hover:opacity-95 transition-opacity"
              onClick={() => window.open(message.attachment!, '_blank')}
              onError={() => setImgError(true)}
            />
          </div>
        )}

        {/* Audio attachment */}
        {isAudio && message.attachment && (
          <div
            className={cn(
              'flex items-center gap-3 p-2 rounded-xl mb-2 cursor-pointer',
              isOutgoing ? 'bg-white/10' : 'bg-gray-50 dark:bg-gray-700/50'
            )}
            onClick={toggleAudio}
          >
            <button
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors',
                isOutgoing ? 'bg-white/20 hover:bg-white/30' : 'bg-brand/10 hover:bg-brand/20'
              )}
            >
              {audioPlaying ? (
                <Pause className={cn('h-5 w-5', isOutgoing ? 'text-white' : 'text-brand')} />
              ) : (
                <Play className={cn('h-5 w-5', isOutgoing ? 'text-white' : 'text-brand')} />
              )}
            </button>
            <div className="min-w-0 flex-1">
              <p
                className={cn(
                  'text-xs font-medium',
                  isOutgoing ? 'text-white/90' : 'text-gray-700 dark:text-gray-300'
                )}
              >
                Message vocal
              </p>
              <div className="flex items-center gap-1 mt-1">
                <div
                  className={cn(
                    'h-1 flex-1 rounded-full overflow-hidden',
                    isOutgoing ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'
                  )}
                >
                  <div
                    className={cn(
                      'h-full w-0 rounded-full transition-all',
                      isOutgoing ? 'bg-white/60' : 'bg-brand'
                    )}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Linked product */}
        {message.productId && message.productName && (
          <div
            className={cn(
              'mb-2 -mx-4 rounded-xl overflow-hidden border',
              isOutgoing
                ? 'bg-white/10 border-white/20'
                : 'bg-gray-50 dark:bg-gray-700/50 border-gray-100 dark:border-gray-700'
            )}
          >
            {message.productImage && !productImgError && (
              <div className="relative h-28 w-full overflow-hidden bg-gray-100 dark:bg-gray-700">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={message.productImage}
                  alt={message.productName}
                  onError={() => setProductImgError(true)}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="p-3">
              <div
                className={cn(
                  'flex items-center gap-1.5 mb-1',
                  isOutgoing ? 'text-white/70' : 'text-brand'
                )}
              >
                <ShoppingBag className="h-3 w-3" />
                <span className="text-[10px] font-semibold uppercase tracking-wide">Produit</span>
              </div>
              <p
                className={cn(
                  'text-sm font-semibold truncate',
                  isOutgoing ? 'text-white' : 'text-gray-900 dark:text-white'
                )}
              >
                {message.productName}
              </p>
              {message.productPrice && (
                <p
                  className={cn(
                    'text-sm font-bold mt-0.5',
                    isOutgoing ? 'text-white' : 'text-brand'
                  )}
                >
                  {Number(message.productPrice).toLocaleString('fr-FR')} FCFA
                </p>
              )}
              {message.productSlug && (
                <a
                  href={`/product/${message.productSlug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className={cn(
                    'mt-2 inline-flex items-center gap-1 text-xs font-medium underline',
                    isOutgoing ? 'text-white decoration-white/40' : 'text-brand decoration-brand/40'
                  )}
                >
                  Voir le produit <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          </div>
        )}

        {/* Text content */}
        {message.content && (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        )}

        {/* Timestamp / Read receipt (Facebook/WhatsApp style) */}
        <div
          className={cn(
            'flex items-center gap-1 mt-1',
            isOutgoing ? 'justify-end' : 'justify-start'
          )}
        >
          <span className="text-[10px] opacity-70">
            {message.createdAt
              ? new Date(message.createdAt).toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : ''}
          </span>
          {isOutgoing && (
            <span className="flex items-center">
              {message.read ? (
                <CheckCheck className="h-3.5 w-3.5 text-blue-400" />
              ) : (
                <CheckCheck className="h-3.5 w-3.5 opacity-50" />
              )}
            </span>
          )}
        </div>
      </div>

      {/* Reactions */}
      <MessageReactions messageId={message.id} currentUserId={currentUserId} className="mt-0.5" />
    </div>
  );
}
