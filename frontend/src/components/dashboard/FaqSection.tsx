'use client';

import { useState } from 'react';
import { Plus, Trash2, HelpCircle, Edit3, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/components/ui/ToastProvider';
import { useMyFaqs, useCreateFaq, useUpdateFaq, useDeleteFaq } from '@/features/hooks';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

export function FaqSection() {
  const { addToast } = useToast();
  const { data: faqs, isLoading } = useMyFaqs();
  const createFaq = useCreateFaq();
  const updateFaq = useUpdateFaq();
  const deleteFaq = useDeleteFaq();

  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');

  const handleCreate = async () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    try {
      await createFaq.mutateAsync({ question: newQuestion.trim(), answer: newAnswer.trim() });
      setNewQuestion('');
      setNewAnswer('');
      addToast({ title: 'FAQ ajoutee avec succes', variant: 'success' });
    } catch {
      addToast({ title: 'Erreur lors de la creation de la FAQ', variant: 'error' });
    }
  };

  const handleUpdate = async (faqId: string) => {
    if (!editQuestion.trim() || !editAnswer.trim()) return;
    try {
      await updateFaq.mutateAsync({
        faqId,
        data: { question: editQuestion.trim(), answer: editAnswer.trim() },
      });
      setEditingId(null);
      addToast({ title: 'FAQ mise a jour', variant: 'success' });
    } catch {
      addToast({ title: 'Erreur lors de la mise a jour', variant: 'error' });
    }
  };

  const handleDelete = async (faqId: string) => {
    try {
      await deleteFaq.mutateAsync(faqId);
      addToast({ title: 'FAQ supprimee', variant: 'success' });
    } catch {
      addToast({ title: 'Erreur lors de la suppression', variant: 'error' });
    }
  };

  return (
    <Card title="Questions frequentes (FAQ)">
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
        Gerez les questions frequentes affichees sur votre page publique.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-gray-400" />
        </div>
      ) : !faqs || faqs.length === 0 ? (
        <div className="text-center py-8">
          <HelpCircle className="h-10 w-10 text-gray-300 mx-auto mb-3" />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Aucune FAQ configuree pour le moment.
          </p>
        </div>
      ) : (
        <div className="space-y-2 mb-6">
          {(faqs as any[]).map((faq: any, index: number) => (
            <div
              key={faq.id}
              className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 border"
            >
              <div className="text-xs text-gray-400 font-mono mt-1 w-5 text-right shrink-0">
                {index + 1}
              </div>
              {editingId === faq.id ? (
                <div className="flex-1 space-y-2">
                  <input
                    value={editQuestion}
                    onChange={(e) => setEditQuestion(e.target.value)}
                    placeholder="Question"
                    className="w-full text-sm rounded-lg border px-3 py-1.5"
                  />
                  <textarea
                    value={editAnswer}
                    onChange={(e) => setEditAnswer(e.target.value)}
                    placeholder="Reponse"
                    rows={2}
                    className="w-full text-sm rounded-lg border px-3 py-1.5 resize-none"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleUpdate(faq.id)}
                      className="px-3 py-1 text-xs font-medium bg-brand text-white rounded-lg"
                    >
                      <CheckIcon className="h-3 w-3" /> Enregistrer
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="px-3 py-1 text-xs font-medium bg-gray-200 rounded-lg"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{faq.question}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{faq.answer}</p>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingId(faq.id);
                        setEditQuestion(faq.question);
                        setEditAnswer(faq.answer);
                      }}
                      className="p-1.5 rounded-lg hover:text-brand"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(faq.id)}
                      className="p-1.5 rounded-lg hover:text-red-500"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="border-t pt-4">
        <p className="text-sm font-medium mb-3">Ajouter une question</p>
        <div className="space-y-2">
          <input
            value={newQuestion}
            onChange={(e) => setNewQuestion(e.target.value)}
            placeholder="Question frequente..."
            className="w-full text-sm rounded-xl border px-4 py-2.5"
          />
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder="Reponse..."
            rows={2}
            className="w-full text-sm rounded-xl border px-4 py-2.5 resize-none"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={handleCreate}
            disabled={!newQuestion.trim() || !newAnswer.trim() || createFaq.isPending}
          >
            {createFaq.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Ajouter
          </Button>
        </div>
      </div>
    </Card>
  );
}
