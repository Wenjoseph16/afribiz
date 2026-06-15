'use client';

import { useState } from 'react';
import { Radio, Calendar, Eye, Play, X, Plus, Users, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/dashboard/EmptyState';

export default function DeveloperLivesPage() {
  const [showPlanner, setShowPlanner] = useState(false);
  const lives = [];

  return (
    <div className="space-y-6">
      <PageHeader title="Lives Commerciaux" description="Organisez des sessions en direct"
        actions={
          <button onClick={() => setShowPlanner(!showPlanner)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-xl text-sm font-medium">
            {showPlanner ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showPlanner ? 'Fermer' : 'Planifier un live'}
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card padding="md"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/20 text-red-600"><Radio className="h-5 w-5" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Total lives</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{lives.length}</p></div></div></Card>
        <Card padding="md"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/20 text-emerald-600"><Eye className="h-5 w-5" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Spectateurs</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">0</p></div></div></Card>
        <Card padding="md"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600"><Users className="h-5 w-5" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Pic viewers</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">0</p></div></div></Card>
      </div>

      <EmptyState icon={<Radio className="h-12 w-12" />} title="Aucun live planifie"
        description="Planifiez votre premier live pour presenter vos modules en direct."
        action={<Button variant="gradient" onClick={() => setShowPlanner(true)}><Plus className="h-4 w-4" />Planifier un live</Button>} />

      <Card padding="lg" className="bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/20 dark:to-orange-950/20">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Pourquoi organiser des lives ?</h4>
            <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
              <li>Presentez vos modules en action avec des demos en direct</li>
              <li>Repondez aux questions de la communaute en temps reel</li>
              <li>Les lives augmentent de 3x le taux d'installation des modules</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
