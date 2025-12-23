'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  CalendarIcon,
  Upload,
  X,
  FileIcon,
  FolderPlus,
  Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DocumentPreviewModal } from '../documents/DocumentPreviewModal';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
}

interface DocumentUploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  firmId: string;
  employees: Employee[];
  preSelectedEmployeeId?: string;
  onSuccess: () => void;
}

const DOCUMENT_TYPES = [
  { value: 'CV', label: 'CV' },
  { value: 'ID_CARD', label: "Carte d'identité" },
  { value: 'PASSPORT', label: 'Passeport' },
  { value: 'CONTRACT', label: 'Contrat' },
  { value: 'PAYSLIP', label: 'Fiche de paie' },
  { value: 'CERTIFICATE', label: 'Certificat' },
  { value: 'DIPLOMA', label: 'Diplôme' },
  { value: 'MEDICAL_CERTIFICATE', label: 'Certificat médical' },
  { value: 'LEGAL_DOCUMENT', label: 'Document légal' },
  { value: 'MISSION_REPORT', label: 'Rapport de mission' },
  { value: 'EXPENSE_RECEIPT', label: 'Reçu de dépense' },
  { value: 'OTHER', label: 'Autre' }
];

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/jpg',
  'image/png'
];

export function DocumentUploadDialog({
  open,
  onOpenChange,
  firmId,
  employees,
  preSelectedEmployeeId,
  onSuccess
}: DocumentUploadDialogProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
  const [showPreview, setShowPreview] = React.useState(false);
  const [folders, setFolders] = React.useState<string[]>([]);
  const [isCreatingFolder, setIsCreatingFolder] = React.useState(false);
  const [newFolderName, setNewFolderName] = React.useState('');
  const [formData, setFormData] = React.useState({
    employeeId: preSelectedEmployeeId || '',
    documentType: '',
    description: '',
    tags: '',
    expiryDate: null as Date | null,
    subfolder: ''
  });

  // Reset form when dialog opens/closes
  React.useEffect(() => {
    if (open) {
      setFormData({
        employeeId: preSelectedEmployeeId || '',
        documentType: '',
        description: '',
        tags: '',
        expiryDate: null,
        subfolder: ''
      });
      setSelectedFile(null);
      setPreviewUrl(null);
      setNewFolderName('');
      setIsCreatingFolder(false);
    }
  }, [open, preSelectedEmployeeId]);

  // Fetch folders when employee is selected
  React.useEffect(() => {
    if (formData.employeeId && open) {
      fetchFolders(formData.employeeId);
    }
  }, [formData.employeeId, open]);

  // Cleanup preview URL on unmount
  React.useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const fetchFolders = async (employeeId: string) => {
    try {
      const res = await fetch(
        `/api/firms/${firmId}/documents/folders?employeeId=${employeeId}`
      );
      if (res.ok) {
        const data = await res.json();
        setFolders(data.folders || []);
      }
    } catch (err) {
      console.error('Failed to fetch folders:', err);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) {
      toast.error('Le nom du dossier ne peut pas être vide');
      return;
    }

    if (!formData.employeeId) {
      toast.error("Veuillez d'abord sélectionner un employé");
      return;
    }

    try {
      const res = await fetch(`/api/firms/${firmId}/documents/folders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: formData.employeeId,
          folderName: newFolderName
        })
      });

      if (!res.ok) {
        throw new Error('Failed to create folder');
      }

      const data = await res.json();
      setFolders([...folders, data.folderName]);
      setFormData({ ...formData, subfolder: data.folderName });
      setNewFolderName('');
      setIsCreatingFolder(false);
      toast.success('Dossier créé avec succès');
    } catch (err) {
      toast.error('Échec de la création du dossier');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      toast.error(
        'Type de fichier non autorisé. Seuls les PDF et images (JPEG, PNG) sont acceptés.'
      );
      e.target.value = '';
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error(
        `Le fichier dépasse la limite de 2MB. Taille: ${(file.size / 1024 / 1024).toFixed(2)}MB`
      );
      e.target.value = '';
      return;
    }

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setSelectedFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile) {
      toast.error('Veuillez sélectionner un fichier');
      return;
    }

    if (!formData.employeeId || !formData.documentType) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setIsSubmitting(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', selectedFile);
      uploadFormData.append('employeeId', formData.employeeId);
      uploadFormData.append('documentType', formData.documentType);
      if (formData.description) {
        uploadFormData.append('description', formData.description);
      }
      if (formData.tags) {
        uploadFormData.append('tags', formData.tags);
      }
      if (formData.expiryDate) {
        uploadFormData.append('expiryDate', formData.expiryDate.toISOString());
      }
      if (formData.subfolder) {
        uploadFormData.append('subfolder', formData.subfolder);
      }

      const res = await fetch(`/api/firms/${firmId}/documents`, {
        method: 'POST',
        body: uploadFormData
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Échec du téléchargement');
      }

      toast.success('Document téléchargé avec succès');
      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err.message || 'Échec du téléchargement du document');
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeFile = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setSelectedFile(null);
    setPreviewUrl(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Télécharger un document</DialogTitle>
          <DialogDescription>
            Téléchargez un document pour un employé (max 2MB)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* Employee Selection */}
          {!preSelectedEmployeeId && (
            <div className='space-y-2'>
              <Label htmlFor='employeeId'>
                Employé <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={formData.employeeId}
                onValueChange={(value) =>
                  setFormData({ ...formData, employeeId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Sélectionner un employé' />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((emp) => (
                    <SelectItem key={emp.id} value={emp.id}>
                      {emp.firstName} {emp.lastName} - {emp.matricule}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Document Type */}
          <div className='space-y-2'>
            <Label htmlFor='documentType'>
              Type de document <span className='text-destructive'>*</span>
            </Label>
            <Select
              value={formData.documentType}
              onValueChange={(value) =>
                setFormData({ ...formData, documentType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder='Sélectionner un type' />
              </SelectTrigger>
              <SelectContent>
                {DOCUMENT_TYPES.map((type) => (
                  <SelectItem key={type.value} value={type.value}>
                    {type.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Folder Selection */}
          {formData.employeeId && (
            <div className='space-y-2'>
              <Label htmlFor='subfolder'>Dossier (optionnel)</Label>
              {!isCreatingFolder ? (
                <div className='flex gap-2'>
                  <Select
                    value={formData.subfolder || 'ROOT'}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        subfolder: value === 'ROOT' ? '' : value
                      })
                    }
                  >
                    <SelectTrigger className='flex-1'>
                      <SelectValue placeholder='Racine (aucun dossier)' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ROOT'>
                        Racine (aucun dossier)
                      </SelectItem>
                      {folders.map((folder) => (
                        <SelectItem key={folder} value={folder}>
                          {folder}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setIsCreatingFolder(true)}
                  >
                    <FolderPlus className='h-4 w-4' />
                  </Button>
                </div>
              ) : (
                <div className='flex gap-2'>
                  <Input
                    placeholder='Nom du nouveau dossier'
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                  />
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={handleCreateFolder}
                  >
                    Créer
                  </Button>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => {
                      setIsCreatingFolder(false);
                      setNewFolderName('');
                    }}
                  >
                    <X className='h-4 w-4' />
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* File Upload */}
          <div className='space-y-2'>
            <Label htmlFor='file'>
              Fichier <span className='text-destructive'>*</span>
            </Label>
            {!selectedFile ? (
              <div className='flex items-center gap-2'>
                <Input
                  id='file'
                  type='file'
                  onChange={handleFileChange}
                  accept='application/pdf,image/jpeg,image/jpg,image/png'
                />
              </div>
            ) : (
              <div className='border-input flex items-center gap-2 rounded-md border p-3'>
                <FileIcon className='text-muted-foreground h-5 w-5' />
                <div className='flex-1'>
                  <p className='text-sm font-medium'>{selectedFile.name}</p>
                  <p className='text-muted-foreground text-xs'>
                    {(selectedFile.size / 1024).toFixed(2)} KB
                  </p>
                </div>
                {previewUrl && (
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    onClick={() => setShowPreview(true)}
                  >
                    <Eye className='mr-1 h-4 w-4' />
                    Aperçu
                  </Button>
                )}
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  onClick={removeFile}
                >
                  <X className='h-4 w-4' />
                </Button>
              </div>
            )}
            <p className='text-muted-foreground text-xs'>
              Formats acceptés: PDF, JPEG, PNG uniquement (max 2MB)
            </p>
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='description'>Description</Label>
            <Textarea
              id='description'
              placeholder='Description du document...'
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          {/* Tags */}
          <div className='space-y-2'>
            <Label htmlFor='tags'>Tags (séparés par des virgules)</Label>
            <Input
              id='tags'
              placeholder='urgent, confidentiel, original'
              value={formData.tags}
              onChange={(e) =>
                setFormData({ ...formData, tags: e.target.value })
              }
            />
          </div>

          {/* Expiry Date */}
          <div className='space-y-2'>
            <Label>Date d&apos;expiration</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant='outline'
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !formData.expiryDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className='mr-2 h-4 w-4' />
                  {formData.expiryDate ? (
                    format(formData.expiryDate, 'PPP', { locale: fr })
                  ) : (
                    <span>Sélectionner une date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className='w-auto p-0' align='start'>
                <Calendar
                  mode='single'
                  selected={formData.expiryDate || undefined}
                  onSelect={(date) =>
                    setFormData({ ...formData, expiryDate: date || null })
                  }
                  initialFocus
                  locale={fr}
                />
              </PopoverContent>
            </Popover>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type='submit' disabled={isSubmitting}>
              {isSubmitting ? (
                'Téléchargement...'
              ) : (
                <>
                  <Upload className='mr-2 h-4 w-4' />
                  Télécharger
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      {/* Preview Modal */}
      {previewUrl && selectedFile && (
        <DocumentPreviewModal
          isOpen={showPreview}
          onClose={() => setShowPreview(false)}
          fileUrl={previewUrl}
          fileName={selectedFile.name}
          mimeType={selectedFile.type}
        />
      )}
    </Dialog>
  );
}
