import { getServerSession } from 'next-auth';
import { db } from '@/lib/db';
import { authOptions } from '@/lib/auth/auth.config';
import DraggableDashboard, {
  DraggableWrapper
} from '@/components/draggable-dashboard';
import {
  Card,
  CardHeader,
  CardDescription,
  CardTitle,
  CardAction,
  CardFooter,
  CardContent
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  IconBuilding,
  IconUsers,
  IconUserCheck,
  IconBox,
  IconBuildings,
  IconPackages
} from '@tabler/icons-react';
import Link from 'next/link';

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

      <DraggableDashboard
        showLockToggle={true}
        showHandles={true}
        gridCols={3}
        gap={4}
        defaultLocked={false}
        persistenceKey='admin-overview'
      >
        <DraggableWrapper id='firms' gridSize={{ cols: 1, rows: 1 }}>
          <Card className='from-primary/5 to-card dark:bg-card @container/card h-full bg-gradient-to-t shadow-xs'>
            <CardHeader>
              <CardDescription>Total Entreprises</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {firmCount}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconBuilding className='size-4' />
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Entreprises actives <IconBuilding className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Total des organisations
              </div>
            </CardFooter>
          </Card>
        </DraggableWrapper>

        <DraggableWrapper id='users' gridSize={{ cols: 1, rows: 1 }}>
          <Card className='from-primary/5 to-card dark:bg-card @container/card h-full bg-gradient-to-t shadow-xs'>
            <CardHeader>
              <CardDescription>Total Utilisateurs</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {userCount}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconUsers className='size-4' />
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Comptes utilisateurs <IconUsers className='size-4' />
              </div>
              <div className='text-muted-foreground'>
                Base utilisateurs totale
              </div>
            </CardFooter>
          </Card>
        </DraggableWrapper>

        <DraggableWrapper id='employees' gridSize={{ cols: 1, rows: 1 }}>
          <Card className='from-primary/5 to-card dark:bg-card @container/card h-full bg-gradient-to-t shadow-xs'>
            <CardHeader>
              <CardDescription>Total Employés</CardDescription>
              <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
                {employeeCount}
              </CardTitle>
              <CardAction>
                <Badge variant='outline'>
                  <IconUserCheck className='size-4' />
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className='flex-col items-start gap-1.5 text-sm'>
              <div className='line-clamp-1 flex gap-2 font-medium'>
                Employés enregistrés <IconUserCheck className='size-4' />
              </div>
              <div className='text-muted-foreground'>Total des employés</div>
            </CardFooter>
          </Card>
        </DraggableWrapper>

        <DraggableWrapper id='manage-firms' gridSize={{ cols: 1, rows: 1 }}>
          <Link href='/admin/dashboard/firms'>
            <Card className='flex h-full min-h-32 cursor-pointer items-center rounded-2xl'>
              <CardContent className='flex w-full flex-row items-center justify-between gap-2 p-3 px-6'>
                <div className='flex flex-col gap-1'>
                  <p className='text-lg leading-6 font-bold'>
                    Gérer les entreprises
                  </p>
                </div>
                <div className='hover:bg-primary flex h-16 w-16 items-center justify-center rounded-full border transition-colors hover:text-white'>
                  <IconBuildings className='h-8 w-8' />
                </div>
              </CardContent>
            </Card>
          </Link>
        </DraggableWrapper>

        <DraggableWrapper id='manage-users' gridSize={{ cols: 1, rows: 1 }}>
          <Link href='/admin/dashboard/users'>
            <Card className='hover:bg-accent/50 flex h-full min-h-32 cursor-pointer items-center rounded-2xl transition-colors'>
              <CardContent className='flex w-full flex-row items-center justify-between gap-2 p-3 px-6'>
                <div className='flex flex-col gap-1'>
                  <p className='text-lg leading-6 font-bold'>
                    Gérer les utilisateurs
                  </p>
                </div>
                <div className='hover:bg-primary flex h-16 w-16 items-center justify-center rounded-full border transition-colors hover:text-white'>
                  <IconUsers className='h-8 w-8' />
                </div>
              </CardContent>
            </Card>
          </Link>
        </DraggableWrapper>

        <DraggableWrapper id='assign-modules' gridSize={{ cols: 1, rows: 1 }}>
          <Link href='/admin/dashboard/modules'>
            <Card className='hover:bg-accent/50 flex h-full min-h-32 cursor-pointer items-center rounded-2xl transition-colors'>
              <CardContent className='flex w-full flex-row items-center justify-between gap-2 p-3 px-6'>
                <div className='flex flex-col gap-1'>
                  <p className='text-lg leading-6 font-bold'>
                    Assigner les modules
                  </p>
                </div>
                <div className='hover:bg-primary flex h-16 w-16 items-center justify-center rounded-full border transition-colors hover:text-white'>
                  <IconPackages className='h-8 w-8' />
                </div>
              </CardContent>
            </Card>
          </Link>
        </DraggableWrapper>
      </DraggableDashboard>
    </div>
  );
}
