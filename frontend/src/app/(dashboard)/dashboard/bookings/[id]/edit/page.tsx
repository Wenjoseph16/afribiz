'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, Loader, Calendar } from 'lucide-react';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useBooking } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

const STATUS_OPTIONS = [
  { value: 'PENDING', label: 'En attente' },
  { value: 'CONFIRMED', label: 'Confirmée' },
  { value: 'IN_PROGRESS', label: 'En cours' },
  { value: 'COMPLETED', label: 'Terminée' },
  { value: 'CANCELLED', label: 'Annulée' },
  { value: 'RESCHEDULED', label: 'Reportée' },
];

export default function EditBookingPage() {
  const params = useParams();
  const router = useRouter();
  const qc = useQueryClient();
  const id = params?.id as string;
  const { data: bookingData, isLoading: loadingBooking } = useBooking(id);
  const booking: any = bookingData?.booking || bookingData || {};

  const [form, setForm] = useState({
    clientName: '',
    status: 'PENDING',
    notes: '',
    date: '',
    startTime: '',
    endTime: '',
    totalAmount: '',
    paidAmount: '',
  });

  useEffect(() => {
    if (!booking.id) return;
    const start = booking.startDate || booking.date;
    const startDate = start ? new Date(start) : null;
    const end = booking.endDate ? new Date(booking.endDate) : null;

    setForm({
      clientName: booking.clientName || booking.client?.name || '',
      status: booking.status || 'PENDING',
      notes: booking.specialRequests || booking.notes || '',
      date: startDate ? startDate.toISOString().slice(0, 10) : '',
      startTime: startDate ? startDate.toTimeString().slice(0, 5) : '',
      endTime: end ? end.toTimeString().slice(0, 5) : '',
      totalAmount: String(booking.price ?? booking.totalAmount ?? ''),
      paidAmount: String(booking.depositAmount ?? booking.paidAmount ?? ''),
    });
  }, [booking]);

  const updateMutation = useMutation({
    mutationFn: (data: any) => apiClient.put(`/bookings/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bookings'] });
      router.push(`/dashboard/bookings/${id}`);
    },
  });

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const startDateTime = form.date && form.startTime
      ? new Date(`${form.date}T${form.startTime}`).toISOString()
      : undefined;
    const endDateTime = form.date && form.endTime
      ? new Date(`${form.date}T${form.endTime}`).toISOString()
      : undefined;

    updateMutation.mutate({
      clientName: form.clientName || undefined,
      status: form.status,
      specialRequests: form.notes || undefined,
      startDate: startDateTime,
      endDate: endDateTime,
      price: form.totalAmount ? Number(form.totalAmount) : undefined,
      depositAmount: form.paidAmount ? Number(form.paidAmount) : undefined,
    });
  };

  if (loadingBooking) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  if (!booking.id) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-500">Réservation non trouvée</p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-3xl">
      <PageHeader
        title="Modifier la réservation"
        description={booking.bookingNumber || `#${booking.id?.slice(0, 8)}`}
        breadcrumbs={[
          { label: 'Réservations', href: '/dashboard/bookings' },
          { label: booking.bookingNumber || `#${booking.id?.slice(0, 8)}`, href: `/dashboard/bookings/${id}` },
          { label: 'Modifier' },
        ]}
        actions={
          <Link
            href={`/dashboard/bookings/${id}`}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Retour
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Informations</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Client</label>
              <input
                type="text"
                value={form.clientName}
                onChange={(e) => handleChange('clientName', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                placeholder="Nom du client"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Statut</label>
              <select
                value={form.status}
                onChange={(e) => handleChange('status', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              >
                {STATUS_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes</label>
              <textarea
                value={form.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                rows={3}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all resize-none"
                placeholder="Notes ou demandes spéciales..."
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-brand" />
            Planning
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Date</label>
              <input
                type="date"
                value={form.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Début</label>
              <input
                type="time"
                value={form.startTime}
                onChange={(e) => handleChange('startTime', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Fin</label>
              <input
                type="time"
                value={form.endTime}
                onChange={(e) => handleChange('endTime', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
              />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Montant</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Montant total (FCFA)</label>
              <input
                type="number"
                value={form.totalAmount}
                onChange={(e) => handleChange('totalAmount', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                placeholder="0"
                min={0}
                step="0.01"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Montant payé (FCFA)</label>
              <input
                type="number"
                value={form.paidAmount}
                onChange={(e) => handleChange('paidAmount', e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100 focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none transition-all"
                placeholder="0"
                min={0}
                step="0.01"
              />
            </div>
          </div>
        </Card>

        <div className="flex items-center justify-end gap-3 pb-8">
          <Link
            href={`/dashboard/bookings/${id}`}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            Annuler
          </Link>
          <Button type="submit" isLoading={updateMutation.isPending}>
            <Save className="w-4 h-4" />
            Enregistrer
          </Button>
        </div>
      </form>
    </div>
  );
}
