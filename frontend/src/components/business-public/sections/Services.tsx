'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Service } from '@/types/business';
import { Clock, Wrench, Calendar, FileText } from 'lucide-react';
import { formatPrice } from '@/utils/helpers';
import { QuoteRequestModal } from '../QuoteRequestModal';

interface ServicesProps {
  services: Service[];
  businessSlug?: string;
}

export function Services({ services, businessSlug }: ServicesProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<string | undefined>();

  if (!services?.length) return null;

  const openQuoteModal = (serviceName?: string) => {
    setSelectedService(serviceName);
    setModalOpen(true);
  };

  return (
    <>
      <section id="section-services" className="scroll-mt-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-8">Nos Services</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {services.map((service) => (
              <div key={service.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
                {service.images?.[0] && (
                  <div className="h-40 bg-gray-100 dark:bg-gray-700 relative overflow-hidden">
                    <Image src={service.images[0]} alt={service.name} fill className="object-cover" />
                  </div>
                )}
                <div className="p-6">
                  <div className="w-12 h-12 rounded-lg bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center mb-4">
                    <Wrench className="w-6 h-6 text-brand" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{service.name}</h3>
                  {service.description && <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 line-clamp-3">{service.description}</p>}
                  <div className="flex items-center justify-between mb-4">
                    {service.price != null && (
                      <span className="text-lg font-bold text-brand">{formatPrice(Number(service.price), service.currency)}</span>
                    )}
                    {service.duration && (
                      <span className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400">
                        <Clock className="w-3.5 h-3.5" /> {service.duration} min
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button className="flex items-center gap-1 px-3 py-1.5 bg-brand text-white text-xs font-medium rounded-lg hover:bg-brand-600 transition-colors">
                      <Calendar className="w-3 h-3" /> Réserver
                    </button>
                    <button
                      onClick={() => openQuoteModal(service.name)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <FileText className="w-3 h-3" /> Devis
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      {businessSlug && (
        <QuoteRequestModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          businessSlug={businessSlug}
          serviceName={selectedService}
        />
      )}
    </>
  );
}
