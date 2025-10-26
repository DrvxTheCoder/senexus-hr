'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle } from 'lucide-react';

export default function ReportsPage() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <div>
        <h1 className='text-3xl font-bold tracking-tight'>Rapports clients</h1>
        <p className='text-muted-foreground mt-1'>
          Rapports trimestriels et analyses
        </p>
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
                Rapports trimestriels
              </p>
              <p className='mt-1 text-sm text-yellow-700'>
                Cette fonctionnalité permettra de générer des rapports
                trimestriels pour les clients.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
