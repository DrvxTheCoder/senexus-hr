'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Search, ArrowRight, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface EmployeeTransfer {
  id: string;
  employeeId: string;
  fromFirmId: string;
  toFirmId: string;
  clientId: string | null;
  transferDate: string;
  effectiveDate: string;
  reason: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'COMPLETED' | 'CANCELLED';
  approvedAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    photoUrl: string | null;
  };
  fromFirm: {
    id: string;
    name: string;
  };
  toFirm: {
    id: string;
    name: string;
  };
  client: {
    id: string;
    name: string;
  } | null;
  requester: {
    id: string;
    name: string;
    email: string;
  };
  approver: {
    id: string;
    name: string;
    email: string;
  } | null;
}

export default function TransfersPage() {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [firmId, setFirmId] = React.useState<string>('');
  const [transfers, setTransfers] = React.useState<EmployeeTransfer[]>([]);
  const [filteredTransfers, setFilteredTransfers] = React.useState<
    EmployeeTransfer[]
  >([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<string>('');
  const [activeTab, setActiveTab] = React.useState('all');

  // Alert dialogs
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [completeDialogOpen, setCompleteDialogOpen] = React.useState(false);
  const [selectedTransfer, setSelectedTransfer] =
    React.useState<EmployeeTransfer | null>(null);
  const [rejectionReason, setRejectionReason] = React.useState('');

  React.useEffect(() => {
    fetchFirmId();
  }, [firmSlug]);

  React.useEffect(() => {
    if (firmId) {
      fetchTransfers();
    }
  }, [firmId]);

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

  React.useEffect(() => {
    applyFilters();
  }, [transfers, searchQuery, statusFilter, activeTab]);

  const fetchTransfers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/firms/${firmId}/transfers`);
      if (!response.ok) throw new Error('Échec du chargement des transferts');
      const data = await response.json();
      setTransfers(data.transfers || []);
    } catch (error) {
      console.error('Error fetching transfers:', error);
      toast.error('Échec du chargement des transferts');
    } finally {
      setIsLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transfers];

    // Tab filter
    if (activeTab === 'incoming') {
      filtered = filtered.filter((t) => t.toFirmId === firmId);
    } else if (activeTab === 'outgoing') {
      filtered = filtered.filter((t) => t.fromFirmId === firmId);
    }

    // Status filter
    if (statusFilter && statusFilter !== 'ALL') {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.employee.firstName.toLowerCase().includes(query) ||
          t.employee.lastName.toLowerCase().includes(query) ||
          t.employee.matricule.toLowerCase().includes(query) ||
          t.fromFirm.name.toLowerCase().includes(query) ||
          t.toFirm.name.toLowerCase().includes(query)
      );
    }

    setFilteredTransfers(filtered);
  };

  const handleApprove = async () => {
    if (!selectedTransfer) return;

    try {
      const response = await fetch(
        `/api/firms/${firmId}/transfers/${selectedTransfer.id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Échec de l'approbation du transfert");
      }

      toast.success('Transfert approuvé avec succès');
      fetchTransfers();
      setApproveDialogOpen(false);
      setSelectedTransfer(null);
    } catch (error: any) {
      toast.error(error.message || "Échec de l'approbation du transfert");
    }
  };

  const handleReject = async () => {
    if (!selectedTransfer || !rejectionReason.trim()) {
      toast.error('Veuillez fournir une raison de rejet');
      return;
    }

    try {
      const response = await fetch(
        `/api/firms/${firmId}/transfers/${selectedTransfer.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectionReason })
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Échec du rejet du transfert');
      }

      toast.success('Transfert rejeté avec succès');
      fetchTransfers();
      setRejectDialogOpen(false);
      setSelectedTransfer(null);
      setRejectionReason('');
    } catch (error: any) {
      toast.error(error.message || 'Échec du rejet du transfert');
    }
  };

  const handleComplete = async () => {
    if (!selectedTransfer) return;

    try {
      const response = await fetch(
        `/api/firms/${firmId}/transfers/${selectedTransfer.id}/complete`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Échec de la finalisation du transfert');
      }

      toast.success('Transfert finalisé avec succès');
      fetchTransfers();
      setCompleteDialogOpen(false);
      setSelectedTransfer(null);
    } catch (error: any) {
      toast.error(error.message || 'Échec de la finalisation du transfert');
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any }> = {
      PENDING: { variant: 'outline', icon: Clock },
      APPROVED: { variant: 'default', icon: CheckCircle2 },
      REJECTED: { variant: 'destructive', icon: XCircle },
      COMPLETED: { variant: 'secondary', icon: CheckCircle2 }
    };

    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className='gap-1'>
        <Icon className='h-3 w-3' />
        {status}
      </Badge>
    );
  };

  const canApprove = (transfer: EmployeeTransfer) => {
    return transfer.status === 'PENDING' && transfer.toFirmId === firmId;
  };

  const canReject = (transfer: EmployeeTransfer) => {
    return transfer.status === 'PENDING' && transfer.toFirmId === firmId;
  };

  const canComplete = (transfer: EmployeeTransfer) => {
    return transfer.status === 'APPROVED' && transfer.fromFirmId === firmId;
  };

  if (isLoading) {
    return (
      <div className='flex min-h-[400px] items-center justify-center'>
        <div className='text-muted-foreground'>
          Chargement des transferts...
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div>
        <h1 className='text-3xl font-bold'>Transferts d&apos;employés</h1>
        <p className='text-muted-foreground mt-2'>
          Gérez les transferts d&apos;employés entre cabinets
        </p>
      </div>

      {/* Filters */}
      <div className='flex flex-col gap-4 sm:flex-row'>
        <div className='relative flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 transform' />
          <Input
            placeholder='Rechercher par employé, matricule, cabinet...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='pl-9'
          />
        </div>
        <Select
          value={statusFilter || 'ALL'}
          onValueChange={(val) => setStatusFilter(val === 'ALL' ? '' : val)}
        >
          <SelectTrigger className='w-full sm:w-[200px]'>
            <SelectValue placeholder='Statut' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>Tous les statuts</SelectItem>
            <SelectItem value='PENDING'>En attente</SelectItem>
            <SelectItem value='APPROVED'>Approuvé</SelectItem>
            <SelectItem value='REJECTED'>Rejeté</SelectItem>
            <SelectItem value='COMPLETED'>Terminé</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value='all'>Tous ({transfers.length})</TabsTrigger>
          <TabsTrigger value='incoming'>
            Entrants ({transfers.filter((t) => t.toFirmId === firmId).length})
          </TabsTrigger>
          <TabsTrigger value='outgoing'>
            Sortants ({transfers.filter((t) => t.fromFirmId === firmId).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className='mt-6'>
          {filteredTransfers.length === 0 ? (
            <Card>
              <CardContent className='flex flex-col items-center justify-center py-12'>
                <p className='text-muted-foreground'>Aucun transfert trouvé</p>
              </CardContent>
            </Card>
          ) : (
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3'>
              {filteredTransfers.map((transfer) => (
                <Card key={transfer.id}>
                  <CardHeader>
                    <div className='flex items-start justify-between'>
                      <div className='space-y-1'>
                        <CardTitle className='text-lg'>
                          {transfer.employee.firstName}{' '}
                          {transfer.employee.lastName}
                        </CardTitle>
                        <CardDescription>
                          {transfer.employee.matricule}
                        </CardDescription>
                      </div>
                      {getStatusBadge(transfer.status)}
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-4'>
                    <div className='flex items-center gap-2 text-sm'>
                      <span className='font-medium'>
                        {transfer.fromFirm.name}
                      </span>
                      <ArrowRight className='text-muted-foreground h-4 w-4' />
                      <span className='font-medium'>
                        {transfer.toFirm.name}
                      </span>
                    </div>

                    {transfer.client && (
                      <div className='text-sm'>
                        <span className='text-muted-foreground'>Client: </span>
                        <span className='font-medium'>
                          {transfer.client.name}
                        </span>
                      </div>
                    )}

                    <div className='text-sm'>
                      <span className='text-muted-foreground'>
                        Date effective:{' '}
                      </span>
                      <span className='font-medium'>
                        {format(new Date(transfer.effectiveDate), 'dd/MM/yyyy')}
                      </span>
                    </div>

                    {transfer.reason && (
                      <div className='text-sm'>
                        <span className='text-muted-foreground'>Raison: </span>
                        <p className='mt-1 text-sm'>{transfer.reason}</p>
                      </div>
                    )}

                    {transfer.status === 'REJECTED' &&
                      transfer.rejectionReason && (
                        <div className='bg-destructive/10 border-destructive/20 rounded border p-2 text-sm'>
                          <span className='text-destructive font-medium'>
                            Rejeté:{' '}
                          </span>
                          <p className='mt-1 text-sm'>
                            {transfer.rejectionReason}
                          </p>
                        </div>
                      )}

                    {transfer.approver && (
                      <div className='text-muted-foreground text-xs'>
                        Approuvé par {transfer.approver.name}
                        {transfer.approvedAt &&
                          ` le ${format(new Date(transfer.approvedAt), 'dd/MM/yyyy')}`}
                      </div>
                    )}

                    <div className='text-muted-foreground text-xs'>
                      Demandé par {transfer.requester.name}
                      {' le '}
                      {format(new Date(transfer.createdAt), 'dd/MM/yyyy')}
                    </div>
                  </CardContent>
                  <CardFooter className='flex flex-col gap-2'>
                    {transfer.status === 'PENDING' &&
                      transfer.toFirmId !== firmId && (
                        <p className='text-muted-foreground text-xs italic'>
                          En attente d&apos;approbation par{' '}
                          {transfer.toFirm.name}
                        </p>
                      )}
                    {transfer.status === 'APPROVED' &&
                      transfer.fromFirmId !== firmId && (
                        <p className='text-muted-foreground text-xs italic'>
                          En attente de finalisation par{' '}
                          {transfer.fromFirm.name}
                        </p>
                      )}
                    <div className='flex w-full gap-2'>
                      {canApprove(transfer) && (
                        <Button
                          size='sm'
                          className='flex-1'
                          onClick={() => {
                            setSelectedTransfer(transfer);
                            setApproveDialogOpen(true);
                          }}
                        >
                          <CheckCircle2 className='mr-1 h-4 w-4' />
                          Approuver
                        </Button>
                      )}
                      {canReject(transfer) && (
                        <Button
                          size='sm'
                          variant='outline'
                          className='flex-1'
                          onClick={() => {
                            setSelectedTransfer(transfer);
                            setRejectDialogOpen(true);
                          }}
                        >
                          <XCircle className='mr-1 h-4 w-4' />
                          Rejeter
                        </Button>
                      )}
                      {canComplete(transfer) && (
                        <Button
                          size='sm'
                          className='flex-1'
                          onClick={() => {
                            setSelectedTransfer(transfer);
                            setCompleteDialogOpen(true);
                          }}
                        >
                          Finaliser
                        </Button>
                      )}
                    </div>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Approve Dialog */}
      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approuver le transfert</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir approuver ce transfert ? L&apos;employé
              pourra être transféré une fois que le cabinet source finalisera le
              transfert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove}>
              Approuver
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter le transfert</AlertDialogTitle>
            <AlertDialogDescription>
              Veuillez indiquer la raison du rejet de ce transfert.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className='py-4'>
            <Input
              placeholder='Raison du rejet...'
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setRejectionReason('')}>
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleReject}
              className='bg-destructive'
            >
              Rejeter
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Dialog */}
      <AlertDialog
        open={completeDialogOpen}
        onOpenChange={setCompleteDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Finaliser le transfert</AlertDialogTitle>
            <AlertDialogDescription>
              Cette action va terminer tous les contrats actifs de
              l&apos;employé dans ce cabinet et le transférer définitivement au
              cabinet de destination. Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleComplete}>
              Finaliser
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
