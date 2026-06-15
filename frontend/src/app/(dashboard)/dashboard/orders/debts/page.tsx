'use client';

import Link from 'next/link';
import { ArrowLeft, DollarSign, ShoppingBag } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default function DebtsPage() {
  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/dashboard/orders" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"><ArrowLeft className="w-5 h-5 text-gray-500" /></Link>
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dettes</h1><p className="text-sm text-gray-500">Consultez le solde de vos commandes</p></div>
      </div>

      <Card className="p-8 text-center">
        <DollarSign className="h-16 w-16 text-gray-200 dark:text-gray-700 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Suivez vos paiements
        </h2>
        <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
          Le solde de vos commandes et vos échéances de paiement sont directement 
          accessibles depuis le détail de chaque commande.
        </p>
        <Link href="/dashboard/orders">
          <Button>
            <ShoppingBag className="h-4 w-4 mr-2" />
            Voir mes commandes
          </Button>
        </Link>
      </Card>
    </div>
  );
}
