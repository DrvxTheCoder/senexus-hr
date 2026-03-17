'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Building2,
  Users,
  TrendingUp,
  AlertTriangle,
  UserCheck,
  Banknote
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const CHART_COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#8b5cf6',
  '#06b6d4',
  '#ec4899',
  '#84cc16',
  '#f97316',
  '#6366f1'
];

type CrmStats = {
  summary: {
    totalClients: number;
    activeClients: number;
    prospects: number;
    inactiveClients: number;
    totalAssignedEmployees: number;
    expiringContracts: number;
  };
  employeesByClient: { clientId: string; name: string; count: number }[];
  salaryByClient: { clientId: string; name: string; totalSalary: number }[];
  totalSalaryMass: number;
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat('fr-SN', {
    style: 'currency',
    currency: 'XOF',
    maximumFractionDigits: 0
  }).format(value);
}

const CustomTooltipSalary = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className='bg-background rounded-md border px-3 py-2 text-sm shadow-md'>
        <p className='font-medium'>{d.name}</p>
        <p className='text-muted-foreground'>{formatCurrency(d.totalSalary)}</p>
      </div>
    );
  }
  return null;
};

const CustomTooltipEmployees = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const d = payload[0].payload;
    return (
      <div className='bg-background rounded-md border px-3 py-2 text-sm shadow-md'>
        <p className='font-medium'>{d.name}</p>
        <p className='text-muted-foreground'>{d.count} employé(s)</p>
      </div>
    );
  }
  return null;
};

export default function CRMDashboard() {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [firmId, setFirmId] = useState<string | null>(null);
  const [stats, setStats] = useState<CrmStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!firmSlug) return;
    fetch(`/api/firms/by-slug/${firmSlug}`)
      .then((r) => r.json())
      .then((d) => setFirmId(d.id))
      .catch(console.error);
  }, [firmSlug]);

  useEffect(() => {
    if (!firmId) return;
    setLoading(true);
    fetch(`/api/firms/${firmId}/crm-stats`)
      .then((r) => r.json())
      .then((d) => setStats(d))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [firmId]);

  const s = stats?.summary;

  return (
    <div className='flex flex-1 flex-col gap-6 p-4 md:gap-8 md:p-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>
          Tableau de bord CRM
        </h1>
        <p className='text-muted-foreground mt-1'>
          Vue d&apos;ensemble de la gestion des relations clients
        </p>
      </div>

      {/* KPI Cards */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>Total clients</CardTitle>
            <Building2 className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {loading ? '—' : s?.totalClients}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Tous statuts confondus
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Clients actifs
            </CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {loading ? '—' : s?.activeClients}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              En contrat actif
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Employés placés
            </CardTitle>
            <UserCheck className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-purple-600'>
              {loading ? '—' : s?.totalAssignedEmployees}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Assignés à un client
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Masse salariale
            </CardTitle>
            <Banknote className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='truncate text-lg font-bold text-emerald-600'>
              {loading ? '—' : formatCurrency(stats?.totalSalaryMass ?? 0)}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Total employés actifs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between pb-2'>
            <CardTitle className='text-sm font-medium'>
              Contrats à renouveler
            </CardTitle>
            <AlertTriangle className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {loading ? '—' : s?.expiringContracts}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Dans les 30 jours
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className='grid gap-6 md:grid-cols-2'>
        <Card>
          <CardHeader>
            <CardTitle className='text-base'>
              Répartition Masse Salariale
            </CardTitle>
            <p className='text-muted-foreground text-sm'>
              Par client — employés actifs
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='text-muted-foreground flex h-64 items-center justify-center text-sm'>
                Chargement...
              </div>
            ) : !stats?.salaryByClient.length ? (
              <div className='text-muted-foreground flex h-64 items-center justify-center text-sm'>
                Aucune donnée salariale disponible
              </div>
            ) : (
              <ResponsiveContainer width='100%' height={280}>
                <PieChart>
                  <Pie
                    data={stats.salaryByClient}
                    dataKey='totalSalary'
                    nameKey='name'
                    cx='50%'
                    cy='50%'
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                  >
                    {stats.salaryByClient.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipSalary />} />
                  <Legend
                    formatter={(v) =>
                      v.length > 18 ? v.slice(0, 18) + '…' : v
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className='text-base'>
              Répartition Employés par Client
            </CardTitle>
            <p className='text-muted-foreground text-sm'>
              Employés actifs assignés
            </p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className='text-muted-foreground flex h-64 items-center justify-center text-sm'>
                Chargement...
              </div>
            ) : !stats?.employeesByClient.length ? (
              <div className='text-muted-foreground flex h-64 items-center justify-center text-sm'>
                Aucun employé assigné à un client
              </div>
            ) : (
              <ResponsiveContainer width='100%' height={280}>
                <PieChart>
                  <Pie
                    data={stats.employeesByClient}
                    dataKey='count'
                    nameKey='name'
                    cx='50%'
                    cy='50%'
                    outerRadius={100}
                    paddingAngle={2}
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {stats.employeesByClient.map((_, i) => (
                      <Cell
                        key={i}
                        fill={CHART_COLORS[i % CHART_COLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltipEmployees />} />
                  <Legend
                    formatter={(v) =>
                      v.length > 18 ? v.slice(0, 18) + '…' : v
                    }
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
