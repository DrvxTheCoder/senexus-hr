'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
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
  XCircle
} from 'lucide-react';
import {
  getEmployees,
  createEmployee,
  updateEmployee
} from '../actions/employee-actions';
import { getClients } from '@/modules/crm/actions/client-actions';
import { ProfilePhotoUpload } from '@/components/profile-photo-upload';
import { formatDateFR, formatDuration } from '../utils/date-utils';
import { toast } from 'sonner';

type Employee = any;
type Client = any;
type Department = any;

export default function EmployeesPage() {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [firmId, setFirmId] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );
  const [clients, setClients] = useState<Client[]>([]);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    matricule: '',
    photoUrl: '',
    email: '',
    phone: '',
    address: '',
    hireDate: '',
    firstInterimDate: '',
    departmentId: '',
    assignedClientId: '',
    assignmentStartDate: '',
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
    return (
      searchQuery === '' ||
      `${emp.firstName} ${emp.lastName}`
        .toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      emp.matricule.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

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
      firstInterimDate: '',
      departmentId: '',
      assignedClientId: '',
      assignmentStartDate: '',
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
    setFormData({
      firstName: employee.firstName,
      lastName: employee.lastName,
      matricule: employee.matricule,
      photoUrl: employee.photoUrl || '',
      email: employee.email || '',
      phone: employee.phone || '',
      address: employee.address || '',
      hireDate: employee.hireDate.split('T')[0],
      firstInterimDate: employee.firstInterimDate.split('T')[0],
      departmentId: employee.departmentId || '',
      assignedClientId: employee.assignedClientId || '',
      assignmentStartDate: employee.assignmentStartDate
        ? employee.assignmentStartDate.split('T')[0]
        : '',
      status: employee.status,
      emergencyContact: employee.emergencyContact || {
        name: '',
        phone: '',
        relationship: ''
      }
    });
    setIsDialogOpen(true);
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
        assignmentStartDate: formData.assignmentStartDate || undefined,
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
        <Button onClick={handleAddEmployee}>
          <Plus className='mr-2 h-4 w-4' />
          Ajouter un employé
        </Button>
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
              <div className='relative w-full md:w-[300px]'>
                <Search className='text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4' />
                <Input
                  placeholder='Rechercher...'
                  className='pl-8'
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
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
                {filteredEmployees.map((emp) => {
                  const days = Math.floor(
                    (new Date().getTime() -
                      new Date(emp.firstInterimDate).getTime()) /
                      (1000 * 60 * 60 * 24)
                  );
                  const remaining = Math.max(0, 730 - days);

                  return (
                    <TableRow key={emp.id}>
                      <TableCell className='font-mono'>
                        {emp.matricule}
                      </TableCell>
                      <TableCell>
                        {emp.firstName} {emp.lastName}
                      </TableCell>
                      <TableCell>{emp.department?.name || '-'}</TableCell>
                      <TableCell>{emp.assignedClient?.name || '-'}</TableCell>
                      <TableCell>{getStatusBadge(emp.status)}</TableCell>
                      <TableCell>{formatDateFR(emp.hireDate)}</TableCell>
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
                        <Button
                          variant='ghost'
                          size='sm'
                          onClick={() => handleEditEmployee(emp)}
                        >
                          Modifier
                        </Button>
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
        </CardContent>
      </Card>

      {/* Employee Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-h-[90vh] max-w-3xl overflow-y-auto'>
          <DialogHeader>
            <DialogTitle>
              {selectedEmployee ? "Modifier l'employé" : 'Nouvel employé'}
            </DialogTitle>
            <DialogDescription>
              {selectedEmployee
                ? "Modifier les informations de l'employé"
                : 'Ajouter un nouvel employé intérimaire'}
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            {/* Profile Photo */}
            <div className='space-y-2'>
              <Label>Photo de profil</Label>
              <ProfilePhotoUpload
                value={formData.photoUrl}
                onValueChange={(url) =>
                  setFormData({ ...formData, photoUrl: url || '' })
                }
              />
            </div>

            {/* Personal Information */}
            <div className='space-y-2'>
              <h3 className='text-muted-foreground text-sm font-semibold'>
                Informations personnelles
              </h3>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='firstName'>Prénom *</Label>
                  <Input
                    id='firstName'
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    placeholder='Jean'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='lastName'>Nom *</Label>
                  <Input
                    id='lastName'
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    placeholder='Dupont'
                  />
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='matricule'>Matricule *</Label>
                  <Input
                    id='matricule'
                    value={formData.matricule}
                    onChange={(e) =>
                      setFormData({ ...formData, matricule: e.target.value })
                    }
                    placeholder='EMP-2024-001'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='status'>Statut</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value) =>
                      setFormData({ ...formData, status: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='ACTIVE'>Actif</SelectItem>
                      <SelectItem value='INACTIVE'>Inactif</SelectItem>
                      <SelectItem value='ON_LEAVE'>En congé</SelectItem>
                      <SelectItem value='SUSPENDED'>Suspendu</SelectItem>
                      <SelectItem value='TERMINATED'>Terminé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email'>Email</Label>
                  <Input
                    id='email'
                    type='email'
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    placeholder='jean.dupont@example.com'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='phone'>Téléphone</Label>
                  <Input
                    id='phone'
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    placeholder='+221 77 123 45 67'
                  />
                </div>
              </div>
              <div className='space-y-2'>
                <Label htmlFor='address'>Adresse</Label>
                <Input
                  id='address'
                  value={formData.address}
                  onChange={(e) =>
                    setFormData({ ...formData, address: e.target.value })
                  }
                  placeholder='123 Avenue de...'
                />
              </div>
            </div>

            {/* Employment Information */}
            <div className='space-y-2'>
              <h3 className='text-muted-foreground text-sm font-semibold'>
                Informations d&apos;emploi
              </h3>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='hireDate'>Date d&apos;embauche *</Label>
                  <Input
                    id='hireDate'
                    type='date'
                    value={formData.hireDate}
                    onChange={(e) =>
                      setFormData({ ...formData, hireDate: e.target.value })
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='firstInterimDate'>
                    1ère date d&apos;intérim *
                    <span className='text-muted-foreground ml-2 text-xs'>
                      (Loi 2 ans)
                    </span>
                  </Label>
                  <Input
                    id='firstInterimDate'
                    type='date'
                    value={formData.firstInterimDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        firstInterimDate: e.target.value
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Assignment Information */}
            <div className='space-y-2'>
              <h3 className='text-muted-foreground text-sm font-semibold'>
                Affectation
              </h3>
              <div className='grid grid-cols-2 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='assignedClientId'>Client assigné</Label>
                  <Select
                    value={formData.assignedClientId || undefined}
                    onValueChange={(value) =>
                      setFormData({
                        ...formData,
                        assignedClientId: value === 'none' ? '' : value
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionner un client' />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value='none'>Aucun</SelectItem>
                      {clients.map((client) => (
                        <SelectItem key={client.id} value={client.id}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='assignmentStartDate'>Date de début</Label>
                  <Input
                    id='assignmentStartDate'
                    type='date'
                    value={formData.assignmentStartDate}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        assignmentStartDate: e.target.value
                      })
                    }
                  />
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className='space-y-2'>
              <h3 className='text-muted-foreground text-sm font-semibold'>
                Contact d&apos;urgence
              </h3>
              <div className='grid grid-cols-3 gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='emergencyContactName'>Nom</Label>
                  <Input
                    id='emergencyContactName'
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          name: e.target.value
                        }
                      })
                    }
                    placeholder='Marie Dupont'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='emergencyContactPhone'>Téléphone</Label>
                  <Input
                    id='emergencyContactPhone'
                    value={formData.emergencyContact.phone}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          phone: e.target.value
                        }
                      })
                    }
                    placeholder='+221 77 987 65 43'
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='emergencyContactRelationship'>Relation</Label>
                  <Input
                    id='emergencyContactRelationship'
                    value={formData.emergencyContact.relationship}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        emergencyContact: {
                          ...formData.emergencyContact,
                          relationship: e.target.value
                        }
                      })
                    }
                    placeholder='Épouse'
                  />
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {selectedEmployee ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
