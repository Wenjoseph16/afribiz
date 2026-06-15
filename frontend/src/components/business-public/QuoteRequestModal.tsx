'use client';

import { useState } from 'react';
import { X, Loader, FileText, CheckCircle } from 'lucide-react';
import { apiClient } from '@/services/apiClient';

interface QuoteRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  businessSlug: string;
  serviceName?: string;
}

export function QuoteRequestModal({ isOpen, onClose, businessSlug, serviceName }: QuoteRequestModalProps) {
  const [form, setForm] = useState({ customerName: '', customerEmail: '', customerPhone: '', description: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerName || !form.customerPhone) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await apiClient.post('/public/businesses/' + businessSlug + '/quote-request', { ...form, serviceName });
      if (!res.data.success) {
        setError(res.data.error || 'Une erreur est survenue');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Erreur de connexion. Veuillez r\u00e9essayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-scale-in">
        {success ? (
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-emerald-600" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">Demande envoy\u00e9e !</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
              Votre demande de devis a \u00e9t\u00e9 transmise. Le professionnel vous contactera sous peu.
            </p>
            <button onClick={onClose}
              className="px-6 py-2 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors">
              Fermer
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between p-6 pb-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-brand" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Demande de devis</h3>
                  {serviceName && <p className="text-xs text-gray-500">{serviceName}</p>}
                </div>
              </div>
              <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  Nom complet <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
                  placeholder="Votre nom" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                  T\u00e9l\u00e9phone <span className="text-red-500">*</span>
                </label>
                <input type="tel" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
                  placeholder="+229 XX XX XX XX" required />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
                <input type="email" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100"
                  placeholder="votre@email.com" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100 resize-none"
                  rows={3} placeholder="D\u00e9crivez ce dont vous avez besoin..." />
              </div>
              {error && <p className="text-xs text-red-600 bg-red-50 dark:bg-red-900/20 p-2 rounded-lg">{error}</p>}
              <button type="submit" disabled={loading}
                className="w-full py-2.5 bg-brand text-white text-sm font-medium rounded-xl hover:bg-brand-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                {loading ? <Loader className="w-4 h-4 animate-spin" /> : null}
                {loading ? 'Envoi en cours...' : 'Envoyer la demande'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
