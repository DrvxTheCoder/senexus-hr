'use client';

import { useState } from 'react';
import { Building2, ChevronRight, Shield } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useThemeConfig } from '@/components/active-theme';
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
import { TextShimmer } from 'components/motion-primitives/text-shimmer';

type Firm = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  themeColor: string | null;
  role: string;
};

export function FirmSelectionClient({ firms }: { firms: Firm[] }) {
  const { setActiveTheme } = useThemeConfig();
  const [selectedFirm, setSelectedFirm] = useState<Firm | null>(null);
  const [selectedOption, setSelectedOption] = useState<'firm' | 'admin' | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  // Check if user has admin access
  const hasAdminAccess = firms.some(
    (f) => f.role === 'ADMIN' || f.role === 'OWNER'
  );

  const handleFirmClick = (firm: Firm) => {
    // All users go directly to firm view
    setSelectedFirm(firm);
    setSelectedOption('firm');
    setIsDialogOpen(true);
  };

  const handleAdminClick = () => {
    // Go directly to admin panel
    setSelectedOption('admin');
    setIsNavigating(true);
    setActiveTheme('default');
    window.location.href = '/admin/dashboard/overview';
  };

  const handleConfirm = () => {
    if (!selectedFirm) return;

    setIsDialogOpen(false);
    setIsNavigating(true);

    // Apply theme if available
    if (selectedFirm.themeColor) {
      setActiveTheme(selectedFirm.themeColor);
    }

    // Store selected firm in cookie
    document.cookie = `selected_firm_id=${selectedFirm.id}; path=/; max-age=31536000; SameSite=Lax`;

    // Navigate to firm dashboard
    window.location.href = `/${selectedFirm.slug}/dashboard/overview`;
  };

  // Show loading screen for firm navigation
  if (isNavigating && selectedFirm) {
    return (
      <div className='bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm'>
        <div className='flex flex-col items-center gap-6'>
          <div className='relative'>
            {/* Spinning circle border */}
            <div className='border-t-primary h-32 w-32 animate-spin rounded-full border-4 border-transparent' />
            {/* Inner logo container */}
            <div className='absolute inset-0 flex items-center justify-center'>
              <div
                className='flex h-24 w-24 items-center justify-center overflow-hidden rounded-full'
                style={{
                  backgroundColor: selectedFirm.logo
                    ? 'white'
                    : selectedFirm.themeColor || 'hsl(var(--primary))'
                }}
              >
                {selectedFirm.logo ? (
                  <img
                    src={selectedFirm.logo}
                    alt={selectedFirm.name}
                    className='h-full w-full object-contain'
                  />
                ) : (
                  <Building2 className='h-12 w-12 text-white' />
                )}
              </div>
            </div>
          </div>
          <div className='text-center'>
            <p className='text-lg font-semibold'>Connexion en cours...</p>
            <p className='text-muted-foreground text-sm'>
              <TextShimmer>Merci de bien vouloir patienter...</TextShimmer>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Show loading screen for admin navigation
  if (isNavigating && selectedOption === 'admin') {
    return (
      <div className='bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm'>
        <div className='flex flex-col items-center gap-6'>
          <div className='relative'>
            {/* Spinning circle border */}
            <div className='border-t-primary h-32 w-32 animate-spin rounded-full border-4 border-transparent' />
            {/* Inner logo container */}
            <div className='absolute inset-0 flex items-center justify-center'>
              <div className='bg-primary flex h-24 w-24 items-center justify-center overflow-hidden rounded-full'>
                <img
                  src='/assets/img/logos/senexus-mini.png'
                  alt='Senexus'
                  className='h-full w-full rounded-full object-cover'
                />
              </div>
            </div>
          </div>
          <div className='text-center'>
            <p className='text-lg font-semibold'>Connexion en cours...</p>
            <p className='text-muted-foreground text-sm'>
              Préparation de l&apos;administration
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isNavigating) {
    return <LoadingSpinner />;
  }

  return (
    <div className='from-background to-muted/20 flex min-h-screen items-center justify-center bg-gradient-to-br p-4'>
      <div className='w-full max-w-6xl'>
        <div className='mb-8 text-center'>
          <h1 className='mb-2 text-4xl font-bold'>
            Sélectionnez votre entreprise
          </h1>
          <p className='text-muted-foreground'>
            Choisissez l&apos;entreprise à laquelle vous souhaitez vous
            connecter
          </p>
        </div>

        <div className='grid grid-cols-1 flex-wrap justify-center gap-4 md:grid-cols-2 lg:grid-cols-3'>
          {/* Admin Card */}
          {hasAdminAccess && (
            <Card
              className='group border-muted-foreground/20 cursor-pointer border transition-all hover:scale-105 hover:shadow-lg'
              onClick={handleAdminClick}
            >
              <CardContent className='px-6'>
                <div className='flex flex-row items-center justify-between gap-2'>
                  <div className='flex items-center gap-3'>
                    <div className='flex h-12 w-12 items-center justify-center rounded-lg text-white'>
                      <img
                        src='/assets/img/logos/senexus-mini.png'
                        className='h-full w-full rounded-lg object-cover'
                      />
                    </div>
                    <div>
                      <h3 className='text-lg font-semibold'>Administration</h3>
                    </div>
                  </div>
                  <div className='border-muted-foreground/20 flex items-center justify-center rounded-full border p-2 transition-all'>
                    <ChevronRight className='text-muted-foreground group-hover:text-foreground h-5 w-5 transition-colors' />
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Firm Cards */}
          {firms.map((firm) => (
            <Card
              key={firm.id}
              className='group cursor-pointer transition-all hover:scale-105 hover:shadow-lg'
              onClick={() => handleFirmClick(firm)}
            >
              <CardContent className='px-6'>
                <div className='flex flex-row items-center justify-between gap-2'>
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
                      {/* <p className='text-muted-foreground text-sm'>
                        {firm.role}
                      </p> */}
                    </div>
                  </div>
                  <div className='border-muted-foreground/20 flex items-center justify-center rounded-full border p-2 transition-all'>
                    <ChevronRight className='text-muted-foreground group-hover:text-foreground h-5 w-5 transition-colors' />
                  </div>
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
              Continuer ?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setSelectedOption(null);
                setSelectedFirm(null);
              }}
            >
              Annuler
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
