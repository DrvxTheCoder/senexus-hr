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
  Calendar,
  Check,
  X,
  Plus,
  Users,
  AlertCircle,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import { LeaveRequestDialog } from '../components/leave-form/LeaveRequestDialog';

interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: string;
  status: string;
  reason: string | null;
  isJustified: boolean;
  isPaid: boolean;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
  };
  reviewer?: {
    name: string;
  } | null;
  reviewedAt?: string | null;
  rejectionReason?: string | null;
}

interface LeaveBalance {
  id: string;
  employeeId: string;
  year: number;
  leaveType: string;
  totalDays: string;
  usedDays: string;
  remainingDays: string;
  carriedOver: string;
  employee: {
    firstName: string;
    lastName: string;
    matricule: string;
  };
}

export default function LeavesPage() {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [firmId, setFirmId] = React.useState<string>('');
  const [leaveRequests, setLeaveRequests] = React.useState<LeaveRequest[]>([]);
  const [balances, setBalances] = React.useState<LeaveBalance[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [statusFilter, setStatusFilter] = React.useState<string>('ALL');
  const [showCreateDialog, setShowCreateDialog] = React.useState(false);
  const [selectedLeave, setSelectedLeave] = React.useState<LeaveRequest | null>(
    null
  );
  const [approveDialogOpen, setApproveDialogOpen] = React.useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = React.useState(false);
  const [rejectionReason, setRejectionReason] = React.useState('');
  const [performingRollover, setPerformingRollover] = React.useState(false);

  React.useEffect(() => {
    if (firmSlug) {
      fetchFirmId();
    }
  }, [firmSlug]);

  React.useEffect(() => {
    if (firmId) {
      fetchData();
    }
  }, [firmId, statusFilter]);

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
    setIsLoading(true);
    try {
      const [leavesRes, balancesRes] = await Promise.all([
        fetch(
          `/api/firms/${firmId}/leaves${statusFilter && statusFilter !== 'ALL' ? `?status=${statusFilter}` : ''}`
        ),
        fetch(`/api/firms/${firmId}/leave-balances`)
      ]);

      if (leavesRes.ok) {
        const data = await leavesRes.json();
        setLeaveRequests(data.leaveRequests || []);
      }

      if (balancesRes.ok) {
        const data = await balancesRes.json();
        setBalances(data.balances || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Échec du chargement des données');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!selectedLeave) return;

    try {
      const res = await fetch(
        `/api/firms/${firmId}/leaves/${selectedLeave.id}/approve`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Échec de l'approbation");
      }

      toast.success('Demande approuvée avec succès');
      fetchData();
      setApproveDialogOpen(false);
      setSelectedLeave(null);
    } catch (err: any) {
      toast.error(err.message || "Échec de l'approbation");
    }
  };

  const handleReject = async () => {
    if (!selectedLeave || !rejectionReason.trim()) {
      toast.error('Veuillez fournir une raison de rejet');
      return;
    }

    try {
      const res = await fetch(
        `/api/firms/${firmId}/leaves/${selectedLeave.id}/reject`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason: rejectionReason })
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Échec du rejet');
      }

      toast.success('Demande rejetée');
      fetchData();
      setRejectDialogOpen(false);
      setSelectedLeave(null);
      setRejectionReason('');
    } catch (err: any) {
      toast.error(err.message || 'Échec du rejet');
    }
  };

  const handleRollover = async () => {
    if (
      !confirm(
        "Voulez-vous effectuer le report des congés non utilisés de l'année précédente ?"
      )
    ) {
      return;
    }

    setPerformingRollover(true);
    try {
      const res = await fetch(`/api/firms/${firmId}/leave-balances`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Échec du report');
      }

      const data = await res.json();
      toast.success(
        `Report effectué: ${data.balancesCreated} créés, ${data.balancesRolledOver} mis à jour`
      );
      fetchData();
    } catch (err: any) {
      toast.error(err.message || 'Échec du report');
    } finally {
      setPerformingRollover(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; icon: any; label: string }> =
      {
        PENDING: { variant: 'outline', icon: Clock, label: 'En attente' },
        APPROVED: { variant: 'default', icon: CheckCircle2, label: 'Approuvé' },
        REJECTED: { variant: 'destructive', icon: X, label: 'Rejeté' },
        CANCELLED: { variant: 'secondary', icon: AlertCircle, label: 'Annulé' }
      };

    const config = variants[status] || variants.PENDING;
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className='gap-1'>
        <Icon className='h-3 w-3' />
        {config.label}
      </Badge>
    );
  };

  const getLeaveTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      ANNUAL: 'Congés annuels',
      SICK: 'Maladie',
      MATERNITY: 'Maternité',
      PATERNITY: 'Paternité',
      UNPAID: 'Sans solde',
      SPECIAL: 'Spécial',
      COMPENSATORY: 'Compensatoire'
    };
    return labels[type] || type;
  };

  const stats = React.useMemo(() => {
    const pending = leaveRequests.filter((r) => r.status === 'PENDING').length;
    const approved = leaveRequests.filter(
      (r) => r.status === 'APPROVED'
    ).length;
    const totalEmployees = new Set(balances.map((b) => b.employeeId)).size;
    const avgRemaining =
      balances.length > 0
        ? balances.reduce((sum, b) => sum + parseFloat(b.remainingDays), 0) /
          balances.length
        : 0;

    return {
      pending,
      approved,
      totalEmployees,
      avgRemaining: avgRemaining.toFixed(1)
    };
  }, [leaveRequests, balances]);

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
          <h1 className='text-3xl font-bold tracking-tight'>
            Gestion des congés
          </h1>
          <p className='text-muted-foreground mt-1'>
            Gérer les demandes et soldes de congés
          </p>
        </div>
        <div className='flex gap-2'>
          <Button
            variant='outline'
            onClick={handleRollover}
            disabled={performingRollover}
          >
            {performingRollover ? 'Report en cours...' : 'Report annuel'}
          </Button>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Nouvelle demande
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>En attente</CardTitle>
            <Clock className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.pending}</div>
            <p className='text-muted-foreground text-xs'>
              Demande{stats.pending > 1 ? 's' : ''} à traiter
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Approuvées</CardTitle>
            <CheckCircle2 className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.approved}</div>
            <p className='text-muted-foreground text-xs'>Cette année</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Employés</CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.totalEmployees}</div>
            <p className='text-muted-foreground text-xs'>Avec solde actif</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Moyenne restante
            </CardTitle>
            <Calendar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.avgRemaining}</div>
            <p className='text-muted-foreground text-xs'>Jours par employé</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className='flex items-center gap-4'>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className='w-[200px]'>
            <SelectValue placeholder='Tous les statuts' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='ALL'>Tous les statuts</SelectItem>
            <SelectItem value='PENDING'>En attente</SelectItem>
            <SelectItem value='APPROVED'>Approuvé</SelectItem>
            <SelectItem value='REJECTED'>Rejeté</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Leave Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de congés</CardTitle>
          <CardDescription>
            Liste de toutes les demandes de congés
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Durée</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={6}
                    className='text-muted-foreground text-center'
                  >
                    Aucune demande de congé
                  </TableCell>
                </TableRow>
              ) : (
                leaveRequests.map((leave) => (
                  <TableRow key={leave.id}>
                    <TableCell>
                      <div>
                        <div className='font-medium'>
                          {leave.employee.firstName} {leave.employee.lastName}
                        </div>
                        <div className='text-muted-foreground text-sm'>
                          {leave.employee.matricule}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        {getLeaveTypeLabel(leave.leaveType)}
                        {leave.isPaid && (
                          <Badge variant='secondary' className='ml-2 text-xs'>
                            Payé
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className='text-sm'>
                        {format(new Date(leave.startDate), 'dd MMM', {
                          locale: fr
                        })}{' '}
                        -{' '}
                        {format(new Date(leave.endDate), 'dd MMM yyyy', {
                          locale: fr
                        })}
                      </div>
                    </TableCell>
                    <TableCell>{leave.totalDays} jour(s)</TableCell>
                    <TableCell>{getStatusBadge(leave.status)}</TableCell>
                    <TableCell>
                      {leave.status === 'PENDING' && (
                        <div className='flex gap-2'>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              setSelectedLeave(leave);
                              setApproveDialogOpen(true);
                            }}
                          >
                            <Check className='h-4 w-4' />
                          </Button>
                          <Button
                            size='sm'
                            variant='outline'
                            onClick={() => {
                              setSelectedLeave(leave);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <X className='h-4 w-4' />
                          </Button>
                        </div>
                      )}
                      {leave.status === 'APPROVED' && leave.reviewer && (
                        <div className='text-muted-foreground text-xs'>
                          Approuvé par {leave.reviewer.name}
                        </div>
                      )}
                      {leave.status === 'REJECTED' && leave.rejectionReason && (
                        <div className='text-destructive text-xs'>
                          {leave.rejectionReason}
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Leave Balances Table */}
      <Card>
        <CardHeader>
          <CardTitle>Soldes de congés</CardTitle>
          <CardDescription>
            Soldes des congés annuels pour l&apos;année en cours
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Utilisés</TableHead>
                <TableHead>Restants</TableHead>
                <TableHead>Report</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {balances.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className='text-muted-foreground text-center'
                  >
                    Aucun solde de congé
                  </TableCell>
                </TableRow>
              ) : (
                balances.map((balance) => (
                  <TableRow key={balance.id}>
                    <TableCell>
                      <div>
                        <div className='font-medium'>
                          {balance.employee.firstName}{' '}
                          {balance.employee.lastName}
                        </div>
                        <div className='text-muted-foreground text-sm'>
                          {balance.employee.matricule}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{balance.totalDays} jours</TableCell>
                    <TableCell>{balance.usedDays} jours</TableCell>
                    <TableCell>
                      <span className='font-semibold'>
                        {balance.remainingDays} jours
                      </span>
                    </TableCell>
                    <TableCell>
                      {parseFloat(balance.carriedOver) > 0 ? (
                        <Badge variant='secondary'>
                          +{balance.carriedOver} jours
                        </Badge>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialogs */}
      <LeaveRequestDialog
        open={showCreateDialog}
        onOpenChange={setShowCreateDialog}
        onSuccess={fetchData}
      />

      <AlertDialog open={approveDialogOpen} onOpenChange={setApproveDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approuver la demande de congé</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir approuver cette demande de congé ?
              {selectedLeave && (
                <div className='mt-2 text-sm'>
                  <strong>
                    {selectedLeave.employee.firstName}{' '}
                    {selectedLeave.employee.lastName}
                  </strong>{' '}
                  - {selectedLeave.totalDays} jour(s)
                </div>
              )}
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

      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeter la demande de congé</AlertDialogTitle>
            <AlertDialogDescription>
              Veuillez indiquer la raison du rejet.
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
    </div>
  );
}
