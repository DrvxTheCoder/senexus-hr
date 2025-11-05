'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Calendar, Check, X } from 'lucide-react';

export default function LeavesPage() {
  const leaveRequests = [
    {
      id: '1',
      employee: 'Ousmane Ba',
      type: 'Congés payés',
      startDate: '2025-11-01',
      endDate: '2025-11-05',
      days: 5,
      status: 'En attente',
      reason: 'Vacances familiales'
    },
    {
      id: '2',
      employee: 'Mamadou Ndiaye',
      type: 'Congés maladie',
      startDate: '2025-10-28',
      endDate: '2025-10-30',
      days: 3,
      status: 'Approuvé',
      reason: 'Grippe'
    },
    {
      id: '3',
      employee: 'Awa Thiam',
      type: 'Congés payés',
      startDate: '2025-12-20',
      endDate: '2025-12-31',
      days: 10,
      status: 'En attente',
      reason: "Congés de fin d'année"
    },
    {
      id: '4',
      employee: 'Aminata Diallo',
      type: 'RTT',
      startDate: '2025-11-15',
      endDate: '2025-11-15',
      days: 1,
      status: 'Approuvé',
      reason: 'Jour de repos'
    },
    {
      id: '5',
      employee: 'Fatou Seck',
      type: 'Congés sans solde',
      startDate: '2025-11-10',
      endDate: '2025-11-12',
      days: 3,
      status: 'Rejeté',
      reason: 'Raisons personnelles'
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'destructive'; label: string }
    > = {
      'En attente': { variant: 'secondary', label: 'En attente' },
      Approuvé: { variant: 'default', label: 'Approuvé' },
      Rejeté: { variant: 'destructive', label: 'Rejeté' }
    };

    const config = variants[status] || variants['En attente'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Gestion des congés
          </h1>
          <p className='text-muted-foreground mt-1'>
            Consulter et gérer les demandes de congés
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total demandes
            </CardTitle>
            <Calendar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{leaveRequests.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>
              {leaveRequests.filter((r) => r.status === 'En attente').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Approuvées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {leaveRequests.filter((r) => r.status === 'Approuvé').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Rejetées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {leaveRequests.filter((r) => r.status === 'Rejeté').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Demandes de congés</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Date début</TableHead>
                <TableHead>Date fin</TableHead>
                <TableHead>Jours</TableHead>
                <TableHead>Motif</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {leaveRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell className='font-medium'>
                    {request.employee}
                  </TableCell>
                  <TableCell>{request.type}</TableCell>
                  <TableCell>
                    {new Date(request.startDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>
                    {new Date(request.endDate).toLocaleDateString('fr-FR')}
                  </TableCell>
                  <TableCell>{request.days}</TableCell>
                  <TableCell className='max-w-[200px] truncate'>
                    {request.reason}
                  </TableCell>
                  <TableCell>{getStatusBadge(request.status)}</TableCell>
                  <TableCell className='text-right'>
                    {request.status === 'En attente' && (
                      <div className='flex justify-end gap-2'>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-8 w-8 p-0'
                        >
                          <Check className='h-4 w-4 text-green-600' />
                        </Button>
                        <Button
                          variant='outline'
                          size='sm'
                          className='h-8 w-8 p-0'
                        >
                          <X className='h-4 w-4 text-red-600' />
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
