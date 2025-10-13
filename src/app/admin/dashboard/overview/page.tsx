import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth.config';

export default async function AdminOverviewPage() {
  const session = await getServerSession(authOptions);

  const stats = await db.$transaction([
    db.firm.count(),
    db.user.count(),
    db.employee.count()
  ]);

  const [firmCount, userCount, employeeCount] = stats;

  return (
    <div className='space-y-6 p-8'>
      <div>
        <h1 className='text-3xl font-bold'>Vue d&apos;ensemble</h1>
        <p className='text-muted-foreground'>
          Bienvenue, {session?.user?.name} 👋
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <div className='bg-card rounded-lg border p-6'>
          <h3 className='text-muted-foreground text-sm font-medium'>
            Total Entreprises
          </h3>
          <p className='mt-2 text-3xl font-bold'>{firmCount}</p>
        </div>

        <div className='bg-card rounded-lg border p-6'>
          <h3 className='text-muted-foreground text-sm font-medium'>
            Total Utilisateurs
          </h3>
          <p className='mt-2 text-3xl font-bold'>{userCount}</p>
        </div>

        <div className='bg-card rounded-lg border p-6'>
          <h3 className='text-muted-foreground text-sm font-medium'>
            Total Employés
          </h3>
          <p className='mt-2 text-3xl font-bold'>{employeeCount}</p>
        </div>
      </div>

      <div className='bg-card rounded-lg border p-6'>
        <h3 className='mb-4 text-lg font-semibold'>Actions rapides</h3>
        <div className='grid gap-3 md:grid-cols-2'>
          <a
            href='/admin/dashboard/firms'
            className='hover:bg-accent rounded-md border p-4 transition-colors'
          >
            <h4 className='font-medium'>Gérer les entreprises</h4>
            <p className='text-muted-foreground text-sm'>
              Ajouter, modifier ou supprimer des entreprises
            </p>
          </a>
          <a
            href='/admin/dashboard/users'
            className='hover:bg-accent rounded-md border p-4 transition-colors'
          >
            <h4 className='font-medium'>Gérer les utilisateurs</h4>
            <p className='text-muted-foreground text-sm'>
              Ajouter, modifier ou supprimer des utilisateurs
            </p>
          </a>
          <a
            href='/admin/dashboard/modules'
            className='hover:bg-accent rounded-md border p-4 transition-colors'
          >
            <h4 className='font-medium'>Assigner les modules</h4>
            <p className='text-muted-foreground text-sm'>
              Configurer les modules disponibles par entreprise
            </p>
          </a>
        </div>
      </div>
    </div>
  );
}
