'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function DepartmentsPage() {
  const departments = [
    {
      id: '1',
      name: 'IT & Développement',
      manager: 'Marie Dubois',
      employeeCount: 45,
      color: 'bg-blue-500'
    },
    {
      id: '2',
      name: 'Ressources Humaines',
      manager: 'Sophie Laurent',
      employeeCount: 12,
      color: 'bg-green-500'
    },
    {
      id: '3',
      name: 'Marketing',
      manager: 'Jean Martin',
      employeeCount: 28,
      color: 'bg-purple-500'
    },
    {
      id: '4',
      name: 'Ventes',
      manager: 'Pierre Durand',
      employeeCount: 35,
      color: 'bg-orange-500'
    },
    {
      id: '5',
      name: 'Support Client',
      manager: 'Claire Moreau',
      employeeCount: 22,
      color: 'bg-pink-500'
    },
    {
      id: '6',
      name: 'Finance',
      manager: 'Thomas Bernard',
      employeeCount: 18,
      color: 'bg-yellow-500'
    }
  ];

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Départements</h1>
          <p className='text-muted-foreground mt-1'>
            Gérer les départements de l&apos;entreprise
          </p>
        </div>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Créer un département
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {departments.map((dept) => (
          <Card key={dept.id} className='transition-shadow hover:shadow-lg'>
            <CardHeader>
              <div className='flex items-start justify-between'>
                <div className='flex items-center gap-3'>
                  <div
                    className={`${dept.color} flex h-12 w-12 items-center justify-center rounded-lg text-white`}
                  >
                    <Users className='h-6 w-6' />
                  </div>
                  <div>
                    <CardTitle className='text-lg'>{dept.name}</CardTitle>
                    <p className='text-muted-foreground text-sm'>
                      Manager: {dept.manager}
                    </p>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className='flex items-center justify-between'>
                <div>
                  <p className='text-2xl font-bold'>{dept.employeeCount}</p>
                  <p className='text-muted-foreground text-xs'>Employés</p>
                </div>
                <Button variant='outline' size='sm'>
                  Gérer
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
