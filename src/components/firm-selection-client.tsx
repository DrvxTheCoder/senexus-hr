'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { LoadingSpinner } from '@/components/loading-spinner';

type Firm = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  themeColor: string | null;
  role: string;
};

export function FirmSelectionClient({ firms }: { firms: Firm[] }) {
  const router = useRouter();
  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const handleFirmClick = (firm: Firm) => {
    setSelectedFirm(firm);
    setIsDialogOpen(true);
  };

  const handleConfirm = () => {
    if (!selectedFirm) return;

    setIsNavigating(true);
    const isAdmin =
      selectedFirm.role === 'ADMIN' || selectedFirm.role === 'OWNER';
    const basePath = isAdmin ? '/admin' : `/${selectedFirm.slug}`;

    // Apply theme color if available
    if (selectedFirm.themeColor) {
      document.documentElement.style.setProperty(
        '--primary',
        selectedFirm.themeColor
      );
    }

    router.push(`${basePath}/dashboard/overview`);
  };

  if (isNavigating) {
    return <LoadingSpinner />;
  }

  return (
    <div className='from-background to-muted/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4'>
      <div className='w-full max-w-4xl'>
        <div className='mb-8 text-center'>
          <h1 className='mb-2 text-4xl font-bold'>
            Sélectionnez votre entreprise
          </h1>
          <p className='text-muted-foreground'>
            Choisissez l&apos;entreprise à laquelle vous souhaitez vous
            connecter
          </p>
        </div>

        <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {firms.map((firm) => (
            <Card
              key={firm.id}
              className='group cursor-pointer transition-all hover:scale-105 hover:shadow-lg'
              onClick={() => handleFirmClick(firm)}
            >
              <CardContent className='p-6'>
                <div className='flex items-start justify-between'>
                  <div className='flex items-center gap-3'>
                    <div
                      className='flex h-12 w-12 items-center justify-center overflow-hidden rounded-lg text-white'
                      style={{
                        backgroundColor: firm.logo
                          ? 'transparent'
                          : firm.themeColor || 'hsl(var(--primary))'
                      }}
                    >
                      {firm.logo ? (
                        <img
                          src={firm.logo}
                          alt={firm.name}
                          className='h-full w-full object-cover'
                        />
                      ) : (
                        <Building2 className='h-6 w-6' />
                      )}
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold'>{firm.name}</h3>
                      <p className='text-muted-foreground text-sm'>
                        {firm.role}
                      </p>
                    </div>
                  </div>
                  <ChevronRight className='text-muted-foreground group-hover:text-foreground h-5 w-5 transition-colors' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la sélection</AlertDialogTitle>
            <AlertDialogDescription>
              Vous êtes sur le point de vous connecter à{' '}
              <span className='font-semibold'>{selectedFirm?.name}</span>.
              Voulez-vous continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
