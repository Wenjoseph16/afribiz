'use client';

import { useState } from 'react';
import { Handshake, Send, CheckCircle2, X } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface NegotiationButtonProps {
  itemType: string;
  itemId: string;
  itemName: string;
  basePrice: number;
  currency?: string;
  variant?: 'full' | 'outline';
  className?: string;
}

/**
 * Bouton 🤝 « Négocier le prix » — visible uniquement si le business a activé
 * la négociation (le parent vérifie `negotiable`). Le client propose un prix +
 * un message → le business reçoit une notification instantanée.
 */
export function NegotiationButton({
  itemType,
  itemId,
  itemName,
  basePrice,
  currency = 'FCFA',
  variant = 'outline',
  className = '',
}: NegotiationButtonProps) {
  const [open, setOpen] = useState(false);
  const [price, setPrice] = useState('');
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const reset = () => {
    setOpen(false);
    setPrice('');
    setMessage('');
    setName('');
    setPhone('');
    setDone(false);
    setError('');
  };

  const submit = async () => {
    const proposedPrice = Number(price);
    if (!proposedPrice || proposedPrice <= 0) {
      setError('Entrez un prix valide.');
      return;
    }
    if (proposedPrice >= basePrice) {
      setError(`Le prix doit être inférieur à ${basePrice.toLocaleString()} ${currency}.`);
      return;
    }
    setSending(true);
    setError('');
    try {
      await apiClient.createNegotiationOffer({
        itemType,
        itemId,
        proposedPrice,
        message: message || undefined,
        clientName: name || undefined,
        clientPhone: phone || undefined,
      });
      setDone(true);
    } catch (e: any) {
      setError(e?.response?.data?.error || e?.message || 'Envoi échoué. Réessayez.');
    } finally {
      setSending(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm font-medium py-2 px-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-4 h-4" />
        Offre envoyée ! Le commerçant va vous répondre.
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={
          variant === 'full'
            ? `flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300/50 dark:border-amber-700/50 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-all duration-200 ${className}`
            : `flex items-center justify-center gap-2 py-3 rounded-xl font-medium text-sm text-amber-700 dark:text-amber-300 border border-amber-300/60 dark:border-amber-700/60 hover:bg-amber-50 dark:hover:bg-amber-900/30 transition-all duration-200 ${className}`
        }
      >
        <Handshake className="w-4 h-4" /> Négocier le prix
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4"
          onClick={reset}
        >
          <div
            className="w-full sm:max-w-md bg-white dark:bg-gray-900 rounded-t-3xl sm:rounded-3xl p-6 shadow-2xl border border-gray-100 dark:border-gray-800"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <Handshake className="w-5 h-5 text-amber-500" /> Proposer un prix
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{itemName}</p>
              </div>
              <button
                onClick={reset}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/60 text-sm">
              <span className="text-gray-500 dark:text-gray-400">Prix affiché : </span>
              <span className="font-semibold text-gray-900 dark:text-gray-100">
                {basePrice.toLocaleString()} {currency}
              </span>
            </div>

            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Votre prix proposé ({currency})
            </label>
            <input
              type="number"
              min={1}
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={`Moins de ${basePrice.toLocaleString()}`}
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
            />

            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              Message (optionnel)
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={2}
              placeholder="Ex : Bonjour, je prends 2 si vous me faites ce prix…"
              className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm mb-3 focus:outline-none focus:ring-2 focus:ring-amber-500/40 resize-none"
            />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Votre nom
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nom"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                  Téléphone (WhatsApp)
                </label>
                <input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+225…"
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                />
              </div>
            </div>

            {error && <p className="text-xs text-red-600 dark:text-red-400 mb-3">{error}</p>}

            <button
              onClick={submit}
              disabled={sending}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm bg-amber-500 hover:bg-amber-600 text-white transition-all duration-200 disabled:opacity-60"
            >
              {sending ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4" /> Envoyer mon offre
                </>
              )}
            </button>
            <p className="text-[11px] text-gray-400 dark:text-gray-500 text-center mt-3">
              Le commerçant accepte, contre-propose ou refuse — vous recevrez sa réponse.
            </p>
          </div>
        </div>
      )}
    </>
  );
}
