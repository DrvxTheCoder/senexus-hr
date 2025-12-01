'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
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
  Users,
  Building2,
  Calendar,
  Briefcase,
  ArrowRightLeft,
  AlertCircle
} from 'lucide-react';
import { getEmployees } from '../actions/employee-actions';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  inactive: number;
}

interface PendingTransfer {
  id: string;
  transferDate: string;
  effectiveDate: string;
  reason: string;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
    matricule: string;
  };
  fromFirm: {
    name: string;
  };
  toFirm: {
    name: string;
  };
}

export default function HRDashboard() {
  const params = useParams();
  const router = useRouter();
  const firmSlug = params.firmSlug as string;
  const moduleSlug = params.moduleSlug as string;

  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    inactive: 0
  });
  const [pendingTransfers, setPendingTransfers] = useState<PendingTransfer[]>(
    []
  );
  const [loading, setLoading] = useState(true);
  const [firmId, setFirmId] = useState<string>('');

  useEffect(() => {
    fetchDashboardData();
  }, [firmSlug]);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // Fetch firm ID from firmSlug
      const firmResponse = await fetch(`/api/firms?slug=${firmSlug}`);
      const firms = await firmResponse.json();
      const firm = firms[0];

      if (!firm) {
        setLoading(false);
        return;
      }

      setFirmId(firm.id);

      // Fetch employees
      const employeesResponse = await getEmployees(firm.id);
      const employees = employeesResponse.success
        ? employeesResponse.data || []
        : [];
      const activeCount = employees.filter(
        (e: any) => e.status === 'ACTIVE'
      ).length;
      const onLeaveCount = employees.filter(
        (e: any) => e.status === 'ON_LEAVE'
      ).length;
      const inactiveCount = employees.filter(
        (e: any) => e.status === 'INACTIVE'
      ).length;

      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeCount,
        onLeave: onLeaveCount,
        inactive: inactiveCount
      });

      // Fetch pending transfers (incoming to this firm)
      try {
        const transfersResponse = await fetch(
          `/api/firms/${firm.id}/transfers?status=PENDING&direction=in`
        );
        if (transfersResponse.ok) {
          const data = await transfersResponse.json();
          setPendingTransfers(data.transfers || []);
        } else {
          console.error(
            'Failed to fetch transfers:',
            await transfersResponse.text()
          );
        }
      } catch (err) {
        console.error('Error fetching transfers:', err);
        // Don't fail the whole dashboard if transfers fail
        setPendingTransfers([]);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Ressources Humaines
          </h1>
          <p className='text-muted-foreground mt-1'>
            Vue d&apos;ensemble de la gestion RH
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Employés Total
            </CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {loading ? '...' : stats.totalEmployees}
            </div>
            <p className='text-muted-foreground text-xs'>Effectif total</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Actifs</CardTitle>
            <Building2 className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {loading ? '...' : stats.activeEmployees}
            </div>
            <p className='text-muted-foreground text-xs'>Employés actifs</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>En congé</CardTitle>
            <Calendar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {loading ? '...' : stats.onLeave}
            </div>
            <p className='text-muted-foreground text-xs'>
              Absents temporairement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Inactifs</CardTitle>
            <Briefcase className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-gray-600'>
              {loading ? '...' : stats.inactive}
            </div>
            <p className='text-muted-foreground text-xs'>Non actifs</p>
          </CardContent>
        </Card>
      </div>

      {/* Activity Info */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <Card className='col-span-4'>
          <CardHeader>
            <CardTitle>Bienvenue au module RH</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              <p className='text-muted-foreground'>
                Utilisez le menu de navigation pour accéder aux différentes
                fonctionnalités:
              </p>
              <ul className='text-muted-foreground list-inside list-disc space-y-2'>
                <li>Gestion des employés</li>
                <li>Gestion des congés</li>
                <li>Suivi des missions</li>
                <li>Rapports et statistiques</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <Card className='col-span-3'>
          <CardHeader>
            <CardTitle>Statistiques rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[
                {
                  label: "Taux d'activité",
                  value:
                    stats.totalEmployees > 0
                      ? `${Math.round((stats.activeEmployees / stats.totalEmployees) * 100)}%`
                      : '0%',
                  color: 'bg-green-500'
                },
                {
                  label: 'En congé',
                  value:
                    stats.totalEmployees > 0
                      ? `${Math.round((stats.onLeave / stats.totalEmployees) * 100)}%`
                      : '0%',
                  color: 'bg-orange-500'
                },
                {
                  label: 'Inactifs',
                  value:
                    stats.totalEmployees > 0
                      ? `${Math.round((stats.inactive / stats.totalEmployees) * 100)}%`
                      : '0%',
                  color: 'bg-gray-500'
                }
              ].map((stat, index) => (
                <div key={index} className='flex items-center justify-between'>
                  <div className='flex items-center gap-2'>
                    <div className={`${stat.color} h-2 w-2 rounded-full`} />
                    <span className='text-sm font-medium'>{stat.label}</span>
                  </div>
                  <span className='text-sm font-bold'>{stat.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Transfer Requests */}
      {pendingTransfers.length > 0 && (
        <Card>
          <CardHeader>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='flex items-center gap-2'>
                  <ArrowRightLeft className='h-5 w-5' />
                  Demandes de transfert en attente
                </CardTitle>
                <CardDescription>
                  {pendingTransfers.length} demande
                  {pendingTransfers.length > 1 ? 's' : ''} à examiner
                </CardDescription>
              </div>
              <Button
                variant='outline'
                onClick={() =>
                  router.push(`/${firmSlug}/${moduleSlug}/transfers`)
                }
              >
                Voir tout
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {pendingTransfers.slice(0, 3).map((transfer) => (
                <div
                  key={transfer.id}
                  className='hover:bg-muted/50 flex items-center justify-between rounded-lg border p-4 transition-colors'
                >
                  <div className='flex-1 space-y-1'>
                    <div className='flex items-center gap-2'>
                      <p className='font-medium'>
                        {transfer.employee.firstName}{' '}
                        {transfer.employee.lastName}
                      </p>
                      <Badge variant='secondary' className='text-xs'>
                        {transfer.employee.matricule}
                      </Badge>
                    </div>
                    <p className='text-muted-foreground text-sm'>
                      De{' '}
                      <span className='font-medium'>
                        {transfer.fromFirm.name}
                      </span>
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      Date d&apos;effet:{' '}
                      {format(new Date(transfer.effectiveDate), 'dd MMM yyyy', {
                        locale: fr
                      })}
                    </p>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge variant='outline' className='gap-1'>
                      <AlertCircle className='h-3 w-3' />
                      En attente
                    </Badge>
                    <Button
                      size='sm'
                      onClick={() =>
                        router.push(
                          `/${firmSlug}/${moduleSlug}/transfers?id=${transfer.id}`
                        )
                      }
                    >
                      Examiner
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
