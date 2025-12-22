'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import {
  FileText,
  Upload,
  Search,
  MoreVertical,
  Trash2,
  CheckCircle2,
  Clock,
  HardDrive,
  File,
  Folder,
  FolderOpen,
  Eye,
  ChevronRight,
  Home
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { DocumentUploadDialog } from '../components/document-form/DocumentUploadDialog';
import { DocumentPreviewModal } from '../components/documents/DocumentPreviewModal';

interface Document {
  id: string;
  employeeId: string;
  documentType: string;
  fileName: string;
  fileUrl: string;
  storageKey: string;
  fileSize: number;
  mimeType: string;
  description: string | null;
  tags: string[];
  expiryDate: string | null;
  isVerified: boolean;
  createdAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
  };
  uploader: {
    id: string;
    name: string;
  };
  verifier?: {
    id: string;
    name: string;
  } | null;
}

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
}

const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  CV: 'CV',
  ID_CARD: "Carte d'identité",
  PASSPORT: 'Passeport',
  CONTRACT: 'Contrat',
  PAYSLIP: 'Fiche de paie',
  CERTIFICATE: 'Certificat',
  DIPLOMA: 'Diplôme',
  MEDICAL_CERTIFICATE: 'Certificat médical',
  LEGAL_DOCUMENT: 'Document légal',
  MISSION_REPORT: 'Rapport de mission',
  EXPENSE_RECEIPT: 'Reçu de dépense',
  OTHER: 'Autre'
};

export default function DocumentsPage() {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [firmId, setFirmId] = React.useState<string>('');
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDocumentsLoading, setIsDocumentsLoading] = React.useState(false);
  const [showUploadDialog, setShowUploadDialog] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [debouncedSearchQuery, setDebouncedSearchQuery] = React.useState('');
  const [selectedEmployee, setSelectedEmployee] = React.useState<string>('ALL');
  const [selectedType, setSelectedType] = React.useState<string>('ALL');
  const [verifiedFilter, setVerifiedFilter] = React.useState<string>('ALL');
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [documentToDelete, setDocumentToDelete] =
    React.useState<Document | null>(null);
  const [previewDocument, setPreviewDocument] = React.useState<Document | null>(
    null
  );
  const [showPreview, setShowPreview] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'list' | 'grid'>('list');
  const [currentFolder, setCurrentFolder] = React.useState<string>('');
  const [folders, setFolders] = React.useState<string[]>([]);

  // Debounce search query
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300); // Wait 300ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  React.useEffect(() => {
    if (firmSlug) {
      fetchFirmId();
    }
  }, [firmSlug]);

  React.useEffect(() => {
    if (firmId) {
      fetchData();
    }
  }, [
    firmId,
    selectedEmployee,
    selectedType,
    verifiedFilter,
    debouncedSearchQuery
  ]);

  const fetchFirmId = async () => {
    try {
      const res = await fetch(`/api/firms/by-slug/${firmSlug}`);
      if (res.ok) {
        const data = await res.json();
        setFirmId(data.id);
      }
    } catch (error) {
      console.error('Error fetching firm:', error);
    }
  };

  const fetchData = async () => {
    setIsDocumentsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      if (selectedEmployee !== 'ALL')
        params.append('employeeId', selectedEmployee);
      if (selectedType !== 'ALL') params.append('documentType', selectedType);
      if (verifiedFilter !== 'ALL') params.append('isVerified', verifiedFilter);
      if (debouncedSearchQuery) params.append('search', debouncedSearchQuery);

      const [docsRes, empsRes] = await Promise.all([
        fetch(`/api/firms/${firmId}/documents?${params.toString()}`),
        fetch(`/api/employees?firmId=${firmId}`)
      ]);

      if (docsRes.ok) {
        const data = await docsRes.json();
        setDocuments(data.documents || []);
      }

      if (empsRes.ok) {
        const data = await empsRes.json();
        setEmployees(data.employees || data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Échec du chargement des données');
    } finally {
      setIsDocumentsLoading(false);
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!documentToDelete) return;

    try {
      const res = await fetch(
        `/api/firms/${firmId}/documents/${documentToDelete.id}`,
        {
          method: 'DELETE'
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Échec de la suppression');
      }

      toast.success('Document supprimé avec succès');
      fetchData();
      setDeleteDialogOpen(false);
      setDocumentToDelete(null);
    } catch (err: any) {
      toast.error(err.message || 'Échec de la suppression');
    }
  };

  const handleVerify = async (documentId: string) => {
    try {
      const res = await fetch(`/api/firms/${firmId}/documents/${documentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isVerified: true })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Échec de la vérification');
      }

      toast.success('Document vérifié avec succès');
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Échec de la vérification');
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType?.includes('pdf')) return '📄';
    if (mimeType?.includes('image')) return '🖼️';
    if (mimeType?.includes('word') || mimeType?.includes('document'))
      return '📝';
    return '📎';
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  const stats = React.useMemo(() => {
    const totalDocs = documents.length;
    const verifiedDocs = documents.filter((d) => d.isVerified).length;
    const totalSize = documents.reduce((sum, d) => sum + (d.fileSize || 0), 0);
    const uniqueEmployees = new Set(documents.map((d) => d.employeeId)).size;

    return {
      totalDocs,
      verifiedDocs,
      totalSize: formatFileSize(totalSize),
      uniqueEmployees
    };
  }, [documents]);

  if (isLoading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='text-muted-foreground'>Chargement...</div>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Documents</h1>
          <p className='text-muted-foreground mt-1'>
            Gérer les documents des employés
          </p>
        </div>
        <Button onClick={() => setShowUploadDialog(true)}>
          <Upload className='mr-2 h-4 w-4' />
          Télécharger
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Documents
            </CardTitle>
            <FileText className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalDocs}</div>
            <p className='text-muted-foreground text-xs'>Tous les documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Vérifiés</CardTitle>
            <CheckCircle2 className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.verifiedDocs}</div>
            <p className='text-muted-foreground text-xs'>Documents vérifiés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Employés</CardTitle>
            <File className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.uniqueEmployees}</div>
            <p className='text-muted-foreground text-xs'>Avec documents</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Stockage Total
            </CardTitle>
            <HardDrive className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalSize}</div>
            <p className='text-muted-foreground text-xs'>Espace utilisé</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='grid gap-4 md:grid-cols-4'>
            {/* Search */}
            <div className='relative'>
              <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
              <Input
                placeholder='Rechercher...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-8'
              />
            </div>

            {/* Employee Filter */}
            <Select
              value={selectedEmployee}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger>
                <SelectValue placeholder='Tous les employés' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>Tous les employés</SelectItem>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.firstName} {emp.lastName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Type Filter */}
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder='Tous les types' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>Tous les types</SelectItem>
                {Object.entries(DOCUMENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Verified Filter */}
            <Select value={verifiedFilter} onValueChange={setVerifiedFilter}>
              <SelectTrigger>
                <SelectValue placeholder='Statut de vérification' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>Tous les statuts</SelectItem>
                <SelectItem value='true'>Vérifiés</SelectItem>
                <SelectItem value='false'>Non vérifiés</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Documents Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des documents</CardTitle>
          <CardDescription>
            {documents.length} document(s) trouvé(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isDocumentsLoading ? (
            <div className='flex min-h-[200px] items-center justify-center'>
              <div className='text-muted-foreground'>
                Chargement des documents...
              </div>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fichier</TableHead>
                  <TableHead>Employé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Taille</TableHead>
                  <TableHead>Tags</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={8}
                      className='text-muted-foreground text-center'
                    >
                      Aucun document trouvé
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <span className='text-xl'>
                            {getFileIcon(doc.mimeType)}
                          </span>
                          <div>
                            <div className='font-medium'>{doc.fileName}</div>
                            {doc.description && (
                              <div className='text-muted-foreground text-xs'>
                                {doc.description}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className='font-medium'>
                            {doc.employee.firstName} {doc.employee.lastName}
                          </div>
                          <div className='text-muted-foreground text-xs'>
                            {doc.employee.matricule}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant='outline'>
                          {DOCUMENT_TYPE_LABELS[doc.documentType]}
                        </Badge>
                      </TableCell>
                      <TableCell className='text-sm'>
                        {formatFileSize(doc.fileSize)}
                      </TableCell>
                      <TableCell>
                        {doc.tags.length > 0 ? (
                          <div className='flex flex-wrap gap-1'>
                            {doc.tags.slice(0, 2).map((tag, idx) => (
                              <Badge
                                key={idx}
                                variant='secondary'
                                className='text-xs'
                              >
                                {tag}
                              </Badge>
                            ))}
                            {doc.tags.length > 2 && (
                              <Badge variant='secondary' className='text-xs'>
                                +{doc.tags.length - 2}
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <span className='text-muted-foreground text-xs'>
                            -
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {doc.isVerified ? (
                          <Badge variant='default' className='gap-1'>
                            <CheckCircle2 className='h-3 w-3' />
                            Vérifié
                          </Badge>
                        ) : (
                          <Badge variant='outline' className='gap-1'>
                            <Clock className='h-3 w-3' />
                            Non vérifié
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className='text-sm'>
                        {format(new Date(doc.createdAt), 'dd MMM yyyy', {
                          locale: fr
                        })}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant='ghost' size='sm'>
                              <MoreVertical className='h-4 w-4' />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='end'>
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setPreviewDocument(doc);
                                setShowPreview(true);
                              }}
                            >
                              <Eye className='mr-2 h-4 w-4' />
                              Aperçu
                            </DropdownMenuItem>
                            {!doc.isVerified && (
                              <DropdownMenuItem
                                onClick={() => handleVerify(doc.id)}
                              >
                                <CheckCircle2 className='mr-2 h-4 w-4' />
                                Vérifier
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => {
                                setDocumentToDelete(doc);
                                setDeleteDialogOpen(true);
                              }}
                              className='text-destructive'
                            >
                              <Trash2 className='mr-2 h-4 w-4' />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Upload Dialog */}
      <DocumentUploadDialog
        open={showUploadDialog}
        onOpenChange={setShowUploadDialog}
        firmId={firmId}
        employees={employees}
        onSuccess={fetchData}
      />

      {/* Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer le document</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce document ? Cette action est
              irréversible.
            </AlertDialogDescription>
            {documentToDelete && (
              <div className='mt-2 text-sm'>
                <strong>{documentToDelete.fileName}</strong>
              </div>
            )}
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Preview Modal */}
      {previewDocument && (
        <DocumentPreviewModal
          isOpen={showPreview}
          onClose={() => {
            setShowPreview(false);
            setPreviewDocument(null);
          }}
          fileUrl={previewDocument.fileUrl}
          fileName={previewDocument.fileName}
          mimeType={previewDocument.mimeType}
        />
      )}
    </div>
  );
}
