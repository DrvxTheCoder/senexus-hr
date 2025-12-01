'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  User,
  FileText,
  FolderOpen,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Briefcase,
  Building2,
  UserCircle,
  Edit,
  Plus,
  Download,
  Upload,
  Eye,
  Trash2,
  CheckCircle,
  XCircle,
  LoaderIcon,
  UserRoundSearch,
  RefreshCw,
  ArrowRightLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TextShimmer } from 'components/motion-primitives/text-shimmer';
import { EmployeeMultiStepForm } from '../components/employee-form';
import {
  ContractFormDialog,
  ContractRenewalDialog,
  ContractTerminationDialog,
  EmployeeTransferDialog
} from '../components/contract-form';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
  email: string | null;
  phone: string | null;
  photoUrl: string | null;
  status: string;
  hireDate: string;
  dateOfBirth: string | null;
  placeOfBirth: string | null;
  gender: string | null;
  maritalStatus: string | null;
  nationality: string | null;
  cni: string | null;
  address: string | null;
  jobTitle: string | null;
  netSalary: string | null;
  department: { id: string; name: string } | null;
  assignedClient: { id: string; name: string } | null;
}

interface Contract {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  position: string | null;
  salary: string | null;
  isActive: boolean;
  renewedFromId: string | null;
  client: { id: string; name: string } | null;
  clientFirm: { id: string; name: string } | null;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
  };
}

interface Document {
  id: string;
  documentType: string;
  fileName: string;
  fileUrl: string | null;
  fileSize: number | null;
  uploadedBy: string;
  createdAt: string;
  expiryDate: string | null;
  isVerified: boolean;
}

export default function EmployeeDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const employeeId = params.id as string;
  const firmSlug = params.firmSlug as string;
  const moduleSlug = params.moduleSlug as string;

  const [employee, setEmployee] = React.useState<Employee | null>(null);
  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [documents, setDocuments] = React.useState<Document[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [activeTab, setActiveTab] = React.useState('info');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = React.useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);

  // Contract dialog states
  const [isContractDialogOpen, setIsContractDialogOpen] = React.useState(false);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = React.useState(false);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] =
    React.useState(false);
  const [isTransferDialogOpen, setIsTransferDialogOpen] = React.useState(false);
  const [selectedContract, setSelectedContract] =
    React.useState<Contract | null>(null);

  React.useEffect(() => {
    if (employeeId) {
      fetchEmployeeData();
    }
  }, [employeeId]);

  const fetchEmployeeData = async () => {
    setLoading(true);
    try {
      const [empRes, contractsRes, docsRes] = await Promise.all([
        fetch(`/api/employees/${employeeId}`, { cache: 'no-store' }),
        fetch(`/api/employees/${employeeId}/contracts`, { cache: 'no-store' }),
        fetch(`/api/employees/${employeeId}/documents`, { cache: 'no-store' })
      ]);

      if (empRes.ok) {
        const empData = await empRes.json();
        setEmployee(empData);
      }

      if (contractsRes.ok) {
        const contractsData = await contractsRes.json();
        setContracts(contractsData);
      }

      if (docsRes.ok) {
        const docsData = await docsRes.json();
        setDocuments(docsData);
      }
    } catch (error) {
      console.error('Error fetching employee data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditSuccess = () => {
    fetchEmployeeData();
    setIsEditDialogOpen(false);
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      'default' | 'secondary' | 'destructive' | 'outline'
    > = {
      ACTIVE: 'default',
      INACTIVE: 'secondary',
      SUSPENDED: 'destructive',
      TERMINATED: 'outline',
      ON_LEAVE: 'secondary'
    };
    return (
      <Badge variant={variants[status] || 'default'}>
        {' '}
        <small>{status}</small>
      </Badge>
    );
  };

  const getContractTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      CDI: 'bg-green-100 text-green-800 border-green-200',
      CDD: 'bg-blue-100 text-blue-800 border-blue-200',
      INTERIM: 'bg-orange-100 text-orange-800 border-orange-200',
      STAGE: 'bg-purple-100 text-purple-800 border-purple-200',
      PRESTATION: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return <Badge className={`${colors[type] || ''} border`}>{type}</Badge>;
  };

  const getContractStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      ACTIVE: 'bg-green-100 text-green-800 border-green-200',
      EXPIRED: 'bg-red-100 text-red-800 border-red-200',
      TERMINATED: 'bg-gray-100 text-gray-800 border-gray-200',
      RENEWED: 'bg-blue-100 text-blue-800 border-blue-200'
    };
    return (
      <Badge className={`${variants[status] || variants.ACTIVE} border`}>
        <small>{status}</small>
      </Badge>
    );
  };

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case 'CV':
        return <FileText className='h-4 w-4' />;
      case 'ID_CARD':
      case 'PASSPORT':
        return <UserCircle className='h-4 w-4' />;
      case 'DIPLOMA':
      case 'CERTIFICATE':
        return <FolderOpen className='h-4 w-4' />;
      default:
        return <FileText className='h-4 w-4' />;
    }
  };

  if (loading) {
    return (
      <div className='border-muted-foreground/10 flex h-[calc(90vh-64px)] items-center justify-center rounded-lg border-2 border-dashed p-6'>
        <div className='flex h-full flex-col items-center justify-center text-center'>
          <LoaderIcon className='mx-auto mb-4 size-12 animate-spin md:size-12' />
          <h1 className='text-lg font-medium md:text-xl'>
            <TextShimmer>Chargement...</TextShimmer>
          </h1>
        </div>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className='border-muted-foreground/10 flex h-[calc(90vh-64px)] items-center justify-center rounded-lg border-2 border-dashed p-6'>
        <div className='flex flex-col items-center text-center'>
          <UserRoundSearch className='text-muted-foreground mx-auto mb-4 size-12 md:size-20' />
          <h1 className='mb-4 text-lg font-bold md:text-3xl'>
            Employé introuvable...
          </h1>
          {/* <p className='text-muted-foreground mb-6 text-sm md:text-base'>
              La fonctionnalité &quot;{matchingRoute.name}&quot; indisponible
            </p> */}
          <p className='text-muted-foreground border-muted-foreground/10 w-fit rounded border border-dashed p-2 font-mono text-xs md:text-sm'>
            <small>
              L&apos; employé que vous recherchez n&apos;existe pas ou a été
              supprimé.
            </small>
          </p>

          <a href={`/${firmSlug}/${moduleSlug}/`}>
            <Button variant='outline' className='mt-4'>
              Retour à l&apos;accueil
            </Button>
          </a>
        </div>
      </div>
    );
  }

  const initials =
    `${employee.firstName[0]}${employee.lastName[0]}`.toUpperCase();

  return (
    <div className='space-y-6'>
      <Button
        variant='outline'
        size='sm'
        onClick={() => router.back()}
        className='gap-2'
      >
        <ArrowLeft className='h-4 w-4' />
        Retour aux employés
      </Button>
      <div className='justify-items-centerw-full flex flex-row justify-center'>
        <div className='flex w-1/2 flex-col gap-4'>
          {/* Profile Header Card */}
          <Card className='w-full'>
            <CardContent className=''>
              <div className='flex flex-col items-start gap-6 md:flex-row md:items-center'>
                <Avatar className='h-24 w-24' key={employee.photoUrl}>
                  <AvatarImage
                    src={employee.photoUrl || ''}
                    alt={`${employee.firstName} ${employee.lastName}`}
                  />
                  <AvatarFallback className='text-2xl'>
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className='flex-1 space-y-2'>
                  <div className='flex flex-col gap-2 md:flex-row md:items-center'>
                    <h1 className='text-2xl font-bold'>
                      {employee.firstName} {employee.lastName}
                    </h1>
                    {getStatusBadge(employee.status)}
                  </div>
                  <p className='text-muted-foreground'>
                    {employee.jobTitle || 'Poste non défini'}
                  </p>
                  <div className='text-muted-foreground flex flex-wrap gap-4 text-sm'>
                    <div className='flex items-center gap-1'>
                      <Mail className='size-4' />
                      {employee.email || '-'}
                    </div>
                    <div className='flex items-center gap-1'>
                      <Calendar className='size-4' />
                      Embauché le{' '}
                      {employee.hireDate
                        ? format(new Date(employee.hireDate), 'dd MMMM yyyy', {
                            locale: fr
                          })
                        : '-'}
                    </div>
                  </div>
                </div>
                <Button
                  variant='default'
                  onClick={() => setIsEditDialogOpen(true)}
                >
                  <Edit className='mr-2 h-4 w-4' />
                  Modifier
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className='w-full'
          >
            <TabsList className='grid w-full grid-cols-3'>
              <TabsTrigger value='info' className='flex items-center gap-2'>
                <User className='h-4 w-4' />
                Informations
              </TabsTrigger>
              <TabsTrigger
                value='contracts'
                className='flex items-center gap-2'
              >
                <FileText className='h-4 w-4' />
                Contrats
              </TabsTrigger>
              <TabsTrigger
                value='documents'
                className='flex items-center gap-2'
              >
                <FolderOpen className='h-4 w-4' />
                Documents
              </TabsTrigger>
            </TabsList>

            {/* Info Tab */}
            <TabsContent value='info' className='space-y-6'>
              <Card>
                <CardHeader>
                  <CardTitle>Informations personnelles</CardTitle>
                  <CardDescription>
                    Détails personnels et informations d&apos;identité
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        Date de naissance
                      </Label>
                      <p className='font-medium'>
                        {employee.dateOfBirth
                          ? format(
                              new Date(employee.dateOfBirth),
                              'dd MMMM yyyy',
                              { locale: fr }
                            )
                          : '-'}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        Lieu de naissance
                      </Label>
                      <p className='font-medium'>
                        {employee.placeOfBirth || '-'}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        Genre
                      </Label>
                      <p className='font-medium'>
                        {employee.gender === 'MALE'
                          ? 'Homme'
                          : employee.gender === 'FEMALE'
                            ? 'Femme'
                            : employee.gender === 'OTHER'
                              ? 'Autre'
                              : '-'}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        État civil
                      </Label>
                      <p className='font-medium'>
                        {employee.maritalStatus || '-'}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        Nationalité
                      </Label>
                      <p className='font-medium'>
                        {employee.nationality || '-'}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        CNI
                      </Label>
                      <p className='font-medium'>{employee.cni || '-'}</p>
                    </div>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-muted-foreground text-sm'>
                      Adresse
                    </Label>
                    <p className='font-medium'>{employee.address || '-'}</p>
                  </div>
                  <div className='space-y-2'>
                    <Label className='text-muted-foreground text-sm'>
                      Matricule
                    </Label>
                    <p className='font-medium'>{employee.matricule}</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Informations professionnelles</CardTitle>
                  <CardDescription>
                    Détails sur le poste et la rémunération
                  </CardDescription>
                </CardHeader>
                <CardContent className='space-y-6'>
                  <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        Titre du poste
                      </Label>
                      <p className='font-medium'>{employee.jobTitle || '-'}</p>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        Salaire net
                      </Label>
                      <p className='font-medium'>
                        {employee.netSalary
                          ? `${parseFloat(employee.netSalary).toLocaleString('fr-FR')} FCFA`
                          : '-'}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        Département
                      </Label>
                      <p className='font-medium'>
                        {employee.department?.name || '-'}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        Date d&apos;embauche
                      </Label>
                      <p className='font-medium'>
                        {employee.hireDate
                          ? format(
                              new Date(employee.hireDate),
                              'dd MMMM yyyy',
                              { locale: fr }
                            )
                          : '-'}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        Client assigné
                      </Label>
                      <p className='font-medium'>
                        {employee.assignedClient?.name || 'Non assigné'}
                      </p>
                    </div>
                    <div className='space-y-2'>
                      <Label className='text-muted-foreground text-sm'>
                        Statut
                      </Label>
                      <div>{getStatusBadge(employee.status)}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Contracts Tab */}
            <TabsContent value='contracts' className='space-y-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-semibold'>Contrats</h3>
                  <p className='text-muted-foreground text-sm'>
                    Liste des contrats de l'employé
                  </p>
                </div>
                <div className='flex gap-2'>
                  <Button
                    variant='outline'
                    onClick={() => setIsTransferDialogOpen(true)}
                  >
                    <ArrowRightLeft className='mr-2 h-4 w-4' />
                    Transférer
                  </Button>
                  <Button onClick={() => setIsContractDialogOpen(true)}>
                    <Plus className='mr-2 h-4 w-4' />
                    Nouveau contrat
                  </Button>
                </div>
              </div>

              {contracts.length === 0 ? (
                <Card>
                  <CardContent className='text-muted-foreground py-12 text-center'>
                    <FileText className='text-muted-foreground/50 mx-auto mb-4 h-12 w-12' />
                    <p>Aucun contrat enregistré</p>
                  </CardContent>
                </Card>
              ) : (
                <div className='grid gap-4 md:grid-cols-2'>
                  {contracts.map((contract) => (
                    <Card key={contract.id} className='overflow-hidden'>
                      <CardHeader className='bg-muted/50 pb-3'>
                        <div className='flex items-start justify-between'>
                          <div className='space-y-1'>
                            <div className='flex items-center gap-2'>
                              {getContractTypeBadge(contract.type)}
                              {getContractStatusBadge(contract.status)}
                            </div>
                            <CardTitle className='text-base'>
                              {contract.position || 'Position non spécifiée'}
                            </CardTitle>
                            <CardDescription>
                              {contract.client?.name ||
                                contract.clientFirm?.name ||
                                'Client non assigné'}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='pt-4'>
                        <div className='space-y-3'>
                          <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground flex items-center gap-1'>
                              <Calendar className='h-3.5 w-3.5' />
                              Début
                            </span>
                            <span className='font-medium'>
                              {contract.startDate
                                ? format(
                                    new Date(contract.startDate),
                                    'dd MMM yyyy',
                                    {
                                      locale: fr
                                    }
                                  )
                                : '-'}
                            </span>
                          </div>
                          <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground flex items-center gap-1'>
                              <Calendar className='h-3.5 w-3.5' />
                              Fin
                            </span>
                            <span className='font-medium'>
                              {contract.endDate
                                ? format(
                                    new Date(contract.endDate),
                                    'dd MMM yyyy',
                                    {
                                      locale: fr
                                    }
                                  )
                                : 'Indéterminé'}
                            </span>
                          </div>
                          <div className='flex items-center justify-between text-sm'>
                            <span className='text-muted-foreground flex items-center gap-1'>
                              <Briefcase className='h-3.5 w-3.5' />
                              Salaire
                            </span>
                            <span className='font-medium'>
                              {contract.salary
                                ? `${parseFloat(contract.salary).toLocaleString('fr-FR')} FCFA`
                                : 'Non spécifié'}
                            </span>
                          </div>
                        </div>

                        <div className='mt-4 flex items-center gap-2 border-t pt-4'>
                          <Button
                            variant='outline'
                            size='sm'
                            className='flex-1'
                            onClick={() => {
                              router.push(
                                `/${firmSlug}/${moduleSlug}/contracts`
                              );
                            }}
                          >
                            <Eye className='mr-1 h-3.5 w-3.5' />
                            Voir
                          </Button>
                          <Button
                            variant='outline'
                            size='sm'
                            onClick={() => {
                              setSelectedContract(contract);
                              setIsContractDialogOpen(true);
                            }}
                          >
                            <Edit className='h-3.5 w-3.5' />
                          </Button>
                          {contract.status === 'ACTIVE' && (
                            <>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setIsRenewDialogOpen(true);
                                }}
                              >
                                <RefreshCw className='h-3.5 w-3.5' />
                              </Button>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setIsTerminateDialogOpen(true);
                                }}
                              >
                                <XCircle className='text-destructive h-3.5 w-3.5' />
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value='documents' className='space-y-4'>
              <Card>
                <CardHeader className='flex flex-row items-center justify-between'>
                  <div>
                    <CardTitle>Documents & Archives</CardTitle>
                    <CardDescription>
                      CV, diplômes, passeport, CNI, fiches de paie, etc.
                    </CardDescription>
                  </div>
                  <Dialog
                    open={isUploadDialogOpen}
                    onOpenChange={setIsUploadDialogOpen}
                  >
                    <DialogTrigger asChild>
                      <Button>
                        <Upload className='mr-2 h-4 w-4' />
                        Télécharger un document
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Télécharger un document</DialogTitle>
                        <DialogDescription>
                          Ajoutez un nouveau document pour cet employé
                        </DialogDescription>
                      </DialogHeader>
                      <div className='space-y-4'>
                        <div>
                          <Label htmlFor='doc-type'>Type de document</Label>
                          <Select>
                            <SelectTrigger id='doc-type'>
                              <SelectValue placeholder='Sélectionner le type' />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value='CV'>CV</SelectItem>
                              <SelectItem value='ID_CARD'>
                                Carte d&apos;identité
                              </SelectItem>
                              <SelectItem value='PASSPORT'>
                                Passeport
                              </SelectItem>
                              <SelectItem value='DIPLOMA'>Diplôme</SelectItem>
                              <SelectItem value='CERTIFICATE'>
                                Certificat
                              </SelectItem>
                              <SelectItem value='PAYSLIP'>
                                Fiche de paie
                              </SelectItem>
                              <SelectItem value='CONTRACT'>Contrat</SelectItem>
                              <SelectItem value='OTHER'>Autre</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label htmlFor='file'>Fichier</Label>
                          <Input id='file' type='file' />
                        </div>
                        <div>
                          <Label htmlFor='description'>
                            Description (optionnel)
                          </Label>
                          <Textarea
                            id='description'
                            placeholder='Ajouter une description...'
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant='outline'
                          onClick={() => setIsUploadDialogOpen(false)}
                        >
                          Annuler
                        </Button>
                        <Button>Télécharger</Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardHeader>
                <CardContent>
                  {documents.length === 0 ? (
                    <div className='text-muted-foreground py-8 text-center'>
                      Aucun document téléchargé
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Type</TableHead>
                          <TableHead>Nom du fichier</TableHead>
                          <TableHead>Taille</TableHead>
                          <TableHead>Date d&apos;ajout</TableHead>
                          <TableHead>Expiration</TableHead>
                          <TableHead>Vérifié</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {documents.map((doc) => (
                          <TableRow key={doc.id}>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                {getDocumentIcon(doc.documentType)}
                                <span>
                                  {doc.documentType.replace(/_/g, ' ')}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{doc.fileName}</TableCell>
                            <TableCell>
                              {doc.fileSize
                                ? `${(doc.fileSize / 1024).toFixed(1)} KB`
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {doc.createdAt
                                ? format(new Date(doc.createdAt), 'dd/MM/yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {doc.expiryDate
                                ? format(new Date(doc.expiryDate), 'dd/MM/yyyy')
                                : '-'}
                            </TableCell>
                            <TableCell>
                              {doc.isVerified ? (
                                <CheckCircle className='h-4 w-4 text-green-600' />
                              ) : (
                                <XCircle className='h-4 w-4 text-gray-400' />
                              )}
                            </TableCell>
                            <TableCell>
                              <div className='flex items-center gap-2'>
                                <Button variant='ghost' size='icon'>
                                  <Download className='h-4 w-4' />
                                </Button>
                                <Button variant='ghost' size='icon'>
                                  <Eye className='h-4 w-4' />
                                </Button>
                                <Button variant='ghost' size='icon'>
                                  <Trash2 className='text-destructive h-4 w-4' />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
      {/* Back Button */}

      {/* Edit Employee Dialog */}
      <EmployeeMultiStepForm
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        employee={employee}
        onSuccess={handleEditSuccess}
      />

      {/* Contract Dialogs */}
      <ContractFormDialog
        open={isContractDialogOpen}
        onOpenChange={(open) => {
          setIsContractDialogOpen(open);
          if (!open) setSelectedContract(null);
        }}
        contract={selectedContract}
        employeeId={employeeId}
        onSuccess={() => {
          fetchEmployeeData();
          setSelectedContract(null);
        }}
      />

      <ContractRenewalDialog
        open={isRenewDialogOpen}
        onOpenChange={(open) => {
          setIsRenewDialogOpen(open);
          if (!open) setSelectedContract(null);
        }}
        contract={selectedContract}
        onSuccess={() => {
          fetchEmployeeData();
          setSelectedContract(null);
        }}
      />

      <ContractTerminationDialog
        open={isTerminateDialogOpen}
        onOpenChange={(open) => {
          setIsTerminateDialogOpen(open);
          if (!open) setSelectedContract(null);
        }}
        contract={selectedContract}
        onSuccess={() => {
          fetchEmployeeData();
          setSelectedContract(null);
        }}
      />

      <EmployeeTransferDialog
        open={isTransferDialogOpen}
        onOpenChange={setIsTransferDialogOpen}
        employee={
          employee
            ? {
                id: employee.id,
                firstName: employee.firstName,
                lastName: employee.lastName,
                matricule: employee.matricule
              }
            : null
        }
        onSuccess={() => {
          fetchEmployeeData();
        }}
      />
    </div>
  );
}
