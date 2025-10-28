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
import { Textarea } from '@/components/ui/textarea';
import {
  Plus,
  Search,
  Building2,
  CheckCircle2,
  XCircle,
  Eye
} from 'lucide-react';
import {
  getClients,
  createClient,
  updateClient
} from '../actions/client-actions';
import { ProfilePhotoUpload } from '@/components/profile-photo-upload';
import { toast } from 'sonner';

type Client = any;

export default function ClientsPage() {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [firmId, setFirmId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    photoUrl: '',
    contactName: '',
    contactEmail: '',
    contactPhone: '',
    taxNumber: '',
    address: '',
    industry: '',
    tags: [] as string[],
    status: 'PROSPECT' as any,
    notes: ''
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
      fetchClients();
    }
  }, [firmId, statusFilter]);

  async function fetchClients() {
    if (!firmId) return;
    setLoading(true);
    try {
      const result = await getClients(firmId, {
        status: statusFilter === 'all' ? undefined : statusFilter,
        search: searchQuery
      });

      if (result.success) {
        setClients(result.data || []);
      } else {
        toast.error(result.error || 'Erreur lors du chargement');
      }
    } catch (error) {
      toast.error('Erreur lors du chargement');
    } finally {
      setLoading(false);
    }
  }

  const filteredClients = clients.filter((client) => {
    return (
      searchQuery === '' ||
      client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.contactName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.taxNumber?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  const stats = {
    total: clients.length,
    active: clients.filter((c) => c.status === 'ACTIVE').length,
    prospect: clients.filter((c) => c.status === 'PROSPECT').length,
    inactive: clients.filter(
      (c) => c.status === 'INACTIVE' || c.status === 'ARCHIVED'
    ).length
  };

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; variant: any; icon: any }> = {
      ACTIVE: { label: 'Actif', variant: 'default', icon: CheckCircle2 },
      INACTIVE: { label: 'Inactif', variant: 'secondary', icon: XCircle },
      PROSPECT: { label: 'Prospect', variant: 'outline', icon: Eye },
      ARCHIVED: { label: 'Archivé', variant: 'destructive', icon: XCircle }
    };

    const { label, variant, icon: Icon } = config[status] || config.PROSPECT;

    return (
      <Badge variant={variant} className='flex items-center gap-1'>
        <Icon className='h-3 w-3' />
        {label}
      </Badge>
    );
  };

  const handleAddClient = () => {
    setSelectedClient(null);
    setFormData({
      name: '',
      photoUrl: '',
      contactName: '',
      contactEmail: '',
      contactPhone: '',
      taxNumber: '',
      address: '',
      industry: '',
      tags: [],
      status: 'PROSPECT',
      notes: ''
    });
    setIsDialogOpen(true);
  };

  const handleEditClient = (client: Client) => {
    setSelectedClient(client);
    setFormData({
      name: client.name,
      photoUrl: client.photoUrl || '',
      contactName: client.contactName || '',
      contactEmail: client.contactEmail || '',
      contactPhone: client.contactPhone || '',
      taxNumber: client.taxNumber || '',
      address: client.address || '',
      industry: client.industry || '',
      tags: client.tags || [],
      status: client.status,
      notes: client.notes || ''
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!firmId) {
      toast.error('Firm ID manquant');
      return;
    }

    try {
      console.log('Submitting client:', formData);

      if (selectedClient) {
        const result = await updateClient(selectedClient.id, formData);
        console.log('Update result:', result);
        if (result.success) {
          toast.success('Client mis à jour avec succès');
          setIsDialogOpen(false);
          fetchClients();
        } else {
          toast.error(result.error || 'Erreur lors de la mise à jour');
        }
      } else {
        const result = await createClient(firmId, formData);
        console.log('Create result:', result);
        if (result.success) {
          toast.success('Client créé avec succès');
          setIsDialogOpen(false);
          fetchClients();
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
          <h1 className='text-3xl font-bold tracking-tight'>Clients</h1>
          <p className='text-muted-foreground mt-1'>
            Gérer les clients de l&apos;organisation
          </p>
        </div>
        <Button onClick={handleAddClient}>
          <Plus className='mr-2 h-4 w-4' />
          Ajouter un client
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
            <CardTitle className='text-sm font-medium'>Prospects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {stats.prospect}
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
            <CardTitle>Liste des clients</CardTitle>
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
                  <SelectItem value='PROSPECT'>Prospect</SelectItem>
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
                  <TableHead>Nom</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Téléphone</TableHead>
                  <TableHead>Industrie</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Employés</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredClients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className='font-medium'>
                      <div className='flex items-center gap-2'>
                        <Building2 className='text-muted-foreground h-4 w-4' />
                        {client.name}
                      </div>
                    </TableCell>
                    <TableCell>{client.contactName || '-'}</TableCell>
                    <TableCell className='text-sm'>
                      {client.contactEmail || '-'}
                    </TableCell>
                    <TableCell>{client.contactPhone || '-'}</TableCell>
                    <TableCell>{client.industry || '-'}</TableCell>
                    <TableCell>{getStatusBadge(client.status)}</TableCell>
                    <TableCell>
                      <Badge variant='secondary'>
                        {client._count?.assignedEmployees || 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant='ghost'
                        size='sm'
                        onClick={() => handleEditClient(client)}
                      >
                        Modifier
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {filteredClients.length === 0 && !loading && (
            <div className='text-muted-foreground py-12 text-center'>
              Aucun client trouvé
            </div>
          )}
        </CardContent>
      </Card>

      {/* Client Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className='max-w-2xl'>
          <DialogHeader>
            <DialogTitle>
              {selectedClient ? 'Modifier le client' : 'Nouveau client'}
            </DialogTitle>
            <DialogDescription>
              {selectedClient
                ? 'Modifier les informations du client'
                : 'Ajouter un nouveau client dans le système'}
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

            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='name'>Nom du client *</Label>
                <Input
                  id='name'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  placeholder='ABC Corporation'
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
                    <SelectItem value='PROSPECT'>Prospect</SelectItem>
                    <SelectItem value='ACTIVE'>Actif</SelectItem>
                    <SelectItem value='INACTIVE'>Inactif</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='contactName'>Nom du contact</Label>
                <Input
                  id='contactName'
                  value={formData.contactName}
                  onChange={(e) =>
                    setFormData({ ...formData, contactName: e.target.value })
                  }
                  placeholder='Jean Dupont'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='contactEmail'>Email</Label>
                <Input
                  id='contactEmail'
                  type='email'
                  value={formData.contactEmail}
                  onChange={(e) =>
                    setFormData({ ...formData, contactEmail: e.target.value })
                  }
                  placeholder='contact@example.com'
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='contactPhone'>Téléphone</Label>
                <Input
                  id='contactPhone'
                  value={formData.contactPhone}
                  onChange={(e) =>
                    setFormData({ ...formData, contactPhone: e.target.value })
                  }
                  placeholder='+221 77 123 45 67'
                />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='taxNumber'>Numéro fiscal</Label>
                <Input
                  id='taxNumber'
                  value={formData.taxNumber}
                  onChange={(e) =>
                    setFormData({ ...formData, taxNumber: e.target.value })
                  }
                  placeholder='123456789'
                />
              </div>
            </div>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='industry'>Secteur d&apos;activité</Label>
                <Input
                  id='industry'
                  value={formData.industry}
                  onChange={(e) =>
                    setFormData({ ...formData, industry: e.target.value })
                  }
                  placeholder='Technologie, Finance, etc.'
                />
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
            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes</Label>
              <Textarea
                id='notes'
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder='Notes supplémentaires...'
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant='outline' onClick={() => setIsDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSubmit}>
              {selectedClient ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
