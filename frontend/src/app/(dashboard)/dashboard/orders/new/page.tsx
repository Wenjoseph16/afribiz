'use client';

import Link from 'next/link';
import { ArrowLeft, Store, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

export default function NewOrderPage() {
  return (
    <div className="animate-fade-in space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Nouvelle commande</h1>
          <p className="text-sm text-gray-500">Passez une commande auprès d&apos;une entreprise</p>
        </div>
      </div>

      <Card className="p-8 text-center">
        <ShoppingBag className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Parcourez le marketplace
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Pour passer une commande, explorez les entreprises disponibles sur le marketplace, 
          consultez leurs produits et services, puis passez commande directement depuis leur page.
        </p>
        <Link href="/dashboard/explore">
          <Button size="lg">
            <Store className="h-5 w-5 mr-2" />
            Explorer le marketplace
          </Button>
        </Link>
      </Card>
    </div>
  );
}
