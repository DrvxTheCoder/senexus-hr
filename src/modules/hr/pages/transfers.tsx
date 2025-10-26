'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowRightLeft, Plus, AlertTriangle } from 'lucide-react';

export default function TransfersPage() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Transferts d&apos;employés
          </h1>
          <p className='text-muted-foreground mt-1'>
            Gérer les transferts entre organisations (conformité loi intérim)
          </p>
        </div>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Demander un transfert
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement - Phase 3</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
            <AlertTriangle className='mt-0.5 h-5 w-5 text-yellow-600' />
            <div>
              <p className='font-medium text-yellow-900'>
                Système de transfert inter-organisations
              </p>
              <p className='mt-1 text-sm text-yellow-700'>
                Ce module permettra de transférer les employés entre
                organisations du même holding.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
