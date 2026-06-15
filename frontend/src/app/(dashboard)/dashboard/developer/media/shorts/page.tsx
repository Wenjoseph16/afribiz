'use client';

import { useState, useRef } from 'react';
import { Film, Play, Heart, MessageCircle, Eye, X, Plus, ThumbsUp, Clock } from 'lucide-react';
import { PageHeader } from '@/components/dashboard/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/dashboard/EmptyState';
import { useDeveloperModules } from '@/features/developerHooks';

export default function DeveloperShortsPage() {
  const [showUploader, setShowUploader] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedModuleId, setSelectedModuleId] = useState('');
  const [preview, setPreview] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const { data: modulesData } = useDeveloperModules();
  const modules = Array.isArray(modulesData) ? modulesData : (modulesData as any)?.modules || [];

  const shorts: Array<{ title: string; views: number; likes: number; comments: number; createdAt: string; duration: number }> = [];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
  };

  const handleUpload = () => {
    setShowUploader(false);
    setTitle(''); setDescription(''); setSelectedModuleId(''); setPreview(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Shorts" description="Creez et gerez vos videos courtes"
        actions={
          <button onClick={() => setShowUploader(!showUploader)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-brand-500 to-emerald-500 text-white rounded-xl text-sm font-medium">
            {showUploader ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showUploader ? 'Fermer' : 'Nouveau short'}
          </button>
        }
      />
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card padding="md"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-brand-100 dark:bg-brand-900/20 text-brand"><Film className="h-5 w-5" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Total</p><p className="text-lg font-bold text-gray-900 dark:text-gray-100">{shorts.length}</p></div></div></Card>
        <Card padding="md"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/20 text-blue-600"><Eye className="h-5 w-5" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Vues</p><p className="text-lg font-bold">{shorts.reduce((s: number, v) => s + v.views, 0)}</p></div></div></Card>
        <Card padding="md"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/20 text-pink-600"><Heart className="h-5 w-5" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Likes</p><p className="text-lg font-bold">{shorts.reduce((s: number, v) => s + v.likes, 0)}</p></div></div></Card>
        <Card padding="md"><div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/20 text-purple-600"><MessageCircle className="h-5 w-5" /></div><div><p className="text-xs text-gray-500 dark:text-gray-400">Commentaires</p><p className="text-lg font-bold">{shorts.reduce((s: number, v) => s + v.comments, 0)}</p></div></div></Card>
      </div>
      <EmptyState icon={<Film className="h-12 w-12" />} title="Aucun short"
        description="Creez votre premier short video pour presenter vos modules."
        action={<Button variant="gradient" onClick={() => setShowUploader(true)}><Plus className="h-4 w-4" />Creer un short</Button>} />
    </div>
  );
}
