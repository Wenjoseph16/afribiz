'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft, Calendar, Clock, DollarSign, FileText, Shield,
  AlertTriangle, CheckCircle2, ChevronRight, Loader2, MapPin,
} from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Modal } from '@/components/ui/Modal';
import { Loader } from '@/components/ui/Loader';
import { ErrorState } from '@/components/ui/ErrorState';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import Image from 'next/image';
import { useProlongRentalBooking } from '@/features/hooks';

const STATUS_LABELS: Record<string, string> = {
  PENDING: 'En attente', CONFIRMED: 'Confirmée', IN_PROGRESS: 'En cours',
  COMPLETED: 'Terminée', CANCELLED: 'Annulée',
};

export default function RentalDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [prolongModal, setProlongModal] = useState(false);
  const [newEndDate, setNewEndDate] = useState('');
  const prolongMutation = useProlongRentalBooking();

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', params.id],
    queryFn: async () => {
      const res = await apiClient.getBooking(params.id as string);
      return res.data.data;
    },
  });

  if (isLoading) return <Loader />;
  if (error) return <ErrorState message="Erreur chargement" />;
  if (!booking) return <ErrorState message="Réservation introuvable" />;

  const startDate = new Date(booking.startDate);
  const endDate = booking.endDate ? new Date(booking.endDate) : null;
  const duration = endDate ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
  const canProlong = booking.status === 'PENDING' || booking.status === 'CONFIRMED' || booking.status === 'IN_PROGRESS';

  return (
    <div className="space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900">
        <ArrowLeft className="h-4 w-4" /> Retour
      </button>

      <PageHeader
        title={booking.title || 'Détails de la location'}
        description={`Réf: ${booking.bookingNumber || booking.id.slice(0, 8)}`}
        breadcrumbs={[
          { label: 'Mes locations', href: '/dashboard/my-rentals' },
          { label: 'Détails' },
        ]}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6">
            <h2 className="text-lg font-semibold mb-4">Contrat de location</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Statut</p>
                <Badge variant="info">{STATUS_LABELS[booking.status] || booking.status}</Badge>
              </div>
              <div>
                <p className="text-gray-500">Date de début</p>
                <p className="font-medium">{startDate.toLocaleDateString('fr-FR')}</p>
              </div>
              {endDate && (
                <>
                  <div>
                    <p className="text-gray-500">Date de fin</p>
                    <p className="font-medium">{endDate.toLocaleDateString('fr-FR')}</p>
                  </div>
                  <div>
                    <p className="text-gray-500">Durée</p>
                    <p className="font-medium">{duration} jour{duration && duration > 1 ? 's' : ''}</p>
                  </div>
                </>
              )}
              <div>
                <p className="text-gray-500">Montant total</p>
                <p className="font-bold text-lg">{Number(booking.price).toLocaleString()} FCFA</p>
              </div>
              {booking.depositAmount && (
                <div>
                  <p className="text-gray-500">Caution</p>
                  <p className="font-medium">{Number(booking.depositAmount).toLocaleString()} FCFA</p>
                </div>
              )}
              {booking.location && (
                <div className="col-span-2">
                  <p className="text-gray-500">Lieu</p>
                  <p className="font-medium">{booking.location}</p>
                </div>
              )}
            </div>
            {booking.notes && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-gray-500 text-sm mb-1">Notes</p>
                <p className="text-sm whitespace-pre-wrap">{booking.notes}</p>
              </div>
            )}
          </Card>

          {booking.rental && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold mb-4">Équipement loué</h2>
              <div className="flex items-start gap-4">
                {booking.rental.images?.[0] && (
                  <Image src={booking.rental.images[0]} alt={booking.rental.name} width={80} height={80} className="rounded-lg object-cover" unoptimized />
                )}
                <div>
                  <p className="font-semibold">{booking.rental.name}</p>
                  <p className="text-sm text-gray-500">{booking.rental.description}</p>
                  <p className="text-sm mt-1">
                    {Number(booking.rental.price).toLocaleString()} FCFA / {booking.rental.priceUnit || 'jour'}
                    {booking.rental.deposit ? ` · Caution: ${Number(booking.rental.deposit).toLocaleString()} FCFA` : ''}
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          {canProlong && (
            <Card className="p-4">
              <h3 className="font-semibold mb-3">Actions</h3>
              <Button
                className="w-full" variant="primary"
                onClick={() => {
                  setNewEndDate(endDate ? endDate.toISOString().split('T')[0] : '');
                  setProlongModal(true);
                }}
              >
                <Clock className="h-4 w-4 mr-2" />
                Prolonger la location
              </Button>
              <p className="text-xs text-gray-400 mt-2">
                Prolongez votre location pour une durée supplémentaire
              </p>
            </Card>
          )}

          <Card className="p-4">
            <h3 className="font-semibold mb-3">Récapitulatif</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Sous-total</span>
                <span>{Number(booking.price).toLocaleString()} FCFA</span>
              </div>
              {booking.depositAmount && (
                <div className="flex justify-between">
                  <span className="text-gray-500">Caution</span>
                  <span>{Number(booking.depositAmount).toLocaleString()} FCFA</span>
                </div>
              )}
              <div className="border-t pt-2 flex justify-between font-semibold">
                <span>Total</span>
                <span>{(Number(booking.price) + Number(booking.depositAmount || 0)).toLocaleString()} FCFA</span>
              </div>
            </div>
          </Card>

          {booking.payments && booking.payments.length > 0 && (
            <Card className="p-4">
              <h3 className="font-semibold mb-2">Paiements</h3>
              {booking.payments.map((p: any) => (
                <div key={p.id} className="flex justify-between text-sm py-1">
                  <span className="text-gray-500">{p.method || p.status}</span>
                  <span>{Number(p.amount).toLocaleString()} FCFA</span>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      <Modal open={prolongModal} onClose={() => setProlongModal(false)}>
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Prolonger la location</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nouvelle date de fin</label>
              <input
                type="date" min={endDate ? endDate.toISOString().split('T')[0] : ''}
                value={newEndDate} onChange={(e) => setNewEndDate(e.target.value)}
                className="w-full border rounded-lg p-3 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-6">
            <Button variant="ghost" onClick={() => setProlongModal(false)}>Annuler</Button>
            <Button
              variant="primary"
              disabled={!newEndDate || prolongMutation.isPending}
              onClick={() => {
                prolongMutation.mutate({ id: booking.id, newEndDate });
                setProlongModal(false);
              }}
            >
              {prolongMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
              Confirmer la prolongation
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}