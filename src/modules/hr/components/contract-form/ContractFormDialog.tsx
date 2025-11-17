'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar as CalendarIcon, AlertTriangle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
}

interface Client {
  id: string;
  name: string;
}

interface Firm {
  id: string;
  name: string;
  slug: string;
}

interface ContractFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract?: any;
  employeeId?: string;
  onSuccess?: () => void;
}

export function ContractFormDialog({
  open,
  onOpenChange,
  contract,
  employeeId: preSelectedEmployeeId,
  onSuccess
}: ContractFormDialogProps) {
  const params = useParams();
  const router = useRouter();
  const firmSlug = params.firmSlug as string;

  const [firmId, setFirmId] = React.useState<string | null>(null);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [firms, setFirms] = React.useState<Firm[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [warning, setWarning] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    employeeId: preSelectedEmployeeId || contract?.employeeId || '',
    type: contract?.type || 'CDD',
    startDate: contract?.startDate ? new Date(contract.startDate) : new Date(),
    endDate: contract?.endDate
      ? new Date(contract.endDate)
      : (null as Date | null),
    position: contract?.position || '',
    salary: contract?.salary || '',
    workingHours: contract?.workingHours || '',
    trialPeriodEnd: contract?.trialPeriodEnd
      ? new Date(contract.trialPeriodEnd)
      : (null as Date | null),
    clientId: contract?.clientId || '',
    clientFirmId: contract?.clientFirmId || '',
    notes: contract?.notes || ''
  });

  React.useEffect(() => {
    if (open) {
      fetchFirmId();
    }
  }, [open, firmSlug]);

  React.useEffect(() => {
    if (firmId && open) {
      fetchEmployees();
      fetchClients();
      fetchHoldingFirms();
    }
  }, [firmId, open]);

  React.useEffect(() => {
    validateContractDuration();
  }, [formData.type, formData.startDate, formData.endDate]);

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

  const fetchEmployees = async () => {
    if (!firmId) return;
    try {
      const res = await fetch(`/api/firms/${firmId}/employees`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(data);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchClients = async () => {
    if (!firmId) return;
    try {
      const res = await fetch(`/api/firms/${firmId}/clients?status=ACTIVE`);
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchHoldingFirms = async () => {
    if (!firmId) return;
    try {
      // First get the holding ID
      const firmRes = await fetch(`/api/firms/${firmId}`);
      if (firmRes.ok) {
        const firmData = await firmRes.json();
        const holdingId = firmData.holdingId;

        // Then fetch firms with HR module
        const res = await fetch(`/api/holdings/${holdingId}/firms?module=hr`);
        if (res.ok) {
          const data = await res.json();
          setFirms(data);
        }
      }
    } catch (error) {
      console.error('Error fetching firms:', error);
    }
  };

  const validateContractDuration = () => {
    if (!formData.startDate || !formData.endDate) {
      setWarning(null);
      return;
    }

    const durationMonths = Math.floor(
      (formData.endDate.getTime() - formData.startDate.getTime()) /
        (1000 * 60 * 60 * 24 * 30)
    );

    if (
      ['CDD', 'INTERIM', 'PRESTATION'].includes(formData.type) &&
      durationMonths > 12
    ) {
      setWarning(
        `Attention: La durée du contrat ${formData.type} est de ${durationMonths} mois. ` +
          `Les contrats intérimaires sont généralement limités à 12 mois pour être renouvelables.`
      );
    } else {
      setWarning(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmId) return;

    setLoading(true);
    setError(null);

    try {
      const endpoint = contract
        ? `/api/firms/${firmId}/contracts/${contract.id}`
        : preSelectedEmployeeId
          ? `/api/employees/${preSelectedEmployeeId}/contracts`
          : `/api/firms/${firmId}/contracts`;

      const method = contract ? 'PUT' : 'POST';

      const payload = {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate?.toISOString() || null,
        trialPeriodEnd: formData.trialPeriodEnd?.toISOString() || null,
        salary: formData.salary ? parseFloat(formData.salary) : null,
        workingHours: formData.workingHours
          ? parseInt(formData.workingHours)
          : null,
        clientId: formData.clientId || null,
        clientFirmId: formData.clientFirmId || null
      };

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to save contract');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>
            {contract ? 'Modifier le contrat' : 'Créer un nouveau contrat'}
          </DialogTitle>
          <DialogDescription>
            Remplissez les informations du contrat. Les champs marqués d'un *
            sont obligatoires.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            {error && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {warning && (
              <Alert>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>{warning}</AlertDescription>
              </Alert>
            )}

            {/* Employee Selection */}
            {!preSelectedEmployeeId && !contract && (
              <div className='space-y-2'>
                <Label htmlFor='employee'>Employé *</Label>
                <Select
                  value={formData.employeeId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, employeeId: value })
                  }
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Sélectionner un employé' />
                  </SelectTrigger>
                  <SelectContent>
                    {employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id}>
                        {emp.firstName} {emp.lastName} ({emp.matricule})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Contract Type */}
            <div className='space-y-2'>
              <Label htmlFor='type'>Type de contrat *</Label>
              <Select
                value={formData.type}
                onValueChange={(value) =>
                  setFormData({ ...formData, type: value })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='CDI'>
                    CDI - Contrat à Durée Indéterminée
                  </SelectItem>
                  <SelectItem value='CDD'>
                    CDD - Contrat à Durée Déterminée
                  </SelectItem>
                  <SelectItem value='INTERIM'>
                    INTERIM - Travail temporaire
                  </SelectItem>
                  <SelectItem value='STAGE'>STAGE - Stage</SelectItem>
                  <SelectItem value='PRESTATION'>
                    PRESTATION - Prestation de service
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>Date de début *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.startDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {formData.startDate
                        ? format(formData.startDate, 'PPP', { locale: fr })
                        : 'Sélectionner'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={formData.startDate}
                      onSelect={(date) =>
                        date && setFormData({ ...formData, startDate: date })
                      }
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className='space-y-2'>
                <Label>Date de fin {formData.type !== 'CDI' && '*'}</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.endDate && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {formData.endDate
                        ? format(formData.endDate, 'PPP', { locale: fr })
                        : 'Indéterminée'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={formData.endDate || undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, endDate: date || null })
                      }
                      locale={fr}
                      disabled={(date) => date < formData.startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Position and Salary */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='position'>Poste</Label>
                <Input
                  id='position'
                  value={formData.position}
                  onChange={(e) =>
                    setFormData({ ...formData, position: e.target.value })
                  }
                  placeholder='Ex: Développeur, Comptable...'
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='salary'>Salaire (FCFA)</Label>
                <Input
                  id='salary'
                  type='number'
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  placeholder='Ex: 500000'
                />
              </div>
            </div>

            {/* Working Hours and Trial Period */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='workingHours'>
                  Heures de travail (par semaine)
                </Label>
                <Input
                  id='workingHours'
                  type='number'
                  value={formData.workingHours}
                  onChange={(e) =>
                    setFormData({ ...formData, workingHours: e.target.value })
                  }
                  placeholder='Ex: 40'
                />
              </div>

              <div className='space-y-2'>
                <Label>Fin période d'essai</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      className={cn(
                        'w-full justify-start text-left font-normal',
                        !formData.trialPeriodEnd && 'text-muted-foreground'
                      )}
                    >
                      <CalendarIcon className='mr-2 h-4 w-4' />
                      {formData.trialPeriodEnd
                        ? format(formData.trialPeriodEnd, 'PPP', { locale: fr })
                        : 'Aucune'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0'>
                    <Calendar
                      mode='single'
                      selected={formData.trialPeriodEnd || undefined}
                      onSelect={(date) =>
                        setFormData({
                          ...formData,
                          trialPeriodEnd: date || null
                        })
                      }
                      locale={fr}
                      disabled={(date) => date < formData.startDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Client (optional) */}
            <div className='space-y-2'>
              <Label htmlFor='client'>Client (optionnel)</Label>
              <Select
                value={formData.clientId}
                onValueChange={(value) =>
                  setFormData({ ...formData, clientId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder='Aucun client' />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value=''>Aucun</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Client Firm (for interim assignments) */}
            {['INTERIM', 'PRESTATION'].includes(formData.type) && (
              <div className='space-y-2'>
                <Label htmlFor='clientFirm'>
                  Entreprise cliente (optionnel)
                </Label>
                <Select
                  value={formData.clientFirmId}
                  onValueChange={(value) =>
                    setFormData({ ...formData, clientFirmId: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Aucune entreprise' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value=''>Aucune</SelectItem>
                    {firms
                      .filter((f) => f.id !== firmId)
                      .map((firm) => (
                        <SelectItem key={firm.id} value={firm.id}>
                          {firm.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Notes */}
            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes (optionnel)</Label>
              <Textarea
                id='notes'
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder='Informations supplémentaires...'
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type='submit' disabled={loading}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              {contract ? 'Mettre à jour' : 'Créer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
