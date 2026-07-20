'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { SmilePlus } from 'lucide-react';
import { apiClient } from '@/services/apiClient';
import { cn } from '@/lib/utils';

const EMOJIS = ['👍', '❤️', '😮', '😢', '😡', '🎉', '🔥', '💯'];

interface ReactionGroup {
  count: number;
  users: string[];
}

interface MessageReactionsProps {
  messageId: string;
  /** Current user ID to determine which reactions are mine */
  currentUserId: string;
  className?: string;
  /** Callback when reactions change (to refetch messages) */
  onReactionChange?: () => void;
}

export function MessageReactions({
  messageId,
  currentUserId,
  className,
  onReactionChange,
}: MessageReactionsProps) {
  const [reactions, setReactions] = useState<Record<string, ReactionGroup>>({});
  const [myReactions, setMyReactions] = useState<string[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

  const fetchReactions = useCallback(async () => {
    try {
      const res = await apiClient.get(`/messages/${messageId}/reactions`);
      setReactions(res.data?.data?.reactions || {});
      setMyReactions(res.data?.data?.myReactions || []);
    } catch {
      // Silently fail
    }
  }, [messageId]);

  useEffect(() => {
    fetchReactions();
  }, [fetchReactions]);

  // Close picker on outside click
  useEffect(() => {
    if (!showPicker) return;
    const handleClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowPicker(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [showPicker]);

  const handleReact = async (emoji: string) => {
    setShowPicker(false);
    setLoading(true);
    try {
      if (myReactions.includes(emoji)) {
        await apiClient.delete(`/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
      } else {
        await apiClient.post(`/messages/${messageId}/reactions`, { emoji });
      }
      await fetchReactions();
      onReactionChange?.();
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  const reactionEntries = Object.entries(reactions).sort(([, a], [, b]) => b.count - a.count);

  if (reactionEntries.length === 0 && !showPicker) {
    return (
      <div className={cn('flex items-center', className)}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPicker(true);
          }}
          className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
          title="Ajouter une réaction"
          disabled={loading}
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>

        {/* Emoji picker floating */}
        {showPicker && (
          <div
            ref={pickerRef}
            className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-1.5 flex gap-0.5 z-20"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReact(emoji);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('flex items-center gap-1 flex-wrap relative', className)}>
      {reactionEntries.map(([emoji, data]) => {
        const isMine = myReactions.includes(emoji);
        return (
          <button
            key={emoji}
            onClick={(e) => {
              e.stopPropagation();
              handleReact(emoji);
            }}
            disabled={loading}
            className={cn(
              'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-xs border transition-colors',
              isMine
                ? 'bg-brand/10 border-brand/30 text-brand'
                : 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span className="text-[10px] font-medium">{data.count}</span>
          </button>
        );
      })}

      {/* Add reaction button */}
      <div className="relative">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowPicker(!showPicker);
          }}
          className="p-0.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-brand transition-colors"
          title="Ajouter une réaction"
          disabled={loading}
        >
          <SmilePlus className="h-3.5 w-3.5" />
        </button>

        {showPicker && (
          <div
            ref={pickerRef}
            className="absolute bottom-full left-0 mb-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-1.5 flex gap-0.5 z-20"
          >
            {EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={(e) => {
                  e.stopPropagation();
                  handleReact(emoji);
                }}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-sm transition-colors"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
