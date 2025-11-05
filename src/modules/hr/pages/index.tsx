'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Calendar, Briefcase } from 'lucide-react';
import { getEmployees } from '../actions/employee-actions';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  onLeave: number;
  inactive: number;
}

export default function HRDashboard() {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    onLeave: 0,
    inactive: 0
  });
  const [loading, setLoading] = useState(true);

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

      // Fetch employees
      const employees = await getEmployees(firm.id);
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
    </div>
  );
}
