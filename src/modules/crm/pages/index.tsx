'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, TrendingUp } from 'lucide-react';

export default function CRMDashboard() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>
          Tableau de bord CRM
        </h1>
        <p className='text-muted-foreground mt-1'>
          Vue d&apos;ensemble de la gestion des relations clients
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total clients</CardTitle>
            <Building2 className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>-</div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Tous statuts confondus
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Clients actifs
            </CardTitle>
            <Users className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>-</div>
            <p className='text-muted-foreground mt-1 text-xs'>
              En contrat actif
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Prospects</CardTitle>
            <TrendingUp className='text-muted-foreground h-4 w-4' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>-</div>
            <p className='text-muted-foreground mt-1 text-xs'>En prospection</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Bienvenue dans le module CRM</CardTitle>
        </CardHeader>
        <CardContent>
          <p className='text-muted-foreground'>
            Utilisez la navigation pour accéder à la gestion des clients et aux
            rapports.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
