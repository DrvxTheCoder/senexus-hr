import { UsersTable } from '@/features/users/components/users-table';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Utilisateurs | Senexus Multi',
  description: 'Gérer les utilisateurs du système'
};

export default function UsersPage() {
  return (
    <div className='flex flex-col gap-4 p-4 md:p-8'>
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Utilisateurs</h1>
          <p className='text-muted-foreground'>
            Gérer les comptes utilisateurs et les accès
          </p>
        </div>
      </div>
      <UsersTable />
    </div>
  );
}
