'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
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
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import {
  Calendar as CalendarIcon,
  Loader2,
  Check,
  ChevronsUpDown
} from 'lucide-react';
import { format, differenceInBusinessDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { Checkbox } from '@/components/ui/checkbox';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
}

interface LeaveRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function LeaveRequestDialog({
  open,
  onOpenChange,
  onSuccess
}: LeaveRequestDialogProps) {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [firmId, setFirmId] = React.useState<string | null>(null);
  const [employees, setEmployees] = React.useState<Employee[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [employeeComboOpen, setEmployeeComboOpen] = React.useState(false);

  const [formData, setFormData] = React.useState({
    employeeId: '',
    leaveType: 'ANNUAL',
    startDate: null as Date | null,
    endDate: null as Date | null,
    reason: '',
    isPaid: true,
    isJustified: false,
    justification: '',
    supportingDoc: ''
  });

  const totalDays = React.useMemo(() => {
    if (!formData.startDate || !formData.endDate) return 0;
    return differenceInBusinessDays(formData.endDate, formData.startDate) + 1;
  }, [formData.startDate, formData.endDate]);

  React.useEffect(() => {
    if (open && firmSlug) {
      fetchFirmId();
    }
  }, [open, firmSlug]);

  React.useEffect(() => {
    if (firmId && open) {
      fetchEmployees();
    }
  }, [firmId, open]);

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
    try {
      const res = await fetch(`/api/employees?firmId=${firmId}`);
      if (res.ok) {
        const data = await res.json();
        setEmployees(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmId) return;

    if (!formData.employeeId || !formData.startDate || !formData.endDate) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (totalDays <= 0) {
      toast.error('La date de fin doit être postérieure à la date de début');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        employeeId: formData.employeeId,
        leaveType: formData.leaveType,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
        reason: formData.reason,
        isPaid: formData.isPaid,
        isJustified: formData.isJustified,
        justification: formData.justification || null,
        supportingDoc: formData.supportingDoc || null
      };

      const res = await fetch(`/api/firms/${firmId}/leaves`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Échec de la création de la demande');
      }

      toast.success('Demande de congé créée avec succès');
      onSuccess?.();
      onOpenChange(false);

      // Reset form
      setFormData({
        employeeId: '',
        leaveType: 'ANNUAL',
        startDate: null,
        endDate: null,
        reason: '',
        isPaid: true,
        isJustified: false,
        justification: '',
        supportingDoc: ''
      });
    } catch (err: any) {
      toast.error(err.message || 'Échec de la création de la demande');
    } finally {
      setLoading(false);
    }
  };

  const selectedEmployee = employees.find((e) => e.id === formData.employeeId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-h-[90vh] max-w-2xl overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Nouvelle demande de congé</DialogTitle>
          <DialogDescription>
            Créer une demande de congé pour un employé
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            {/* Employee Selection */}
            <div className='space-y-2'>
              <Label>
                Employé <span className='text-destructive'>*</span>
              </Label>
              <Popover
                open={employeeComboOpen}
                onOpenChange={setEmployeeComboOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant='outline'
                    role='combobox'
                    className='w-full justify-between'
                  >
                    {selectedEmployee
                      ? `${selectedEmployee.firstName} ${selectedEmployee.lastName} (${selectedEmployee.matricule})`
                      : 'Sélectionner un employé'}
                    <ChevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-full p-0'>
                  <Command>
                    <CommandInput placeholder='Rechercher...' />
                    <CommandList>
                      <CommandEmpty>Aucun employé trouvé</CommandEmpty>
                      <CommandGroup>
                        {employees.map((employee) => (
                          <CommandItem
                            key={employee.id}
                            value={`${employee.firstName} ${employee.lastName} ${employee.matricule}`}
                            onSelect={() => {
                              setFormData({
                                ...formData,
                                employeeId: employee.id
                              });
                              setEmployeeComboOpen(false);
                            }}
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                formData.employeeId === employee.id
                                  ? 'opacity-100'
                                  : 'opacity-0'
                              )}
                            />
                            {employee.firstName} {employee.lastName} (
                            {employee.matricule})
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>

            {/* Leave Type */}
            <div className='space-y-2'>
              <Label>
                Type de congé <span className='text-destructive'>*</span>
              </Label>
              <Select
                value={formData.leaveType}
                onValueChange={(value) =>
                  setFormData({ ...formData, leaveType: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value='ANNUAL'>Congés annuels</SelectItem>
                  <SelectItem value='SICK'>Congé maladie</SelectItem>
                  <SelectItem value='MATERNITY'>Congé maternité</SelectItem>
                  <SelectItem value='PATERNITY'>Congé paternité</SelectItem>
                  <SelectItem value='UNPAID'>Congé sans solde</SelectItem>
                  <SelectItem value='SPECIAL'>Congé spécial</SelectItem>
                  <SelectItem value='COMPENSATORY'>
                    Congé compensatoire
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dates */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label>
                  Date de début <span className='text-destructive'>*</span>
                </Label>
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
                      selected={formData.startDate || undefined}
                      onSelect={(date) =>
                        setFormData({ ...formData, startDate: date || null })
                      }
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </div>

              <div className='space-y-2'>
                <Label>
                  Date de fin <span className='text-destructive'>*</span>
                </Label>
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
                        : 'Sélectionner'}
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
                      disabled={(date) =>
                        formData.startDate ? date < formData.startDate : false
                      }
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {totalDays > 0 && (
              <div className='text-muted-foreground text-sm'>
                Durée:{' '}
                <span className='font-semibold'>{totalDays} jour(s)</span>{' '}
                (jours ouvrables)
              </div>
            )}

            {/* Reason */}
            <div className='space-y-2'>
              <Label htmlFor='reason'>Raison</Label>
              <Textarea
                id='reason'
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder='Motif de la demande...'
                rows={3}
              />
            </div>

            {/* Checkboxes */}
            <div className='space-y-3'>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='isPaid'
                  checked={formData.isPaid}
                  onCheckedChange={(checked) =>
                    setFormData({ ...formData, isPaid: checked as boolean })
                  }
                />
                <Label htmlFor='isPaid' className='cursor-pointer font-normal'>
                  Congé payé
                </Label>
              </div>

              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='isJustified'
                  checked={formData.isJustified}
                  onCheckedChange={(checked) =>
                    setFormData({
                      ...formData,
                      isJustified: checked as boolean
                    })
                  }
                />
                <Label
                  htmlFor='isJustified'
                  className='cursor-pointer font-normal'
                >
                  Congé justifié
                </Label>
              </div>
            </div>

            {/* Justification */}
            {formData.isJustified && (
              <div className='space-y-2'>
                <Label htmlFor='justification'>Justification</Label>
                <Textarea
                  id='justification'
                  value={formData.justification}
                  onChange={(e) =>
                    setFormData({ ...formData, justification: e.target.value })
                  }
                  placeholder='Détails de la justification...'
                  rows={2}
                />
              </div>
            )}

            {/* Supporting Document */}
            <div className='space-y-2'>
              <Label htmlFor='supportingDoc'>Document justificatif (URL)</Label>
              <Input
                id='supportingDoc'
                type='text'
                value={formData.supportingDoc}
                onChange={(e) =>
                  setFormData({ ...formData, supportingDoc: e.target.value })
                }
                placeholder='https://...'
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
              Créer la demande
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
