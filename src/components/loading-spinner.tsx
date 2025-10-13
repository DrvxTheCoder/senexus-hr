'use client';

import { useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';

export function LoadingSpinner() {
  const [dots, setDots] = useState('');

  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? '' : prev + '.'));
    }, 500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className='bg-background/80 fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm'>
      <div className='flex flex-col items-center gap-4'>
        <div className='relative'>
          <div className='border-muted h-24 w-24 animate-pulse rounded-full border-4' />
          <div className='absolute inset-0 flex items-center justify-center'>
            <Building2 className='text-primary h-12 w-12 animate-bounce' />
          </div>
        </div>
        <div className='text-center'>
          <p className='text-lg font-semibold'>Chargement{dots}</p>
          <p className='text-muted-foreground text-sm'>
            Veuillez patienter pendant que nous préparons votre espace
          </p>
        </div>
      </div>
    </div>
  );
}
