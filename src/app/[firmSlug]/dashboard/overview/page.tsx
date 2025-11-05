'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  IconTrendingUp,
  IconUsers,
  IconUserCheck,
  IconCalendar,
  IconGripVertical
} from '@tabler/icons-react';
import { PieGraph } from '@/modules/hr/components/pie-graph';

interface DashboardStats {
  totalEmployees: number;
  activeEmployees: number;
  totalClients: number;
  growthRate: number;
}

// Sortable card wrapper component
function SortableCard({
  id,
  children
}: {
  id: string;
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  return (
    <div ref={setNodeRef} style={style} className='relative'>
      <div
        {...attributes}
        {...listeners}
        className='hover:bg-muted absolute top-2 right-2 z-10 cursor-grab rounded-md p-2 transition-colors active:cursor-grabbing'
      >
        <IconGripVertical className='text-muted-foreground size-4' />
      </div>
      {children}
    </div>
  );
}

export default function FirmOverviewPage() {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [stats, setStats] = useState<DashboardStats>({
    totalEmployees: 0,
    activeEmployees: 0,
    totalClients: 0,
    growthRate: 0
  });
  const [recentEmployees, setRecentEmployees] = useState<any[]>([]);
  const [recentClients, setRecentClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [firmName, setFirmName] = useState('');
  const [employeeStatusData, setEmployeeStatusData] = useState<
    Array<{ status: string; count: number; fill: string }>
  >([]);
  const [cardOrder, setCardOrder] = useState(['pie-chart', 'recent-data']);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  useEffect(() => {
    fetchDashboardData();
  }, [firmSlug]);

  async function fetchDashboardData() {
    try {
      setLoading(true);

      // Fetch firm by slug
      const firmResponse = await fetch(`/api/firms?slug=${firmSlug}`);
      if (!firmResponse.ok) {
        console.error('Failed to fetch firm');
        setLoading(false);
        return;
      }

      const firms = await firmResponse.json();
      if (!Array.isArray(firms) || firms.length === 0) {
        console.error('No firm found');
        setLoading(false);
        return;
      }

      const firm = firms[0];
      setFirmName(firm.name);
      console.log('Current firm:', {
        id: firm.id,
        name: firm.name,
        slug: firm.slug
      });

      // Fetch employees using API endpoint
      const employeesResponse = await fetch(`/api/employees?firmId=${firm.id}`);
      console.log(
        'Employees API response status:',
        employeesResponse.status,
        employeesResponse.ok
      );
      const employees = employeesResponse.ok
        ? await employeesResponse.json()
        : [];
      console.log('Fetched employees:', employees.length, employees);

      const activeCount = employees.filter(
        (e: any) => e.status === 'ACTIVE'
      ).length;

      // Fetch clients using API endpoint
      const clientsResponse = await fetch(`/api/clients?firmId=${firm.id}`);
      console.log(
        'Clients API response status:',
        clientsResponse.status,
        clientsResponse.ok
      );
      const clients = clientsResponse.ok ? await clientsResponse.json() : [];
      console.log('Fetched clients:', clients.length, clients);

      // Calculate growth rate
      const growthRate =
        employees.length > 0 ? (activeCount / employees.length) * 100 : 0;

      setStats({
        totalEmployees: employees.length,
        activeEmployees: activeCount,
        totalClients: clients.length,
        growthRate: Math.round(growthRate)
      });

      // Get 5 most recent employees
      const sortedEmployees = [...employees].sort((a: any, b: any) => {
        const dateA = a.hireDate ? new Date(a.hireDate).getTime() : 0;
        const dateB = b.hireDate ? new Date(b.hireDate).getTime() : 0;
        return dateB - dateA;
      });
      setRecentEmployees(sortedEmployees.slice(0, 5));

      // Get 5 most recent clients
      const sortedClients = [...clients].sort((a: any, b: any) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setRecentClients(sortedClients.slice(0, 5));

      // Calculate employee distribution by client firms for pie chart
      const employeesByClient: Record<string, { name: string; count: number }> =
        {};
      let unassignedCount = 0;

      employees.forEach((emp: any) => {
        if (emp.assignedClient) {
          const clientId = emp.assignedClient.id;
          if (!employeesByClient[clientId]) {
            employeesByClient[clientId] = {
              name: emp.assignedClient.name,
              count: 0
            };
          }
          employeesByClient[clientId].count++;
        } else {
          unassignedCount++;
        }
      });

      // Create pie chart data with color variations
      const clientColors = [
        'var(--primary)',
        'hsl(var(--primary) / 0.8)',
        'hsl(var(--primary) / 0.6)',
        'hsl(var(--primary) / 0.4)',
        'hsl(var(--primary) / 0.2)'
      ];
      const pieData = Object.values(employeesByClient).map((client, index) => ({
        status: client.name,
        count: client.count,
        fill: clientColors[index % clientColors.length]
      }));

      // Add unassigned employees if any
      if (unassignedCount > 0) {
        pieData.push({
          status: 'Non assignés',
          count: unassignedCount,
          fill: 'hsl(var(--muted-foreground) / 0.3)'
        });
      }

      setEmployeeStatusData(pieData);

      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<
      string,
      {
        variant: 'default' | 'secondary' | 'outline' | 'destructive';
        label: string;
      }
    > = {
      ACTIVE: { variant: 'default', label: 'Actif' },
      ON_LEAVE: { variant: 'secondary', label: 'En congé' },
      INACTIVE: { variant: 'outline', label: 'Inactif' },
      TERMINATED: { variant: 'destructive', label: 'Terminé' }
    };
    const config = variants[status] || variants.ACTIVE;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const formatDate = (date: any) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className='space-y-6 p-8'>
      <div>
        <h1 className='text-3xl font-bold'>Vue d&apos;ensemble</h1>
        <p className='text-muted-foreground'>
          {loading ? 'Chargement...' : `Bienvenue sur ${firmName}`}
        </p>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        <Card className='from-primary/5 to-card dark:bg-card @container/card h-full bg-gradient-to-t shadow-xs'>
          <CardHeader>
            <CardDescription>Employés</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              {loading ? '...' : stats.totalEmployees}
            </CardTitle>
            <CardAction>
              <Badge variant='outline'>
                <IconUsers className='size-4' />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className='flex-col items-start gap-1.5 text-sm'>
            <div className='line-clamp-1 flex gap-2 font-medium'>
              {stats.activeEmployees} actifs{' '}
              <IconTrendingUp className='size-4' />
            </div>
            <div className='text-muted-foreground'>
              Effectif de l&apos;entreprise
            </div>
          </CardFooter>
        </Card>

        <Card className='from-primary/5 to-card dark:bg-card @container/card h-full bg-gradient-to-t shadow-xs'>
          <CardHeader>
            <CardDescription>Clients</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              {loading ? '...' : stats.totalClients}
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

        <Card className='from-primary/5 to-card dark:bg-card @container/card h-full bg-gradient-to-t shadow-xs'>
          <CardHeader>
            <CardDescription>Taux d&apos;activité</CardDescription>
            <CardTitle className='text-2xl font-semibold tabular-nums @[250px]/card:text-3xl'>
              {loading ? '...' : `${stats.growthRate}%`}
            </CardTitle>
            <CardAction>
              <Badge variant='outline'>
                <IconCalendar className='size-4' />
              </Badge>
            </CardAction>
          </CardHeader>
          <CardFooter className='flex-col items-start gap-1.5 text-sm'>
            <div className='line-clamp-1 flex gap-2 font-medium'>
              Employés actifs <IconTrendingUp className='size-4' />
            </div>
            <div className='text-muted-foreground'>
              Pourcentage d&apos;activité
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Charts and Tables Side by Side - Draggable */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
          <div className='grid gap-4 md:grid-cols-2'>
            {cardOrder.map((cardId) => {
              if (cardId === 'pie-chart') {
                return (
                  <SortableCard key={cardId} id={cardId}>
                    <PieGraph data={employeeStatusData} />
                  </SortableCard>
                );
              }

              if (cardId === 'recent-data') {
                return (
                  <SortableCard key={cardId} id={cardId}>
                    <Card>
                      <CardHeader>
                        <CardTitle>Données récentes</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <Tabs defaultValue='employees'>
                          <TabsList className='grid w-full grid-cols-2'>
                            <TabsTrigger value='employees'>
                              Employés
                            </TabsTrigger>
                            <TabsTrigger value='clients'>Clients</TabsTrigger>
                          </TabsList>

                          <TabsContent value='employees' className='mt-4'>
                            {loading ? (
                              <div className='text-muted-foreground py-8 text-center'>
                                Chargement...
                              </div>
                            ) : recentEmployees.length === 0 ? (
                              <div className='text-muted-foreground py-8 text-center'>
                                Aucun employé trouvé
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Employé</TableHead>
                                    <TableHead>Matricule</TableHead>
                                    <TableHead>Statut</TableHead>
                                    <TableHead>Date d&apos;embauche</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {recentEmployees.map((employee) => {
                                    const initials =
                                      `${employee.firstName?.[0] || ''}${employee.lastName?.[0] || ''}`.toUpperCase();
                                    return (
                                      <TableRow key={employee.id}>
                                        <TableCell>
                                          <div className='flex items-center gap-3'>
                                            <Avatar className='h-8 w-8'>
                                              <AvatarImage
                                                src={
                                                  employee.photoUrl ||
                                                  '/assets/img/profile.jpg'
                                                }
                                                alt={`${employee.firstName} ${employee.lastName}`}
                                              />
                                              <AvatarFallback className='text-xs'>
                                                {initials}
                                              </AvatarFallback>
                                            </Avatar>
                                            <span className='font-medium'>
                                              {employee.firstName}{' '}
                                              {employee.lastName}
                                            </span>
                                          </div>
                                        </TableCell>
                                        <TableCell className='font-mono text-sm'>
                                          {employee.matricule}
                                        </TableCell>
                                        <TableCell>
                                          {getStatusBadge(employee.status)}
                                        </TableCell>
                                        <TableCell className='text-muted-foreground'>
                                          {formatDate(employee.hireDate)}
                                        </TableCell>
                                      </TableRow>
                                    );
                                  })}
                                </TableBody>
                              </Table>
                            )}
                          </TabsContent>

                          <TabsContent value='clients' className='mt-4'>
                            {loading ? (
                              <div className='text-muted-foreground py-8 text-center'>
                                Chargement...
                              </div>
                            ) : recentClients.length === 0 ? (
                              <div className='text-muted-foreground py-8 text-center'>
                                Aucun client trouvé
                              </div>
                            ) : (
                              <Table>
                                <TableHeader>
                                  <TableRow>
                                    <TableHead>Nom</TableHead>
                                    <TableHead>Contact</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Date création</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {recentClients.map((client) => (
                                    <TableRow key={client.id}>
                                      <TableCell className='font-medium'>
                                        {client.name}
                                      </TableCell>
                                      <TableCell>
                                        {client.contactName || '-'}
                                      </TableCell>
                                      <TableCell className='text-muted-foreground'>
                                        {client.contactEmail || '-'}
                                      </TableCell>
                                      <TableCell className='text-muted-foreground'>
                                        {formatDate(client.createdAt)}
                                      </TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            )}
                          </TabsContent>
                        </Tabs>
                      </CardContent>
                    </Card>
                  </SortableCard>
                );
              }
              return null;
            })}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}
