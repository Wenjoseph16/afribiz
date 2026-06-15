'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Info,
  CalendarDays,
  MapPin,
  Users,
  Ticket,
  ClipboardCheck,
  UserCircle,
  Handshake,
  FileText,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Save,
  Globe,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Loader } from '@/components/ui/Loader';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { ErrorState } from '@/components/ui/ErrorState';
import { useMyEvent, useUpdateEvent } from '@/features/hooks';
import { cn } from '@/lib/utils';

const EVENT_TYPES = [
  'CONCERT', 'PARTY', 'CONFERENCE', 'WORKSHOP', 'FESTIVAL',
  'TOURNAMENT', 'NETWORKING', 'WEBINAR', 'EXHIBITION',
  'PRIVATE', 'VIP', 'LAUNCH', 'PROMOTION', 'OTHER',
] as const;

const TICKET_TYPES = ['FREE', 'STANDARD', 'PREMIUM', 'VIP', 'TABLE'] as const;

const LOCATION_TYPES = ['PHYSICAL', 'ONLINE', 'HYBRID'] as const;

const TIMEZONES = [
  'Africa/Abidjan', 'Africa/Dakar', 'Africa/Lagos', 'Africa/Accra',
  'Africa/Nairobi', 'Africa/Casablanca', 'Africa/Johannesburg',
  'Africa/Cairo', 'Africa/Algiers', 'Africa/Tunis',
];

const PARTNER_TYPES = [
  { value: 'PARTNER', label: 'Partenaire' },
  { value: 'SPONSOR', label: 'Sponsor' },
] as const;

const inputCls =
  'w-full px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100';

const labelCls = 'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1';

interface TicketForm {
  id: string;
  name: string;
  type: (typeof TICKET_TYPES)[number];
  price: string;
  quantity: string;
  benefits: string;
  saleEndAt: string;
}

interface PartnerForm {
  id: string;
  name: string;
  logo: string;
  website: string;
  type: 'PARTNER' | 'SPONSOR';
}

let ticketIdCounter = 1;
let partnerIdCounter = 1;

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toISOString().split('T')[0];
  } catch {
    return '';
  }
}

function formatTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '';
  try {
    return new Date(dateStr).toTimeString().slice(0, 5);
  } catch {
    return '';
  }
}

export default function EditEventPage() {
  const params = useParams();
  const id = (params?.id as string) || '';
  const router = useRouter();
  const { data: event, isLoading, error, refetch } = useMyEvent(id);
  const updateEvent = useUpdateEvent();

  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    general: true,
    datetime: false,
    location: false,
    capacity: false,
    tickets: false,
    reservations: false,
    organizer: false,
    partners: false,
    conditions: false,
  });

  const toggle = (key: string) =>
    setOpenSections((s) => ({ ...s, [key]: !s[key] }));

  // Section 1
  const [title, setTitle] = useState('');
  const [eventType, setEventType] = useState<string>('CONFERENCE');
  const [shortDescription, setShortDescription] = useState('');
  const [description, setDescription] = useState('');
  const [coverImage, setCoverImage] = useState('');

  // Section 2
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [timezone, setTimezone] = useState('Africa/Abidjan');

  // Section 3
  const [locationType, setLocationType] = useState<string>('PHYSICAL');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [onlineLink, setOnlineLink] = useState('');

  // Section 4
  const [capacity, setCapacity] = useState('');
  const [minCapacity, setMinCapacity] = useState('');
  const [closeWhenFull, setCloseWhenFull] = useState(false);

  // Section 5
  const [tickets, setTickets] = useState<TicketForm[]>([]);

  const addTicket = () =>
    setTickets((prev) => [
      ...prev,
      {
        id: `ticket-${ticketIdCounter++}`,
        name: '',
        type: 'STANDARD' as const,
        price: '',
        quantity: '100',
        benefits: '',
        saleEndAt: '',
      },
    ]);

  const removeTicket = (id: string) =>
    setTickets((prev) => prev.filter((t) => t.id !== id));

  const updateTicket = (id: string, field: keyof TicketForm, value: string) =>
    setTickets((prev) =>
      prev.map((t) => (t.id === id ? { ...t, [field]: value } : t))
    );

  // Section 6
  const [reservationRequired, setReservationRequired] = useState(false);
  const [manualValidation, setManualValidation] = useState(false);
  const [waitlistEnabled, setWaitlistEnabled] = useState(false);
  const [autoNotification, setAutoNotification] = useState(false);

  // Section 7
  const [organizerName, setOrganizerName] = useState('');
  const [organizerContact, setOrganizerContact] = useState('');
  const [organizerWhatsapp, setOrganizerWhatsapp] = useState('');
  const [organizerEmail, setOrganizerEmail] = useState('');

  // Section 8
  const [partners, setPartners] = useState<PartnerForm[]>([]);

  const addPartner = () =>
    setPartners((prev) => [
      ...prev,
      {
        id: `partner-${partnerIdCounter++}`,
        name: '',
        logo: '',
        website: '',
        type: 'PARTNER',
      },
    ]);

  const removePartner = (id: string) =>
    setPartners((prev) => prev.filter((p) => p.id !== id));

  const updatePartner = (id: string, field: keyof PartnerForm, value: string) =>
    setPartners((prev) =>
      prev.map((p) => (p.id === id ? { ...p, [field]: value } : p))
    );

  // Section 9
  const [rules, setRules] = useState('');
  const [refundPolicy, setRefundPolicy] = useState('');
  const [minAge, setMinAge] = useState('');
  const [accessConditions, setAccessConditions] = useState('');

  useEffect(() => {
    if (!event) return;
    const e: any = event;

    setTitle(e.title || '');
    setEventType(e.type || 'CONFERENCE');
    setShortDescription(e.shortDescription || '');
    setDescription(e.description || '');
    setCoverImage(e.coverImage || '');

    setStartDate(formatDate(e.startDate));
    setStartTime(formatTime(e.startDate));
    setEndDate(formatDate(e.endDate));
    setEndTime(formatTime(e.endDate));
    setTimezone(e.timezone || 'Africa/Abidjan');

    setLocationType(e.locationType || 'PHYSICAL');
    setAddress(e.address || '');
    setCity(e.city || '');
    setCountry(e.country || '');
    setLatitude(e.latitude?.toString() || '');
    setLongitude(e.longitude?.toString() || '');
    setOnlineLink(e.onlineLink || '');

    setCapacity(e.capacity?.toString() || '');
    setMinCapacity(e.minCapacity?.toString() || '');
    setCloseWhenFull(e.closeWhenFull ?? false);

    if (e.tickets && Array.isArray(e.tickets)) {
      setTickets(
        e.tickets.map((t: any) => ({
          id: `ticket-${ticketIdCounter++}`,
          name: t.name || '',
          type: t.type || 'STANDARD',
          price: t.type === 'FREE' ? '' : (t.price?.toString() ?? ''),
          quantity: t.quantity?.toString() ?? '100',
          benefits: t.benefits
            ? (Array.isArray(t.benefits) ? t.benefits : []).join(', ')
            : '',
          saleEndAt: formatDate(t.saleEndAt),
        }))
      );
    } else {
      setTickets([]);
    }

    setReservationRequired(e.reservationRequired ?? false);
    setManualValidation(e.manualValidation ?? false);
    setWaitlistEnabled(e.waitlistEnabled ?? false);
    setAutoNotification(e.autoNotification ?? false);

    setOrganizerName(e.organizerName || '');
    setOrganizerContact(e.organizerContact || '');
    setOrganizerWhatsapp(e.organizerWhatsapp || '');
    setOrganizerEmail(e.organizerEmail || '');

    if (e.partners && Array.isArray(e.partners)) {
      setPartners(
        e.partners.map((p: any) => ({
          id: `partner-${partnerIdCounter++}`,
          name: p.name || '',
          logo: p.logo || '',
          website: p.website || '',
          type: p.isSponsor ? 'SPONSOR' : 'PARTNER',
        }))
      );
    } else {
      setPartners([]);
    }

    setRules(e.rules || '');
    setRefundPolicy(e.refundPolicy || '');
    setMinAge(e.minAge?.toString() || '');
    setAccessConditions(e.accessConditions || '');
  }, [event]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      const payload: Record<string, any> = {
        title,
        type: eventType,
        shortDescription: shortDescription || undefined,
        description: description || undefined,
        coverImage: coverImage || undefined,

        startDate: startDate
          ? new Date(`${startDate}T${startTime || '00:00'}`).toISOString()
          : undefined,
        endDate: endDate
          ? new Date(`${endDate}T${endTime || '23:59'}`).toISOString()
          : undefined,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        timezone,

        locationType,
        address: address || undefined,
        city: city || undefined,
        country: country || undefined,
        latitude: latitude ? parseFloat(latitude) : undefined,
        longitude: longitude ? parseFloat(longitude) : undefined,
        onlineLink: onlineLink || undefined,

        capacity: capacity ? parseInt(capacity, 10) : undefined,
        minCapacity: minCapacity ? parseInt(minCapacity, 10) : undefined,
        closeWhenFull,

        organizerName: organizerName || undefined,
        organizerContact: organizerContact || undefined,
        organizerWhatsapp: organizerWhatsapp || undefined,
        organizerEmail: organizerEmail || undefined,

        rules: rules || undefined,
        refundPolicy: refundPolicy || undefined,
        minAge: minAge ? parseInt(minAge, 10) : undefined,
        accessConditions: accessConditions || undefined,

        reservationRequired,
        manualValidation,
        waitlistEnabled,
        autoNotification,

        tickets: tickets
          .filter((t) => t.name)
          .map((t) => ({
            name: t.name,
            type: t.type,
            price: t.type === 'FREE' ? 0 : t.price ? parseFloat(t.price) : undefined,
            quantity: t.quantity ? parseInt(t.quantity, 10) : 0,
            benefits: t.benefits
              ? t.benefits.split(',').map((b) => b.trim()).filter(Boolean)
              : [],
            saleEndAt: t.saleEndAt
              ? new Date(t.saleEndAt).toISOString()
              : undefined,
          })),

        partners: partners
          .filter((p) => p.name)
          .map((p) => ({
            name: p.name,
            logo: p.logo || undefined,
            website: p.website || undefined,
            isSponsor: p.type === 'SPONSOR',
          })),
      };

      try {
        await updateEvent.mutateAsync({ id, data: payload });
        router.push('/dashboard/events');
      } catch (e) { console.error(e); }
    },
    [
      id, title, eventType, shortDescription, description, coverImage,
      startDate, startTime, endDate, endTime, timezone,
      locationType, address, city, country, latitude, longitude, onlineLink,
      capacity, minCapacity, closeWhenFull,
      organizerName, organizerContact, organizerWhatsapp, organizerEmail,
      rules, refundPolicy, minAge, accessConditions,
      reservationRequired, manualValidation, waitlistEnabled, autoNotification,
      tickets, partners, updateEvent, router,
    ]
  );

  if (error) return <ErrorState message={error.message} onRetry={refetch} />;
  if (isLoading) return <Loader variant="spinner" size="md" fullScreen />;
  if (!event) return <p className="text-center py-12 text-gray-500">Événement introuvable</p>;

  // ─── Section Header ───────────────────────────────────────
  function SectionHeader({
    icon: Icon,
    title: sectionTitle,
    sectionKey,
  }: {
    icon: React.ElementType;
    title: string;
    sectionKey: string;
  }) {
    const isOpen = openSections[sectionKey];
    return (
      <button
        type="button"
        onClick={() => toggle(sectionKey)}
        className="flex w-full items-center justify-between py-3 text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand/10 text-brand">
            <Icon className="h-4 w-4" />
          </div>
          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
            {sectionTitle}
          </span>
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
    );
  }

  return (
    <div className="mx-auto max-w-3xl animate-fade-in">
      <PageHeader
        title="Modifier l'événement"
        description="Mettez à jour les informations de votre événement"
        breadcrumbs={[
          { label: 'Événements', href: '/dashboard/events' },
          { label: 'Modifier' },
        ]}
        actions={
          <Link href={`/dashboard/events/${id}`}>
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Retour
            </Button>
          </Link>
        }
      />

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {/* ─── Section 1 ───────────────────────────────────── */}
        <Card padding="md">
          <SectionHeader icon={Info} title="Informations générales" sectionKey="general" />
          {openSections.general && (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div>
                <label className={labelCls}>
                  Titre <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  placeholder="Nom de l'événement"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Type d&apos;événement</label>
                <select
                  value={eventType}
                  onChange={(e) => setEventType(e.target.value)}
                  className={inputCls}
                >
                  {EVENT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelCls}>Description courte</label>
                <textarea
                  rows={3}
                  value={shortDescription}
                  onChange={(e) => setShortDescription(e.target.value)}
                  placeholder="Brève description (s'affiche dans les cartes)"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Description détaillée</label>
                <textarea
                  rows={6}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description complète de l'événement"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Image de couverture</label>
                <input
                  type="url"
                  value={coverImage}
                  onChange={(e) => setCoverImage(e.target.value)}
                  placeholder="https://exemple.com/image.jpg"
                  className={inputCls}
                />
              </div>
            </div>
          )}
        </Card>

        {/* ─── Section 2 ───────────────────────────────────── */}
        <Card padding="md">
          <SectionHeader icon={CalendarDays} title="Date & horaire" sectionKey="datetime" />
          {openSections.datetime && (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>
                    Date début <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Heure début</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Date fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Heure fin</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>
                  <Globe className="mr-1 inline h-3.5 w-3.5" />
                  Fuseau horaire
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className={inputCls}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </Card>

        {/* ─── Section 3 ───────────────────────────────────── */}
        <Card padding="md">
          <SectionHeader icon={MapPin} title="Localisation" sectionKey="location" />
          {openSections.location && (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div>
                <label className={labelCls}>Type</label>
                <select
                  value={locationType}
                  onChange={(e) => setLocationType(e.target.value)}
                  className={inputCls}
                >
                  {LOCATION_TYPES.map((lt) => (
                    <option key={lt} value={lt}>
                      {lt === 'PHYSICAL'
                        ? 'Physique'
                        : lt === 'ONLINE'
                          ? 'En ligne'
                          : 'Hybride'}
                    </option>
                  ))}
                </select>
              </div>

              {(locationType === 'PHYSICAL' || locationType === 'HYBRID') && (
                <>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    <div className="md:col-span-2">
                      <label className={labelCls}>Adresse</label>
                      <input
                        type="text"
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        placeholder="123 Rue des Arts"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Ville</label>
                      <input
                        type="text"
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        placeholder="Abidjan"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Pays</label>
                      <input
                        type="text"
                        value={country}
                        onChange={(e) => setCountry(e.target.value)}
                        placeholder="Côte d'Ivoire"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => setLatitude(e.target.value)}
                        placeholder="5.3600"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => setLongitude(e.target.value)}
                        placeholder="-4.0083"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </>
              )}

              {(locationType === 'ONLINE' || locationType === 'HYBRID') && (
                <div>
                  <label className={labelCls}>Lien (Zoom / Meet / etc.)</label>
                  <input
                    type="url"
                    value={onlineLink}
                    onChange={(e) => setOnlineLink(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className={inputCls}
                  />
                </div>
              )}
            </div>
          )}
        </Card>

        {/* ─── Section 4 ───────────────────────────────────── */}
        <Card padding="md">
          <SectionHeader icon={Users} title="Gestion capacité" sectionKey="capacity" />
          {openSections.capacity && (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Nombre max participants</label>
                  <input
                    type="number"
                    min={0}
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="500"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Nombre min participants</label>
                  <input
                    type="number"
                    min={0}
                    value={minCapacity}
                    onChange={(e) => setMinCapacity(e.target.value)}
                    placeholder="10"
                    className={inputCls}
                  />
                </div>
              </div>
              <label className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={closeWhenFull}
                  onChange={(e) => setCloseWhenFull(e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/20"
                />
                Fermer automatiquement les ventes à capacité atteinte
              </label>
            </div>
          )}
        </Card>

        {/* ─── Section 5 ───────────────────────────────────── */}
        <Card padding="md">
          <SectionHeader icon={Ticket} title="Billetterie" sectionKey="tickets" />
          {openSections.tickets && (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              {tickets.map((ticket, index) => {
                const subTotal =
                  ticket.type === 'FREE'
                    ? 0
                    : (parseFloat(ticket.price) || 0) * (parseInt(ticket.quantity, 10) || 0);
                return (
                  <div
                    key={ticket.id}
                    className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                        Billet {index + 1}
                      </span>
                      {tickets.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeTicket(ticket.id)}
                          className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3 w-3" />
                          Supprimer
                        </button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <div>
                        <label className={labelCls}>Nom</label>
                        <input
                          type="text"
                          value={ticket.name}
                          onChange={(e) => updateTicket(ticket.id, 'name', e.target.value)}
                          placeholder="Entrée standard"
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Type</label>
                        <select
                          value={ticket.type}
                          onChange={(e) => updateTicket(ticket.id, 'type', e.target.value)}
                          className={inputCls}
                        >
                          {TICKET_TYPES.map((tt) => (
                            <option key={tt} value={tt}>
                              {tt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Prix (FCFA)</label>
                        <input
                          type="number"
                          min={0}
                          step="0.01"
                          value={ticket.price}
                          onChange={(e) => updateTicket(ticket.id, 'price', e.target.value)}
                          disabled={ticket.type === 'FREE'}
                          placeholder={ticket.type === 'FREE' ? 'Gratuit' : '5000'}
                          className={cn(inputCls, ticket.type === 'FREE' && 'opacity-50')}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Quantité</label>
                        <input
                          type="number"
                          min={0}
                          value={ticket.quantity}
                          onChange={(e) => updateTicket(ticket.id, 'quantity', e.target.value)}
                          className={inputCls}
                        />
                      </div>
                      <div>
                        <label className={labelCls}>Avantages</label>
                        <input
                          type="text"
                          value={ticket.benefits}
                          onChange={(e) => updateTicket(ticket.id, 'benefits', e.target.value)}
                          placeholder="Accès VIP, Boisson offerte"
                          className={inputCls}
                        />
                        <p className="mt-1 text-xs text-gray-400">
                          Séparés par des virgules
                        </p>
                      </div>
                      <div>
                        <label className={labelCls}>Date expiration vente</label>
                        <input
                          type="date"
                          value={ticket.saleEndAt}
                          onChange={(e) => updateTicket(ticket.id, 'saleEndAt', e.target.value)}
                          className={inputCls}
                        />
                      </div>
                    </div>
                    <div className="mt-3 text-right text-sm font-medium text-gray-700 dark:text-gray-300">
                      Sous-total :{' '}
                      {subTotal.toLocaleString('fr-FR')} FCFA
                    </div>
                  </div>
                );
              })}
              <Button type="button" variant="outline" size="sm" onClick={addTicket}>
                <Plus className="mr-1.5 h-4 w-4" />
                Ajouter un billet
              </Button>
            </div>
          )}
        </Card>

        {/* ─── Section 6 ───────────────────────────────────── */}
        <Card padding="md">
          <SectionHeader icon={ClipboardCheck} title="Réservations" sectionKey="reservations" />
          {openSections.reservations && (
            <div className="space-y-3 border-t border-gray-100 dark:border-gray-700 pt-4">
              {([
                [reservationRequired, setReservationRequired, 'Réservation obligatoire'],
                [manualValidation, setManualValidation, 'Validation manuelle des inscriptions'],
                [waitlistEnabled, setWaitlistEnabled, "Activer la liste d'attente"],
                [autoNotification, setAutoNotification, 'Notification automatique aux participants'],
              ] as const).map(([checked, setter, label]) => (
                <label
                  key={label}
                  className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => setter(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-brand focus:ring-brand/20"
                  />
                  {label}
                </label>
              ))}
            </div>
          )}
        </Card>

        {/* ─── Section 7 ───────────────────────────────────── */}
        <Card padding="md">
          <SectionHeader icon={UserCircle} title="Organisateur" sectionKey="organizer" />
          {openSections.organizer && (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Nom organisateur</label>
                  <input
                    type="text"
                    value={organizerName}
                    onChange={(e) => setOrganizerName(e.target.value)}
                    placeholder="John Doe"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Contact</label>
                  <input
                    type="text"
                    value={organizerContact}
                    onChange={(e) => setOrganizerContact(e.target.value)}
                    placeholder="+225 01 02 03 04 05"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>WhatsApp</label>
                  <input
                    type="text"
                    value={organizerWhatsapp}
                    onChange={(e) => setOrganizerWhatsapp(e.target.value)}
                    placeholder="+225 01 02 03 04 05"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className={labelCls}>Email</label>
                  <input
                    type="email"
                    value={organizerEmail}
                    onChange={(e) => setOrganizerEmail(e.target.value)}
                    placeholder="contact@exemple.com"
                    className={inputCls}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* ─── Section 8 ───────────────────────────────────── */}
        <Card padding="md">
          <SectionHeader icon={Handshake} title="Partenaires / Sponsors" sectionKey="partners" />
          {openSections.partners && (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              {partners.map((partner, index) => (
                <div
                  key={partner.id}
                  className="rounded-xl border border-gray-100 bg-gray-50/50 p-4 dark:border-gray-700 dark:bg-gray-800/50"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Partenaire {index + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removePartner(partner.id)}
                      className="flex items-center gap-1 text-xs text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-3 w-3" />
                      Supprimer
                    </button>
                  </div>
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <div>
                      <label className={labelCls}>Nom</label>
                      <input
                        type="text"
                        value={partner.name}
                        onChange={(e) => updatePartner(partner.id, 'name', e.target.value)}
                        placeholder="Nom du partenaire"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Type</label>
                      <select
                        value={partner.type}
                        onChange={(e) => updatePartner(partner.id, 'type', e.target.value)}
                        className={inputCls}
                      >
                        {PARTNER_TYPES.map((pt) => (
                          <option key={pt.value} value={pt.value}>
                            {pt.label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Logo URL</label>
                      <input
                        type="text"
                        value={partner.logo}
                        onChange={(e) => updatePartner(partner.id, 'logo', e.target.value)}
                        placeholder="https://exemple.com/logo.png"
                        className={inputCls}
                      />
                    </div>
                    <div>
                      <label className={labelCls}>Site web</label>
                      <input
                        type="url"
                        value={partner.website}
                        onChange={(e) => updatePartner(partner.id, 'website', e.target.value)}
                        placeholder="https://exemple.com"
                        className={inputCls}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" size="sm" onClick={addPartner}>
                <Plus className="mr-1.5 h-4 w-4" />
                Ajouter un partenaire
              </Button>
            </div>
          )}
        </Card>

        {/* ─── Section 9 ───────────────────────────────────── */}
        <Card padding="md">
          <SectionHeader icon={FileText} title="Conditions" sectionKey="conditions" />
          {openSections.conditions && (
            <div className="space-y-4 border-t border-gray-100 dark:border-gray-700 pt-4">
              <div>
                <label className={labelCls}>Règles</label>
                <textarea
                  rows={3}
                  value={rules}
                  onChange={(e) => setRules(e.target.value)}
                  placeholder="Règles de l'événement..."
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Politique de remboursement</label>
                <textarea
                  rows={3}
                  value={refundPolicy}
                  onChange={(e) => setRefundPolicy(e.target.value)}
                  placeholder="Conditions de remboursement..."
                  className={inputCls}
                />
              </div>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div>
                  <label className={labelCls}>Âge minimum</label>
                  <input
                    type="number"
                    min={0}
                    value={minAge}
                    onChange={(e) => setMinAge(e.target.value)}
                    placeholder="18"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className={labelCls}>Conditions d&apos;accès</label>
                <textarea
                  rows={3}
                  value={accessConditions}
                  onChange={(e) => setAccessConditions(e.target.value)}
                  placeholder="Pièces d'identité requises, code vestimentaire..."
                  className={inputCls}
                />
              </div>
            </div>
          )}
        </Card>

        {/* ─── Submit ──────────────────────────────────────── */}
        <div className="flex items-center justify-end gap-3 pb-8 pt-2">
          <Link href={`/dashboard/events/${id}`}>
            <Button variant="secondary" type="button">
              Annuler
            </Button>
          </Link>
          <Button type="submit" isLoading={updateEvent.isPending}>
            <Save className="mr-1.5 h-4 w-4" />
            {updateEvent.isPending ? "Enregistrement..." : "Enregistrer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
