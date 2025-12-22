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
  Calendar,
  ArrowRightLeft,
  AlertCircle,
  Clock,
  XCircle,
  ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip
} from 'recharts';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  inactive: number;
}

interface ContractInfo {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
  };
  type: string;
  endDate: string | null;
}

interface LeaveInfo {
  id: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
  };
  leaveType: string;
  startDate: string;
  endDate: string;
}

interface DashboardData {
  stats: DashboardStats;
  contracts: {
    total: number;
    expiredCount: number;
    closeToExpirationCount: number;
    expired: ContractInfo[];
    closeToExpiration: ContractInfo[];
  };
  leaves: {
    currentCount: number;
    current: LeaveInfo[];
  };
  demographics: {
    gender: {
      male: number;
      female: number;
      other: number;
    };
    ageGroups: {
      '18-30': number;
      '30-60': number;
      '60+': number;
      unknown: number;
    };
  };
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

  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null
  );
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

      // Fetch dashboard statistics
      const statsResponse = await fetch(
        `/api/firms/${firm.id}/dashboard-stats`
      );
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setDashboardData(data);
      }

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

  const stats = dashboardData?.stats || {
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    inactive: 0
  };

  // Prepare chart data
  const genderData = dashboardData
    ? [
        {
          name: 'Hommes',
          value: dashboardData.demographics.gender.male,
          color: '#3b82f6'
        },
        {
          name: 'Femmes',
          value: dashboardData.demographics.gender.female,
          color: '#ec4899'
        },
        {
          name: 'Autre',
          value: dashboardData.demographics.gender.other,
          color: '#8b5cf6'
        }
      ].filter((item) => item.value > 0)
    : [];

  const ageGroupData = dashboardData
    ? [
        {
          name: '18-30 ans',
          value: dashboardData.demographics.ageGroups['18-30'],
          color: '#10b981'
        },
        {
          name: '30-60 ans',
          value: dashboardData.demographics.ageGroups['30-60'],
          color: '#f59e0b'
        },
        {
          name: '60+ ans',
          value: dashboardData.demographics.ageGroups['60+'],
          color: '#ef4444'
        }
      ].filter((item) => item.value > 0)
    : [];

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

      {/* Stats Cards - Row 1 */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
        <Card className='transition-shadow hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total Employés
            </CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {loading ? '...' : stats.totalEmployees}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>Effectif total</p>
            <Button
              variant='link'
              className='mt-2 h-auto p-0 text-xs'
              onClick={() =>
                router.push(`/${firmSlug}/${moduleSlug}/employees`)
              }
            >
              Voir tous <ArrowRight className='ml-1 h-3 w-3' />
            </Button>
          </CardContent>
        </Card>

        <Card className='transition-shadow hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Contrats Expirant
            </CardTitle>
            <Clock className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {loading
                ? '...'
                : dashboardData?.contracts.closeToExpirationCount || 0}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Dans les 30 prochains jours
            </p>
            <Button
              variant='link'
              className='mt-2 h-auto p-0 text-xs'
              onClick={() =>
                router.push(
                  `/${firmSlug}/${moduleSlug}/contracts?filter=expiring`
                )
              }
            >
              Voir détails <ArrowRight className='ml-1 h-3 w-3' />
            </Button>
          </CardContent>
        </Card>

        <Card className='transition-shadow hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Contrats Expirés
            </CardTitle>
            <XCircle className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {loading ? '...' : dashboardData?.contracts.expiredCount || 0}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Nécessitent une action
            </p>
            <Button
              variant='link'
              className='mt-2 h-auto p-0 text-xs'
              onClick={() =>
                router.push(
                  `/${firmSlug}/${moduleSlug}/contracts?filter=expired`
                )
              }
            >
              Voir détails <ArrowRight className='ml-1 h-3 w-3' />
            </Button>
          </CardContent>
        </Card>

        <Card className='transition-shadow hover:shadow-md'>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>En Congé</CardTitle>
            <Calendar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {loading ? '...' : dashboardData?.leaves.currentCount || 0}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Employés actuellement absents
            </p>
            <Button
              variant='link'
              className='mt-2 h-auto p-0 text-xs'
              onClick={() =>
                router.push(`/${firmSlug}/${moduleSlug}/leaves?filter=current`)
              }
            >
              Voir détails <ArrowRight className='ml-1 h-3 w-3' />
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className='grid gap-4 md:grid-cols-2'>
        {/* Gender Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Genre</CardTitle>
            <CardDescription>
              Distribution hommes/femmes dans l&apos;effectif
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || genderData.length === 0 ? (
              <div className='text-muted-foreground flex h-[300px] items-center justify-center'>
                {loading ? 'Chargement...' : 'Aucune donnée disponible'}
              </div>
            ) : (
              <ResponsiveContainer width='100%' height={300}>
                <PieChart>
                  <Pie
                    data={genderData}
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={100}
                    fill='#8884d8'
                    paddingAngle={5}
                    dataKey='value'
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {genderData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Age Group Distribution Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par Tranche d&apos;Âge</CardTitle>
            <CardDescription>
              Distribution des employés par groupe d&apos;âge
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading || ageGroupData.length === 0 ? (
              <div className='text-muted-foreground flex h-[300px] items-center justify-center'>
                {loading ? 'Chargement...' : 'Aucune donnée disponible'}
              </div>
            ) : (
              <ResponsiveContainer width='100%' height={300}>
                <PieChart>
                  <Pie
                    data={ageGroupData}
                    cx='50%'
                    cy='50%'
                    outerRadius={100}
                    fill='#8884d8'
                    dataKey='value'
                    label={({ name, percent }) =>
                      `${name} ${(percent * 100).toFixed(0)}%`
                    }
                  >
                    {ageGroupData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
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
