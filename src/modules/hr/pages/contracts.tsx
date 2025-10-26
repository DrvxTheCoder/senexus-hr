'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, AlertTriangle } from 'lucide-react';

export default function ContractsPage() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Contrats</h1>
          <p className='text-muted-foreground mt-1'>
            Gérer les contrats des employés intérimaires
          </p>
        </div>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Nouveau contrat
        </Button>
      </div>

      <div className='grid gap-4 md:grid-cols-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Contrats actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>-</div>
            <p className='text-muted-foreground mt-1 text-xs'>En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>À renouveler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>-</div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Dans les 30 jours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Expirés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>-</div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Nécessitent action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>-</div>
            <p className='text-muted-foreground mt-1 text-xs'>Tous statuts</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
            <AlertTriangle className='mt-0.5 h-5 w-5 text-yellow-600' />
            <div>
              <p className='font-medium text-yellow-900'>
                Module en cours d&apos;implémentation
              </p>
              <p className='mt-1 text-sm text-yellow-700'>
                Le module de gestion des contrats est prévu pour Phase 2. Il
                inclura :
              </p>
              <ul className='mt-2 ml-4 list-disc space-y-1 text-sm text-yellow-700'>
                <li>Création et gestion des contrats (CDI, CDD, INTERIM)</li>
                <li>
                  Alertes automatiques pour les contrats arrivant à échéance
                </li>
                <li>Workflow de renouvellement de contrat</li>
                <li>Gestion de la résiliation avec motif</li>
                <li>Historique complet des contrats par employé</li>
              </ul>
              <p className='mt-3 text-sm text-yellow-700'>
                Consultez le fichier{' '}
                <code className='rounded bg-yellow-100 px-1 py-0.5 text-xs'>
                  HR_MODULE_IMPLEMENTATION_GUIDE.md
                </code>{' '}
                pour plus de détails.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
