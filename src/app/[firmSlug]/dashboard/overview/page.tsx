import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth.config';
import { notFound } from 'next/navigation';

export default async function FirmOverviewPage({
  params
}: {
  params: { firmSlug: string };
}) {
  const session = await getServerSession(authOptions);

  const firm = await db.firm.findUnique({
    where: { slug: params.firmSlug }
  });

  if (!firm) {
    notFound();
  }

  const stats = await db.$transaction([
    db.employee.count({ where: { firmId: firm.id } }),
    db.department.count({ where: { firmId: firm.id } }),
    db.client.count({ where: { firmId: firm.id } })
  ]);

  const [employeeCount, departmentCount, clientCount] = stats;

  return (
    <div className='space-y-6 p-8'>
      <div>
        <h1 className='text-3xl font-bold'>Vue d&apos;ensemble</h1>
        <p className='text-muted-foreground'>
          Bienvenue sur {firm.name}, {session?.user?.name}
        </p>
      </div>

      <div className='grid gap-4 md:grid-cols-3'>
        <div className='bg-card rounded-lg border p-6'>
          <h3 className='text-muted-foreground text-sm font-medium'>
            Employés
          </h3>
          <p className='mt-2 text-3xl font-bold'>{employeeCount}</p>
        </div>

        <div className='bg-card rounded-lg border p-6'>
          <h3 className='text-muted-foreground text-sm font-medium'>
            Départements
          </h3>
          <p className='mt-2 text-3xl font-bold'>{departmentCount}</p>
        </div>

        <div className='bg-card rounded-lg border p-6'>
          <h3 className='text-muted-foreground text-sm font-medium'>Clients</h3>
          <p className='mt-2 text-3xl font-bold'>{clientCount}</p>
        </div>
      </div>

      <div className='bg-card rounded-lg border p-6'>
        <h3 className='mb-4 text-lg font-semibold'>Activité récente</h3>
        <p className='text-muted-foreground'>
          Aucune activité récente à afficher
        </p>
      </div>
    </div>
  );
}
