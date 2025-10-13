import { FirmsTable } from '@/features/firms/components/firms-table';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Entreprises | Senexus Multi',
  description: 'Gérer les entreprises et filiales'
};

export default function FirmsPage() {
  return (
    <div className='flex flex-col gap-4 p-4 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Entreprises</h1>
          <p className='text-muted-foreground'>
            Gérer les entreprises et leurs configurations
          </p>
        </div>
      </div>
      <FirmsTable />
    </div>
  );
}
