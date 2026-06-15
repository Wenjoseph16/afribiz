'use client';

import { useState, useMemo } from 'react';
import { File, Plus, Search, Loader, User, Download, Trash2, CalendarDays, X } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import { useMyEmployees } from '@/features/hooks';
import { apiClient } from '@/services/apiClient';

const DOC_TYPES = ['CONTRACT', 'ID_CARD', 'CV', 'CERTIFICATE', 'LICENSE', 'OTHER'];
const DOC_LABELS: Record<string, string> = {
  CONTRACT: 'Contrat', ID_CARD: 'Pièce identité', CV: 'CV', CERTIFICATE: 'Certificat', LICENSE: 'Permis', OTHER: 'Autre',
};

export default function EmployeeDocumentsPage() {
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null);
  const [showUpload, setShowUpload] = useState(false);
  const [uploadForm, setUploadForm] = useState({ employeeId: '', documentType: 'OTHER', description: '', fileUrl: '' });
  const [uploading, setUploading] = useState(false);

  const { data: employeesData, isLoading: loadingEmployees } = useMyEmployees({ limit: 200 });
  const [docData, setDocData] = useState<any[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const employees: any[] = useMemo(() => {
    const raw = Array.isArray(employeesData) ? employeesData : (employeesData?.employees || employeesData?.data || []);
    return raw;
  }, [employeesData]);

  const loadDocuments = async (employeeId: string) => {
    setSelectedEmployee(employeeId);
    setLoadingDocs(true);
    try {
      const res = await apiClient.getEmployeeDocuments(employeeId);
      const data = Array.isArray(res.data.data) ? res.data.data : (res.data.data?.documents || []);
      setDocData(data);
    } catch (err) { console.error(err); setDocData([]); }
    setLoadingDocs(false);
  };

  const handleUpload = async () => {
    if (!uploadForm.employeeId || !uploadForm.fileUrl) return;
    setUploading(true);
    try {
      await apiClient.createEmployeeDocument(uploadForm);
      setShowUpload(false);
      setUploadForm({ employeeId: '', documentType: 'OTHER', description: '', fileUrl: '' });
      if (selectedEmployee) loadDocuments(selectedEmployee);
    } catch (err) { console.error(err); }
    setUploading(false);
  };

  const handleDelete = async (docId: string) => {
    try {
      await apiClient.deleteEmployeeDocument(docId);
      setDocData((prev: any[]) => prev.filter((d: any) => d.id !== docId));
    } catch (err) { console.error(err); }
  };

  const filteredEmployees = employees.filter((e: any) =>
    !search || e.name?.toLowerCase().includes(search.toLowerCase())
  );

  if (loadingEmployees) return <div className="flex items-center justify-center min-h-[400px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>;

  return (
    <div className="animate-fade-in space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-gray-900 dark:text-white">Documents employés</h1><p className="text-sm text-gray-500">Gérez les documents administratifs de votre équipe</p></div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-brand/10"><File className="w-4 h-4 text-brand" /></div><div><p className="text-[10px] text-gray-500">Employés</p><p className="text-lg font-bold">{employees.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-blue-100"><File className="w-4 h-4 text-blue-600" /></div><div><p className="text-[10px] text-gray-500">Documents</p><p className="text-lg font-bold">{docData.length}</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-amber-100"><CalendarDays className="w-4 h-4 text-amber-600" /></div><div><p className="text-[10px] text-gray-500">Cette semaine</p><p className="text-lg font-bold">—</p></div></div></Card>
        <Card className="p-3"><div className="flex items-center gap-2"><div className="p-1.5 rounded-lg bg-emerald-100"><Download className="w-4 h-4 text-emerald-600" /></div><div><p className="text-[10px] text-gray-500">Téléchargés</p><p className="text-lg font-bold">—</p></div></div></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Employee list sidebar */}
        <div className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl focus:ring-2 focus:ring-brand/20 focus:border-brand outline-none bg-transparent dark:text-gray-100" />
          </div>
          <div className="space-y-1">
            {filteredEmployees.map((emp: any) => (
              <button key={emp.id} onClick={() => loadDocuments(emp.id)}
                className={cn('w-full flex items-center gap-3 p-2.5 rounded-xl text-left text-sm transition-colors',
                  selectedEmployee === emp.id ? 'bg-brand/10 text-brand font-medium' : 'hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300'
                )}>
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand/20 to-brand/10 flex items-center justify-center text-xs font-bold text-brand">
                  {(emp.name || '?')[0]}
                </div>
                <span className="truncate">{emp.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Documents area */}
        <div className="lg:col-span-2">
          {!selectedEmployee ? (
            <Card className="text-center py-12">
              <File className="h-12 w-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
              <p className="text-sm text-gray-500">Sélectionnez un employé pour voir ses documents</p>
            </Card>
          ) : loadingDocs ? (
            <div className="flex items-center justify-center min-h-[200px]"><Loader className="h-8 w-8 animate-spin text-brand" /></div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
                  Documents — {employees.find((e: any) => e.id === selectedEmployee)?.name}
                </h3>
                <Button size="sm" onClick={() => { setUploadForm(f => ({ ...f, employeeId: selectedEmployee })); setShowUpload(true); }}>
                  <Plus className="h-4 w-4 mr-1.5" />Ajouter
                </Button>
              </div>
              {docData.length === 0 ? (
                <Card className="text-center py-8"><File className="h-8 w-8 text-gray-200 dark:text-gray-700 mx-auto mb-2" /><p className="text-xs text-gray-500">Aucun document</p></Card>
              ) : (
                docData.map((doc: any) => (
                  <Card key={doc.id} className="p-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20"><File className="w-5 h-5 text-blue-600" /></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{doc.description || DOC_LABELS[doc.documentType] || doc.documentType}</p>
                          <p className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                            <Badge variant="info" size="xs">{DOC_LABELS[doc.documentType] || doc.documentType}</Badge>
                            {doc.createdAt && new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-blue-500">
                            <Download className="w-4 h-4" />
                          </a>
                        )}
                        <button onClick={() => handleDelete(doc.id)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-red-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setShowUpload(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">Ajouter un document</h3>
              <button onClick={() => setShowUpload(false)} className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-4 h-4 text-gray-500" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Type de document</label>
                <select value={uploadForm.documentType} onChange={e => setUploadForm(f => ({ ...f, documentType: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100">
                  {DOC_TYPES.map(t => <option key={t} value={t}>{DOC_LABELS[t]}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">URL du fichier *</label>
                <input type="url" value={uploadForm.fileUrl} onChange={e => setUploadForm(f => ({ ...f, fileUrl: e.target.value }))} required
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" placeholder="https://..." />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">Description</label>
                <input type="text" value={uploadForm.description} onChange={e => setUploadForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full p-2.5 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-transparent dark:text-gray-100" placeholder="Contrat de travail..." />
              </div>
              <div className="flex gap-2 pt-2">
                <button onClick={() => setShowUpload(false)} className="flex-1 py-2 border border-gray-200 dark:border-gray-700 rounded-xl text-sm text-gray-600">Annuler</button>
                <button onClick={handleUpload} disabled={uploading || !uploadForm.fileUrl} className="flex-1 py-2 bg-brand text-white rounded-xl text-sm font-medium hover:bg-brand/90 disabled:opacity-50">
                  {uploading ? 'Ajout...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
