'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Briefcase, Clock, DollarSign } from 'lucide-react';

export default function MissionsPage() {
  const missions = [
    {
      id: '1',
      title: 'Développement Application Mobile',
      client: 'TechCorp SA',
      employee: 'Marie Dubois',
      startDate: '2025-10-01',
      endDate: '2025-12-31',
      status: 'En cours',
      budget: '€45,000',
      progress: 65
    },
    {
      id: '2',
      title: 'Audit Sécurité Informatique',
      client: 'SecureBank',
      employee: 'Jean Martin',
      startDate: '2025-11-01',
      endDate: '2025-11-30',
      status: 'En cours',
      budget: '€28,000',
      progress: 30
    },
    {
      id: '3',
      title: 'Migration Cloud AWS',
      client: 'DataCorp',
      employee: 'Sophie Laurent',
      startDate: '2025-09-15',
      endDate: '2025-10-25',
      status: 'Terminé',
      budget: '€52,000',
      progress: 100
    },
    {
      id: '4',
      title: 'Formation React & Next.js',
      client: 'DevAcademy',
      employee: 'Pierre Durand',
      startDate: '2025-11-15',
      endDate: '2025-12-15',
      status: 'Planifié',
      budget: '€15,000',
      progress: 0
    },
    {
      id: '5',
      title: 'Consultation Stratégie Digital',
      client: 'MarketingPro',
      employee: 'Claire Moreau',
      startDate: '2025-10-20',
      endDate: '2025-11-20',
      status: 'En cours',
      budget: '€22,000',
      progress: 45
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      { variant: 'default' | 'secondary' | 'outline'; label: string }
    > = {
      'En cours': { variant: 'default', label: 'En cours' },
      Terminé: { variant: 'secondary', label: 'Terminé' },
      Planifié: { variant: 'outline', label: 'Planifié' }
    };

    const config = variants[status] || variants['Planifié'];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const activeMissions = missions.filter((m) => m.status === 'En cours');
  const totalBudget = missions.reduce((sum, m) => {
    const amount = parseInt(m.budget.replace(/[€,]/g, ''));
    return sum + amount;
  }, 0);

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Missions</h1>
          <p className='text-muted-foreground mt-1'>
            Gérer les missions et projets clients
          </p>
        </div>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Nouvelle mission
        </Button>
      </div>

      {/* Stats */}
      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Total missions
            </CardTitle>
            <Briefcase className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{missions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>En cours</CardTitle>
            <Clock className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>
              {activeMissions.length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Budget total</CardTitle>
            <DollarSign className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              €{totalBudget.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {missions.filter((m) => m.status === 'Terminé').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Missions Grid */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {missions.map((mission) => (
          <Card key={mission.id} className='transition-shadow hover:shadow-lg'>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <CardTitle className='mb-2 text-lg'>
                    {mission.title}
                  </CardTitle>
                  <p className='text-muted-foreground text-sm'>
                    Client: {mission.client}
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    Consultant: {mission.employee}
                  </p>
                </div>
                {getStatusBadge(mission.status)}
              </div>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <div className='mb-2 flex justify-between text-sm'>
                    <span className='text-muted-foreground'>Progression</span>
                    <span className='font-medium'>{mission.progress}%</span>
                  </div>
                  <div className='bg-secondary h-2 w-full overflow-hidden rounded-full'>
                    <div
                      className='bg-primary h-full transition-all'
                      style={{ width: `${mission.progress}%` }}
                    />
                  </div>
                </div>

                <div className='flex items-center justify-between text-sm'>
                  <div>
                    <p className='text-muted-foreground'>Début</p>
                    <p className='font-medium'>
                      {new Date(mission.startDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  <div className='text-right'>
                    <p className='text-muted-foreground'>Fin</p>
                    <p className='font-medium'>
                      {new Date(mission.endDate).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>

                <div className='flex items-center justify-between border-t pt-2'>
                  <span className='text-primary text-lg font-bold'>
                    {mission.budget}
                  </span>
                  <Button variant='outline' size='sm'>
                    Détails
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
