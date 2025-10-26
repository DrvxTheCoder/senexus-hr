'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserX, Plus, AlertTriangle } from 'lucide-react';

export default function AbsencesPage() {
  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>
            Gestion des absences
          </h1>
          <p className='text-muted-foreground mt-1'>
            Suivi des absences justifiées et non justifiées
          </p>
        </div>
        <Button>
          <Plus className='mr-2 h-4 w-4' />
          Enregistrer une absence
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Module en développement - Phase 5</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='flex items-start gap-3 rounded-lg border border-yellow-200 bg-yellow-50 p-4'>
            <AlertTriangle className='mt-0.5 h-5 w-5 text-yellow-600' />
            <div>
              <p className='font-medium text-yellow-900'>
                Suivi des absences et retards
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
