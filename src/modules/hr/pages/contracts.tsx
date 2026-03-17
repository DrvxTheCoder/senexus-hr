'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Building2,
  User,
  MoreVertical,
  Eye,
  Edit,
  XCircle,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  LoaderIcon
} from 'lucide-react';
import { format, differenceInMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { TextShimmer } from 'components/motion-primitives/text-shimmer';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious
} from '@/components/ui/pagination';
import {
  ContractFormDialog,
  ContractRenewalDialog,
  ContractTerminationDialog
} from '@/modules/hr/components/contract-form';

interface Contract {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  position: string | null;
  salary: string | null;
  isActive: boolean;
  isVise: boolean;
  renewedFromId: string | null;
  employeeId: string;
  employee: {
    id: string;
    firstName: string;
    lastName: string;
    matricule: string;
    photoUrl: string | null;
  };
  clientFirm: {
    id: string;
    name: string;
  } | null;
}

interface ContractStats {
  active: number;
  expiringSoon: number;
  expired: number;
  total: number;
  vise: number;
  nonVise: number;
}

export default function ContractsPage() {
  const params = useParams();
  const router = useRouter();
  const firmSlug = params.firmSlug as string;
  const moduleSlug = params.moduleSlug as string;

  const [contracts, setContracts] = React.useState<Contract[]>([]);
  const [stats, setStats] = React.useState<ContractStats>({
    active: 0,
    expiringSoon: 0,
    expired: 0,
    total: 0,
    vise: 0,
    nonVise: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [page, setPage] = React.useState(1);
  const [totalPages, setTotalPages] = React.useState(1);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState('');

  const [firmId, setFirmId] = React.useState<string | null>(null);

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);
  const [isRenewDialogOpen, setIsRenewDialogOpen] = React.useState(false);
  const [isTerminateDialogOpen, setIsTerminateDialogOpen] =
    React.useState(false);
  const [selectedContract, setSelectedContract] =
    React.useState<Contract | null>(null);

  React.useEffect(() => {
    fetchFirmId();
  }, [firmSlug]);

  React.useEffect(() => {
    if (firmId) {
      setPage(1); // reset to first page on filter change
      fetchContracts();
      fetchStats();
    }
  }, [firmId, statusFilter, typeFilter, searchQuery]);

  React.useEffect(() => {
    if (firmId) {
      fetchContracts();
    }
  }, [firmId, page]);

  const fetchFirmId = async () => {
    try {
      const res = await fetch(`/api/firms/by-slug/${firmSlug}`);
      if (res.ok) {
        const data = await res.json();
        setFirmId(data.id);
      }
    } catch (error) {
      console.error('Error fetching firm:', error);
    }
  };

  const fetchContracts = async () => {
    if (!firmId) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10'
      });

      if (statusFilter) params.append('status', statusFilter);
      if (typeFilter) params.append('type', typeFilter);
      if (searchQuery) params.append('search', searchQuery);

      const res = await fetch(`/api/firms/${firmId}/contracts?${params}`);
      if (res.ok) {
        const data = await res.json();
        setContracts(data.contracts);
        setTotalPages(data.pagination.totalPages);
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    if (!firmId) return;

    try {
      const res = await fetch(`/api/firms/${firmId}/contracts?limit=1000`);
      if (res.ok) {
        const data = await res.json();
        const allContracts: Contract[] = data.contracts;
        const now = new Date();

        // Use computed status (not DB status) for accurate stats
        const active = allContracts.filter((c) => {
          const effective = getEffectiveStatus(c);
          return effective === 'ACTIVE';
        }).length;

        const expiringSoon = allContracts.filter((c) => {
          const effective = getEffectiveStatus(c);
          return effective === 'EXPIRING_SOON' || effective === 'EXPIRING';
        }).length;

        const expired = allContracts.filter((c) => {
          const effective = getEffectiveStatus(c);
          return effective === 'EXPIRED';
        }).length;

        const vise = allContracts.filter((c) => c.isVise).length;
        const nonVise = allContracts.filter((c) => !c.isVise).length;

        setStats({
          active,
          expiringSoon,
          expired,
          total: allContracts.length,
          vise,
          nonVise
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  // Compute the effective display status from dates (ignores stale DB status for ACTIVE contracts)
  const getEffectiveStatus = (contract: Contract) => {
    if (contract.status === 'TERMINATED') return 'TERMINATED';
    if (contract.status === 'RENEWED') return 'RENEWED';

    // For ACTIVE (and EXPIRED in DB), recompute from endDate
    if (!contract.endDate) return 'ACTIVE'; // CDI — no end date

    const days = differenceInDays(new Date(contract.endDate), new Date());
    if (days < 0) return 'EXPIRED';
    if (days <= 30) return 'EXPIRING_SOON';
    if (days <= 90) return 'EXPIRING';
    return 'ACTIVE';
  };

  const getStatusBadge = (contract: Contract) => {
    const effective = getEffectiveStatus(contract);
    const config: Record<string, { color: string; label: string }> = {
      ACTIVE: {
        color: 'bg-green-100 text-green-800 border-green-200',
        label: 'Actif'
      },
      EXPIRING: {
        color: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        label: 'Expire bientôt'
      },
      EXPIRING_SOON: {
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        label: 'Urgent'
      },
      EXPIRED: {
        color: 'bg-red-100 text-red-800 border-red-200',
        label: 'Expiré'
      },
      TERMINATED: {
        color: 'bg-gray-100 text-gray-800 border-gray-200',
        label: 'Résilié'
      },
      RENEWED: {
        color: 'bg-blue-100 text-blue-800 border-blue-200',
        label: 'Renouvelé'
      }
    };
    const { color, label } = config[effective] ?? config.ACTIVE;
    return (
      <Badge className={`${color} border`}>
        {effective === 'ACTIVE' && <CheckCircle2 className='mr-1 h-3 w-3' />}
        {(effective === 'EXPIRED' || effective === 'TERMINATED') && (
          <XCircle className='mr-1 h-3 w-3' />
        )}
        {(effective === 'EXPIRING' || effective === 'EXPIRING_SOON') && (
          <AlertTriangle className='mr-1 h-3 w-3' />
        )}
        {effective === 'RENEWED' && <RefreshCw className='mr-1 h-3 w-3' />}
        {label}
      </Badge>
    );
  };

  const getContractTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      CDI: 'bg-green-100 text-green-800 border-green-200',
      CDD: 'bg-blue-100 text-blue-800 border-blue-200',
      INTERIM: 'bg-orange-100 text-orange-800 border-orange-200',
      STAGE: 'bg-purple-100 text-purple-800 border-purple-200',
      PRESTATION: 'bg-gray-100 text-gray-800 border-gray-200'
    };
    return <Badge className={`${colors[type] || ''} border`}>{type}</Badge>;
  };

  const getContractDuration = (startDate: string, endDate: string | null) => {
    if (!endDate) return 'Indéterminé';

    const months = differenceInMonths(new Date(endDate), new Date(startDate));
    if (months === 0) {
      const days = differenceInDays(new Date(endDate), new Date(startDate));
      return `${days} jour${days > 1 ? 's' : ''}`;
    }
    return `${months} mois`;
  };

  const getDaysLabel = (contract: Contract) => {
    if (!contract.endDate) return null;
    const days = differenceInDays(new Date(contract.endDate), new Date());
    const effective = getEffectiveStatus(contract);
    if (effective === 'EXPIRED') {
      return (
        <div className='flex items-center gap-1 text-xs text-red-600'>
          <AlertTriangle className='h-3 w-3' />
          Expiré depuis {Math.abs(days)} jour{Math.abs(days) > 1 ? 's' : ''}
        </div>
      );
    }
    if (effective === 'EXPIRING_SOON' || effective === 'EXPIRING') {
      return (
        <div className='flex items-center gap-1 text-xs text-orange-600'>
          <AlertTriangle className='h-3 w-3' />
          Expire dans {days} jour{days > 1 ? 's' : ''}
        </div>
      );
    }
    return null;
  };

  if (loading && contracts.length === 0) {
    return (
      <div className='border-muted-foreground/10 flex h-[calc(90vh-64px)] items-center justify-center rounded-lg border-2 border-dashed p-6'>
        <div className='flex h-full flex-col items-center justify-center text-center'>
          <LoaderIcon className='mx-auto mb-4 size-12 animate-spin md:size-12' />
          <h1 className='text-lg font-medium md:text-xl'>
            <TextShimmer>Chargement des contrats...</TextShimmer>
          </h1>
        </div>
      </div>
    );
  }

  return (
    <div className='flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h1 className='text-3xl font-bold tracking-tight'>Contrats</h1>
          <p className='text-muted-foreground mt-1'>
            Gestion des contrats des employés
          </p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className='mr-2 h-4 w-4' />
          Nouveau contrat
        </Button>
      </div>

      {/* Stats Cards */}
      <div className='grid gap-4 md:grid-cols-3 lg:grid-cols-6'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>
              Contrats actifs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-green-600'>
              {stats.active}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>En cours</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>À renouveler</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-orange-600'>
              {stats.expiringSoon}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Dans les 30 jours
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Expirés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-red-600'>
              {stats.expired}
            </div>
            <p className='text-muted-foreground mt-1 text-xs'>
              Nécessitent action
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{stats.total}</div>
            <p className='text-muted-foreground mt-1 text-xs'>Tous statuts</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Visés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-blue-600'>{stats.vise}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium'>Non-visés</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-yellow-600'>
              {stats.nonVise}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className='pt-6'>
          <div className='flex flex-col gap-4 md:flex-row md:items-center'>
            <div className='relative flex-1'>
              <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
              <Input
                placeholder='Rechercher par nom ou matricule...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='pl-10'
              />
            </div>
            <Select
              value={statusFilter || 'ALL'}
              onValueChange={(val) => setStatusFilter(val === 'ALL' ? '' : val)}
            >
              <SelectTrigger className='w-full md:w-[200px]'>
                <SelectValue placeholder='Filtrer par statut' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>Tous les statuts</SelectItem>
                <SelectItem value='ACTIVE'>Actif</SelectItem>
                <SelectItem value='EXPIRING'>
                  Expire bientôt (&lt;90j)
                </SelectItem>
                <SelectItem value='EXPIRED'>Expiré</SelectItem>
                <SelectItem value='TERMINATED'>Terminé</SelectItem>
                <SelectItem value='RENEWED'>Renouvelé</SelectItem>
              </SelectContent>
            </Select>
            <Select
              value={typeFilter || 'ALL'}
              onValueChange={(val) => setTypeFilter(val === 'ALL' ? '' : val)}
            >
              <SelectTrigger className='w-full md:w-[200px]'>
                <SelectValue placeholder='Filtrer par type' />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value='ALL'>Tous les types</SelectItem>
                <SelectItem value='CDI'>CDI</SelectItem>
                <SelectItem value='CDD'>CDD</SelectItem>
                <SelectItem value='INTERIM'>INTERIM</SelectItem>
                <SelectItem value='STAGE'>STAGE</SelectItem>
                <SelectItem value='PRESTATION'>PRESTATION</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contract Cards Grid */}
      {contracts.length === 0 ? (
        <Card>
          <CardContent className='flex flex-col items-center justify-center py-16'>
            <FileText className='text-muted-foreground mb-4 h-12 w-12' />
            <h3 className='mb-2 text-lg font-semibold'>Aucun contrat trouvé</h3>
            <p className='text-muted-foreground mb-4 text-center text-sm'>
              {searchQuery || statusFilter || typeFilter
                ? 'Aucun contrat ne correspond à vos critères de recherche.'
                : 'Commencez par créer un nouveau contrat.'}
            </p>
            {/* <ContractFormDialog
                open={isCreateDialogOpen}
                onOpenChange={setIsCreateDialogOpen}
                onSuccess={fetchContracts}
              /> */}
          </CardContent>
        </Card>
      ) : (
        <>
          <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
            {contracts.map((contract) => {
              const initials =
                `${contract.employee.firstName[0]}${contract.employee.lastName[0]}`.toUpperCase();
              return (
                <Card
                  key={contract.id}
                  className='transition-shadow hover:shadow-lg'
                >
                  <CardHeader className='pb-3'>
                    <div className='flex items-start justify-between'>
                      <div className='flex flex-1 items-center gap-3'>
                        <Avatar className='h-10 w-10'>
                          <AvatarImage src={contract.employee.photoUrl || ''} />
                          <AvatarFallback className='text-sm'>
                            {initials}
                          </AvatarFallback>
                        </Avatar>
                        <div className='min-w-0 flex-1'>
                          <CardTitle className='truncate text-sm font-semibold'>
                            {contract.employee.firstName}{' '}
                            {contract.employee.lastName}
                          </CardTitle>
                          <p className='text-muted-foreground truncate text-xs'>
                            {contract.employee.matricule}
                          </p>
                        </div>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='icon'
                            className='h-8 w-8'
                          >
                            <MoreVertical className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedContract(contract);
                              setIsCreateDialogOpen(true);
                            }}
                          >
                            <Eye className='mr-2 h-4 w-4' />
                            Voir détails
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedContract(contract);
                              setIsCreateDialogOpen(true);
                            }}
                          >
                            <Edit className='mr-2 h-4 w-4' />
                            Modifier
                          </DropdownMenuItem>
                          {['ACTIVE', 'EXPIRING', 'EXPIRING_SOON'].includes(
                            getEffectiveStatus(contract)
                          ) && (
                            <>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setIsRenewDialogOpen(true);
                                }}
                              >
                                <RefreshCw className='mr-2 h-4 w-4' />
                                Renouveler
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedContract(contract);
                                  setIsTerminateDialogOpen(true);
                                }}
                              >
                                <XCircle className='mr-2 h-4 w-4' />
                                Résilier
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    <div className='flex flex-wrap items-center gap-2'>
                      {getContractTypeBadge(contract.type)}
                      {getStatusBadge(contract)}
                      <Badge
                        className={
                          contract.isVise
                            ? 'border border-blue-200 bg-blue-100 text-blue-800'
                            : 'border border-yellow-200 bg-yellow-100 text-yellow-800'
                        }
                      >
                        {contract.isVise ? 'Visé' : 'Non-visé'}
                      </Badge>
                    </div>

                    {contract.position && (
                      <div className='flex items-center gap-2 text-sm'>
                        <User className='text-muted-foreground h-4 w-4' />
                        <span className='truncate'>{contract.position}</span>
                      </div>
                    )}

                    <div className='flex items-center gap-2 text-sm'>
                      <Calendar className='text-muted-foreground h-4 w-4' />
                      <span className='text-muted-foreground'>
                        {format(new Date(contract.startDate), 'dd/MM/yyyy')} →{' '}
                        {contract.endDate
                          ? format(new Date(contract.endDate), 'dd/MM/yyyy')
                          : 'Indét.'}
                      </span>
                    </div>

                    <div className='flex items-center justify-between text-sm'>
                      <span className='text-muted-foreground'>Durée:</span>
                      <span className='font-medium'>
                        {getContractDuration(
                          contract.startDate,
                          contract.endDate
                        )}
                      </span>
                    </div>

                    {contract.clientFirm && (
                      <div className='flex items-center gap-2 text-sm'>
                        <Building2 className='text-muted-foreground h-4 w-4' />
                        <span className='text-muted-foreground truncate'>
                          {contract.clientFirm.name}
                        </span>
                      </div>
                    )}

                    {getDaysLabel(contract)}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className='flex justify-center'>
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      onClick={() => setPage(Math.max(1, page - 1))}
                      className={
                        page === 1
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (p) => (
                      <PaginationItem key={p}>
                        <PaginationLink
                          onClick={() => setPage(p)}
                          isActive={page === p}
                          className='cursor-pointer'
                        >
                          {p}
                        </PaginationLink>
                      </PaginationItem>
                    )
                  )}
                  <PaginationItem>
                    <PaginationNext
                      onClick={() => setPage(Math.min(totalPages, page + 1))}
                      className={
                        page === totalPages
                          ? 'pointer-events-none opacity-50'
                          : 'cursor-pointer'
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* Dialogs */}
      <ContractFormDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        contract={selectedContract}
        onSuccess={() => {
          fetchContracts();
          fetchStats();
          setSelectedContract(null);
        }}
      />

      <ContractRenewalDialog
        open={isRenewDialogOpen}
        onOpenChange={setIsRenewDialogOpen}
        contract={selectedContract}
        onSuccess={() => {
          fetchContracts();
          fetchStats();
          setSelectedContract(null);
        }}
      />

      <ContractTerminationDialog
        open={isTerminateDialogOpen}
        onOpenChange={setIsTerminateDialogOpen}
        contract={selectedContract}
        onSuccess={() => {
          fetchContracts();
          fetchStats();
          setSelectedContract(null);
        }}
      />
    </div>
  );
}
