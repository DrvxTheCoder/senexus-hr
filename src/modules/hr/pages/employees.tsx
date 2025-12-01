'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Plus,
  Search,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Upload,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Eye
} from 'lucide-react';
import {
  getEmployees,
  createEmployee,
  updateEmployee,
  deleteEmployee
} from '../actions/employee-actions';
import { getClients } from '@/modules/crm/actions/client-actions';
import { ProfilePhotoUpload } from '@/components/profile-photo-upload';
import { formatDateFR, formatDuration } from '../utils/date-utils';
import { toast } from 'sonner';
import { EmployeeBulkImport } from '../components/employee-bulk-import';
import { EmployeeMultiStepForm } from '../components/employee-form';

type Employee = any;
type Client = any;

export default function EmployeesPage() {
  const params = useParams();
  const router = useRouter();
  const firmSlug = params.firmSlug as string;
  const moduleSlug = params.moduleSlug as string;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [firmId, setFirmId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState<Employee | null>(
    null
  );
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    matricule: '',
    photoUrl: '',
    email: '',
    phone: '',
    address: '',
    hireDate: '',
    dateOfBirth: '',
    placeOfBirth: '',
    maritalStatus: '',
    nationality: '',
    cni: '',
    jobTitle: '',
    category: '',
    contractEndDate: '',
    departmentId: '',
    assignedClientId: '',
    status: 'ACTIVE' as any,
    emergencyContact: {
      name: '',
      phone: '',
      relationship: ''
    }
  });

  // Fetch firmId from slug
  useEffect(() => {
    async function getFirmId() {
      try {
        const response = await fetch(`/api/firms/by-slug/${firmSlug}`);
        if (response.ok) {
          const firm = await response.json();
          setFirmId(firm.id);
        } else {
          toast.error("Impossible de charger l'organisation");
        }
      } catch (error) {
        toast.error("Erreur lors du chargement de l'organisation");
      }
    }
    if (firmSlug) {
      getFirmId();
    }
  }, [firmSlug]);

  useEffect(() => {
    if (firmId) {
      fetchEmployees();
      fetchClients();
    }
  }, [firmId, statusFilter]);

  async function fetchEmployees() {
    if (!firmId) return;

    setLoading(true);
    try {
      const result = await getEmployees(firmId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery
      });

      if (result.success) {
        setEmployees(result.data || []);
      } else {
        toast.error(result.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  async function fetchClients() {
    if (!firmId) return;

    try {
      const result = await getClients(firmId, {});
      if (result.success) {
        setClients(result.data || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  }

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      searchQuery === '' ||
      `${emp.firstName} ${emp.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      emp.matricule.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesClient =
      clientFilter === 'all' || emp.assignedClientId === clientFilter;

    return matchesSearch && matchesClient;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredEmployees.length / pageSize);
  const startIndex = currentPage * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEmployees = filteredEmployees.slice(startIndex, endIndex);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(0);
  }, [searchQuery, clientFilter, statusFilter]);

  const stats = {
    total: employees.length,
    active: employees.filter((e) => e.status === 'ACTIVE').length,
    onLeave: employees.filter((e) => e.status === 'ON_LEAVE').length,
    inactive: employees.filter((e) =>
      ['INACTIVE', 'TERMINATED'].includes(e.status)
    ).length
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any; icon: any }> = {
      ACTIVE: { label: 'Actif', variant: 'default', icon: CheckCircle2 },
      INACTIVE: { label: 'Inactif', variant: 'secondary', icon: XCircle },
      ON_LEAVE: { label: 'En congé', variant: 'outline', icon: AlertTriangle },
      SUSPENDED: { label: 'Suspendu', variant: 'destructive', icon: XCircle },
      TERMINATED: { label: 'Terminé', variant: 'destructive', icon: XCircle }
    };

    const { label, variant, icon: Icon } = config[status] || config.ACTIVE;

    return (
      <Badge variant={variant} className='flex items-center gap-1'>
        <Icon className='h-3 w-3' />
        {label}
      </Badge>
    );
  };

  const handleAddEmployee = () => {
    setSelectedEmployee(null);
    setFormData({
      firstName: '',
      lastName: '',
      matricule: '',
      photoUrl: '',
      email: '',
      phone: '',
      address: '',
      hireDate: '',
      dateOfBirth: '',
      placeOfBirth: '',
      maritalStatus: '',
      nationality: '',
      cni: '',
      jobTitle: '',
      category: '',
      contractEndDate: '',
      departmentId: '',
      assignedClientId: '',
      status: 'ACTIVE',
      emergencyContact: {
        name: '',
        phone: '',
        relationship: ''
      }
    });
    setIsDialogOpen(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setSelectedEmployee(employee);

    // Helper function to safely format dates
    const formatDate = (dateValue: any) => {
      if (!dateValue) return '';
      if (typeof dateValue === 'string') {
        return dateValue.split('T')[0];
      }
      if (dateValue instanceof Date) {
        return dateValue.toISOString().split('T')[0];
      }
      return '';
    };

    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      matricule: employee.matricule,
      photoUrl: employee.photoUrl || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      hireDate: formatDate(employee.hireDate),
      dateOfBirth: formatDate(employee.dateOfBirth),
      placeOfBirth: employee.placeOfBirth || '',
      maritalStatus: employee.maritalStatus || '',
      nationality: employee.nationality || '',
      cni: employee.cni || '',
      jobTitle: employee.jobTitle || '',
      category: employee.category || '',
      contractEndDate: formatDate(employee.contractEndDate),
      departmentId: employee.departmentId || '',
      assignedClientId: employee.assignedClientId || '',
      status: employee.status,
      emergencyContact: employee.emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      }
    });
    setIsDialogOpen(true);
  };

  const handleDeleteEmployee = (employee: Employee) => {
    setEmployeeToDelete(employee);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!employeeToDelete) return;

    try {
      const result = await deleteEmployee(employeeToDelete.id);
      if (result.success) {
        toast.success('Employé supprimé avec succès');
        setIsDeleteDialogOpen(false);
        setEmployeeToDelete(null);
        fetchEmployees();
      } else {
        toast.error(result.error || 'Erreur lors de la suppression');
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    }
  };

  const handleSuccess = () => {
    toast.success(
      selectedEmployee
        ? 'Employé mis à jour avec succès'
        : 'Employé créé avec succès'
    );
    setIsDialogOpen(false);
    fetchEmployees();
  };

  const handleSubmit = async () => {
    if (!firmId) {
      toast.error('Firm ID manquant');
      return;
    }

    try {
      // Clean up the form data
      const submitData = {
        ...formData,
        departmentId: formData.departmentId || undefined,
        assignedClientId:
          formData.assignedClientId && formData.assignedClientId !== 'none'
            ? formData.assignedClientId
            : undefined,
        dateOfBirth: formData.dateOfBirth || undefined,
        placeOfBirth: formData.placeOfBirth || undefined,
        maritalStatus: formData.maritalStatus || undefined,
        nationality: formData.nationality || undefined,
        cni: formData.cni || undefined,
        jobTitle: formData.jobTitle || undefined,
        category: formData.category || undefined,
        contractEndDate: formData.contractEndDate || undefined,
        emergencyContact: formData.emergencyContact.name
          ? formData.emergencyContact
          : undefined
      };

      console.log('Submitting employee:', submitData);

      if (selectedEmployee) {
        const result = await updateEmployee(selectedEmployee.id, submitData);
        console.log('Update result:', result);
        if (result.success) {
          toast.success('Employé mis à jour avec succès');
          setIsDialogOpen(false);
          fetchEmployees();
        } else {
          toast.error(result.error || 'Erreur lors de la mise à jour');
        }
      } else {
        const result = await createEmployee(firmId, submitData);
        console.log('Create result:', result);
        if (result.success) {
          toast.success('Employé créé avec succès');
          setIsDialogOpen(false);
          fetchEmployees();
        } else {
          toast.error(result.error || 'Erreur lors de la création');
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(
        'Une erreur est survenue: ' +
          (error instanceof Error ? error.message : 'Unknown')
      );
    }
  };

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Employés</h1>
          <p className='text-muted-foreground mt-1'>
            Gérer tous les employés intérimaires
          </p>
        </div>
        <div className='flex gap-2'>
          <Button variant='outline' onClick={() => setIsBulkImportOpen(true)}>
            <Upload className='mr-2 h-4 w-4' />
            Importer CSV
          </Button>
          <Button onClick={handleAddEmployee}>
            <Plus className='mr-2 h-4 w-4' />
            Ajouter un employé
          </Button>
        </div>
      </div>

      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>En congé</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {stats.onLeave}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Inactifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-600'>
              {stats.inactive}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between'>
            <CardTitle>Liste des employés</CardTitle>
            <div className='flex items-center gap-2'>
              <div className='relative w-full md:w-[250px]'>
                <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
                <Input
                  placeholder='Rechercher...'
                  className='pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={clientFilter} onValueChange={setClientFilter}>
                <SelectTrigger className='w-[180px]'>
                  <SelectValue placeholder='Client' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tous les clients</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className='w-[150px]'>
                  <SelectValue placeholder='Statut' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='all'>Tous</SelectItem>
                  <SelectItem value='ACTIVE'>Actif</SelectItem>
                  <SelectItem value='ON_LEAVE'>En congé</SelectItem>
                  <SelectItem value='INACTIVE'>Inactif</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className='py-8 text-center'>Chargement...</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Matricule</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Département</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Embauche</TableHead>
                  <TableHead>Durée</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmployees.map((emp) => {
                  // Safely parse hire date
                  const hireDate = emp.hireDate
                    ? new Date(emp.hireDate)
                    : new Date();
                  const days = Math.floor(
                    (new Date().getTime() - hireDate.getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const remaining = Math.max(0, 730 - days);

                  // Get initials for fallback
                  const initials =
                    `${emp.firstName?.[0] || ''}${emp.lastName?.[0] || ''}`.toUpperCase();

                  return (
                    <TableRow key={emp.id}>
                      <TableCell>
                        <div className='flex items-center gap-3'>
                          <Avatar className='h-8 w-8' key={emp.photoUrl}>
                            <AvatarImage
                              src={emp.photoUrl || '/assets/img/profile.jpg'}
                              alt={`${emp.firstName} ${emp.lastName}`}
                            />
                            <AvatarFallback className='text-xs'>
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <span>
                            {emp.firstName} {emp.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className='font-mono'>
                        {emp.matricule}
                      </TableCell>
                      <TableCell>{emp.department?.name || '-'}</TableCell>
                      <TableCell>{emp.assignedClient?.name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(emp.status)}</TableCell>
                      <TableCell>
                        {emp.hireDate ? formatDateFR(emp.hireDate) : '-'}
                      </TableCell>
                      <TableCell>
                        <div className='flex items-center gap-2'>
                          <span className='text-sm'>
                            {formatDuration(days)}
                          </span>
                          {remaining === 0 && (
                            <Badge variant='destructive' className='text-xs'>
                              <AlertTriangle className='mr-1 h-3 w-3' />
                              Limite
                            </Badge>
                          )}
                          {remaining <= 90 && remaining > 0 && (
                            <Badge
                              variant='outline'
                              className='border-orange-500 text-xs text-orange-600'
                            >
                              {remaining}j
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className='flex gap-1'>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() =>
                              router.push(
                                `/${firmSlug}/${moduleSlug}/employees/${emp.id}`
                              )
                            }
                          >
                            <Eye className='mr-1 h-4 w-4' />
                            Voir
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleEditEmployee(emp)}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant='ghost'
                            size='sm'
                            onClick={() => handleDeleteEmployee(emp)}
                            className='text-red-600 hover:text-red-700'
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
          {filteredEmployees.length === 0 && !loading && (
            <div className='text-muted-foreground py-12 text-center'>
              Aucun employé trouvé
            </div>
          )}

          {/* Pagination Controls */}
          {!loading && filteredEmployees.length > 0 && (
            <div className='mt-4 flex items-center justify-between border-t px-4 pt-4'>
              <div className='text-muted-foreground hidden flex-1 text-sm lg:flex'>
                Affichage de {startIndex + 1} à{' '}
                {Math.min(endIndex, filteredEmployees.length)} sur{' '}
                {filteredEmployees.length} employé(s)
              </div>
              <div className='flex w-full items-center gap-8 lg:w-fit'>
                <div className='hidden items-center gap-2 lg:flex'>
                  <Label
                    htmlFor='rows-per-page'
                    className='text-sm font-medium'
                  >
                    Lignes par page
                  </Label>
                  <Select
                    value={`${pageSize}`}
                    onValueChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(0);
                    }}
                  >
                    <SelectTrigger
                      size='sm'
                      className='w-20'
                      id='rows-per-page'
                    >
                      <SelectValue placeholder={pageSize} />
                    </SelectTrigger>
                    <SelectContent side='top'>
                      {[10, 20, 30, 40, 50].map((size) => (
                        <SelectItem key={size} value={`${size}`}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='flex w-fit items-center justify-center text-sm font-medium'>
                  Page {currentPage + 1} sur {totalPages}
                </div>
                <div className='ml-auto flex items-center gap-2 lg:ml-0'>
                  <Button
                    variant='outline'
                    className='hidden h-8 w-8 p-0 lg:flex'
                    onClick={() => setCurrentPage(0)}
                    disabled={currentPage === 0}
                  >
                    <span className='sr-only'>Aller à la première page</span>
                    <ChevronsLeft className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-8 w-8'
                    onClick={() => setCurrentPage((p) => p - 1)}
                    disabled={currentPage === 0}
                  >
                    <span className='sr-only'>Page précédente</span>
                    <ChevronLeft className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    size='icon'
                    className='h-8 w-8'
                    onClick={() => setCurrentPage((p) => p + 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <span className='sr-only'>Page suivante</span>
                    <ChevronRight className='h-4 w-4' />
                  </Button>
                  <Button
                    variant='outline'
                    className='hidden h-8 w-8 p-0 lg:flex'
                    onClick={() => setCurrentPage(totalPages - 1)}
                    disabled={currentPage >= totalPages - 1}
                  >
                    <span className='sr-only'>Aller à la dernière page</span>
                    <ChevronsRight className='h-4 w-4' />
                  </Button>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Dialog */}
      <EmployeeMultiStepForm
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        employee={selectedEmployee}
        onSuccess={handleSuccess}
      />
      {/* Bulk Import Dialog */}
      {firmId && (
        <EmployeeBulkImport
          isOpen={isBulkImportOpen}
          onClose={() => setIsBulkImportOpen(false)}
          firmId={firmId}
          clients={clients}
          onImportComplete={fetchEmployees}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirmer la suppression</DialogTitle>
            <DialogDescription>
              Êtes-vous sûr de vouloir supprimer cet employé?
              {employeeToDelete && (
                <div className='mt-2 font-medium'>
                  {employeeToDelete.firstName} {employeeToDelete.lastName} (
                  {employeeToDelete.matricule})
                </div>
              )}
              <div className='mt-2 text-sm text-orange-600'>
                Note: L&apos;employé sera marqué comme TERMINÉ au lieu
                d&apos;être supprimé définitivement.
              </div>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button variant='destructive' onClick={confirmDelete}>
              Supprimer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
