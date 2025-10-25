import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth.config';
import { notFound } from 'next/navigation';
import DraggableDashboard, {
  DraggableWrapper
} from '@/components/draggable-dashboard';
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardAction,
  CardFooter
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconTrendingUp,
  IconTrendingDown,
  IconUsers,
  IconBuilding,
  IconUserCheck
} from '@tabler/icons-react';

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

      <DraggableDashboard
        showLockToggle={true}
        showHandles={true}
        gridCols={3}
        gap={4}
        defaultLocked={false}
        persistenceKey={`firm-overview-${params.firmSlug}`}
      >
        <DraggableWrapper id='employees' gridSize={{ cols: 1, rows: 1 }}>
          <Card className='from-primary/5 to-card dark:bg-card @container/card h-full bg-gradient-to-t shadow-xs'>
            <CardHeader>
              <CardDescription>Employés</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {employeeCount}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconUsers className='size-4' />
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Total des employés <IconUsers className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Effectif de l&apos;entreprise
              </div>
            </CardFooter>
          </Card>
        </DraggableWrapper>

        <DraggableWrapper id='departments' gridSize={{ cols: 1, rows: 1 }}>
          <Card className='from-primary/5 to-card dark:bg-card @container/card h-full bg-gradient-to-t shadow-xs'>
            <CardHeader>
              <CardDescription>Départements</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {departmentCount}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconBuilding className='size-4' />
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Départements actifs <IconBuilding className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Structure organisationnelle
              </div>
            </CardFooter>
          </Card>
        </DraggableWrapper>

        <DraggableWrapper id='clients' gridSize={{ cols: 1, rows: 1 }}>
          <Card className='from-primary/5 to-card dark:bg-card @container/card h-full bg-gradient-to-t shadow-xs'>
            <CardHeader>
              <CardDescription>Clients</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {clientCount}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconUserCheck className='size-4' />
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Clients enregistrés <IconUserCheck className='size-4' />
              </div>
              <div className='text-muted-foreground'>Base clients totale</div>
            </CardFooter>
          </Card>
        </DraggableWrapper>

        <DraggableWrapper id='activity' gridSize={{ cols: 3, rows: 1 }}>
          <Card className='from-primary/5 to-card dark:bg-card @container/card h-full bg-gradient-to-t shadow-xs'>
            <CardHeader>
              <CardTitle className='text-lg font-semibold'>
                Activité récente
              </CardTitle>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <p className='text-muted-foreground'>
                Aucune activité récente à afficher
              </p>
            </CardFooter>
          </Card>
        </DraggableWrapper>
      </DraggableDashboard>
    </div>
  );
}
