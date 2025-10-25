'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Building2, Calendar, Briefcase } from 'lucide-react';

export default function HRDashboard() {
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
            <div className='text-2xl font-bold'>245</div>
            <p className='text-muted-foreground text-xs'>
              +12% par rapport au mois dernier
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Départements</CardTitle>
            <Building2 className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>8</div>
            <p className='text-muted-foreground text-xs'>
              Actifs dans l&apos;organisation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Congés en attente
            </CardTitle>
            <Calendar className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>12</div>
            <p className='text-muted-foreground text-xs'>
              Nécessitent une approbation
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Missions actives
            </CardTitle>
            <Briefcase className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>34</div>
            <p className='text-muted-foreground text-xs'>En cours ce mois</p>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-7'>
        <Card className='col-span-4'>
          <CardHeader>
            <CardTitle>Activité récente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[
                {
                  title: 'Nouveau employé ajouté',
                  description: 'Marie Dubois - Développeur Senior',
                  time: 'Il y a 2 heures'
                },
                {
                  title: 'Demande de congé approuvée',
                  description: 'Jean Martin - 5 jours de congé',
                  time: 'Il y a 4 heures'
                },
                {
                  title: 'Mission complétée',
                  description: 'Projet Alpha - Client XYZ',
                  time: 'Il y a 1 jour'
                },
                {
                  title: 'Nouveau département créé',
                  description: 'Innovation & R&D',
                  time: 'Il y a 2 jours'
                }
              ].map((activity, index) => (
                <div key={index} className='flex items-start space-x-4'>
                  <div className='bg-primary/10 flex h-9 w-9 items-center justify-center rounded-full'>
                    <div className='bg-primary h-2 w-2 rounded-full' />
                  </div>
                  <div className='flex-1 space-y-1'>
                    <p className='text-sm leading-none font-medium'>
                      {activity.title}
                    </p>
                    <p className='text-muted-foreground text-sm'>
                      {activity.description}
                    </p>
                    <p className='text-muted-foreground text-xs'>
                      {activity.time}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className='col-span-3'>
          <CardHeader>
            <CardTitle>Aperçu des départements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='space-y-4'>
              {[
                { name: 'IT & Développement', count: 45, color: 'bg-blue-500' },
                {
                  name: 'Ressources Humaines',
                  count: 12,
                  color: 'bg-green-500'
                },
                { name: 'Marketing', count: 28, color: 'bg-purple-500' },
                { name: 'Ventes', count: 35, color: 'bg-orange-500' },
                { name: 'Support Client', count: 22, color: 'bg-pink-500' }
              ].map((dept, index) => (
                <div key={index} className='flex items-center'>
                  <div className={`${dept.color} mr-3 h-2 w-2 rounded-full`} />
                  <div className='flex-1'>
                    <p className='text-sm font-medium'>{dept.name}</p>
                  </div>
                  <div className='text-sm font-medium'>{dept.count}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
