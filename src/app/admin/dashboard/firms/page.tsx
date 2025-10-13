import { FirmsTable } from '@/features/firms/components/firms-table';

export default function AdminFirmsPage() {
  return (
    <div className='space-y-6 p-8'>
      <div>
        <h1 className='text-3xl font-bold'>Gestion des Entreprises</h1>
        <p className='text-muted-foreground'>
          Gérez toutes les entreprises du système
        </p>
      </div>

      <FirmsTable />
    </div>
  );
}
