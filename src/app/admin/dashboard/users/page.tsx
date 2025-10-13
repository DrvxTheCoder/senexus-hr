import { UsersTable } from '@/features/users/components/users-table';

export default function AdminUsersPage() {
  return (
    <div className='space-y-6 p-8'>
      <div>
        <h1 className='text-3xl font-bold'>Gestion des Utilisateurs</h1>
        <p className='text-muted-foreground'>
          Gérez tous les utilisateurs du système
        </p>
      </div>

      <UsersTable />
    </div>
  );
}
