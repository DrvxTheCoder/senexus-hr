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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import {
  Calendar as CalendarIcon,
  AlertTriangle,
  Loader2,
  Info,
  CheckCircle2
} from 'lucide-react';
import { format, differenceInMonths, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface Contract {
  id: string;
  type: string;
  status: string;
  startDate: string;
  endDate: string | null;
  employeeId: string;
  employee: {
    firstName: string;
    lastName: string;
  };
}

interface ContractRenewalDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  onSuccess?: () => void;
}

export function ContractRenewalDialog({
  open,
  onOpenChange,
  contract,
  onSuccess
}: ContractRenewalDialogProps) {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [firmId, setFirmId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [eligibilityInfo, setEligibilityInfo] = React.useState<any>(null);
  const [isEligible, setIsEligible] = React.useState(true);

  const [formData, setFormData] = React.useState({
    startDate: contract?.endDate ? new Date(contract.endDate) : new Date(),
    endDate: null as Date | null,
    salary: '',
    notes: ''
  });

  React.useEffect(() => {
    if (open && contract && firmSlug) {
      fetchFirmId();
    }
  }, [open, contract, firmSlug]);

  React.useEffect(() => {
    if (firmId && contract && open) {
      checkEligibility();
    }
  }, [firmId, contract, open]);

  React.useEffect(() => {
    if (formData.startDate && formData.endDate) {
      validateRenewalDuration();
    }
  }, [formData.startDate, formData.endDate]);

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

  const checkEligibility = async () => {
    if (!contract || !firmId) return;

    try {
      // Fetch all contracts for this employee
      const res = await fetch(
        `/api/employees/${contract.employeeId}/contracts`
      );
      if (res.ok) {
        const contracts = await res.json();

        // Calculate current contract duration
        const currentDuration = differenceInMonths(
          new Date(contract.endDate || new Date()),
          new Date(contract.startDate)
        );

        // Calculate cumulative duration for CDD/INTERIM/PRESTATION
        if (['CDD', 'INTERIM', 'PRESTATION'].includes(contract.type)) {
          const relevantContracts = contracts.filter(
            (c: any) =>
              ['CDD', 'INTERIM', 'PRESTATION'].includes(c.type) &&
              ['ACTIVE', 'RENEWED'].includes(c.status)
          );

          let totalDurationDays = 0;
          for (const c of relevantContracts) {
            if (c.startDate && c.endDate) {
              const duration = differenceInDays(
                new Date(c.endDate),
                new Date(c.startDate)
              );
              totalDurationDays += duration;
            }
          }

          const totalDurationMonths = totalDurationDays / 30;
          const remainingMonths = 24 - totalDurationMonths;

          setEligibilityInfo({
            currentDuration,
            totalDurationMonths: totalDurationMonths.toFixed(1),
            remainingMonths: remainingMonths.toFixed(1),
            maxRenewalMonths: Math.floor(remainingMonths)
          });

          // Check if eligible
          if (currentDuration > 12) {
            setIsEligible(false);
            setError(
              'Ce contrat ne peut pas être renouvelé car sa durée initiale dépasse 12 mois.'
            );
          } else if (remainingMonths <= 0) {
            setIsEligible(false);
            setError(
              "La limite de 24 mois cumulés a été atteinte. L'employé doit être transféré vers une autre entreprise."
            );
          } else {
            setIsEligible(true);
          }
        } else {
          // CDI doesn't have renewal restrictions
          setEligibilityInfo({
            currentDuration,
            message:
              'Les contrats CDI peuvent être renouvelés sans restriction.'
          });
          setIsEligible(true);
        }
      }
    } catch (error) {
      console.error('Error checking eligibility:', error);
    }
  };

  const validateRenewalDuration = () => {
    if (!formData.startDate || !formData.endDate || !eligibilityInfo) return;

    const newDurationDays = differenceInDays(
      formData.endDate,
      formData.startDate
    );
    const newDurationMonths = newDurationDays / 30;

    if (['CDD', 'INTERIM', 'PRESTATION'].includes(contract?.type || '')) {
      const totalAfterRenewal =
        parseFloat(eligibilityInfo.totalDurationMonths) + newDurationMonths;

      if (totalAfterRenewal > 24) {
        setError(
          `La durée totale après renouvellement serait de ${totalAfterRenewal.toFixed(1)} mois, ` +
            `ce qui dépasse la limite de 24 mois. Maximum autorisé: ${eligibilityInfo.remainingMonths} mois.`
        );
      } else {
        setError(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmId || !contract) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate?.toISOString(),
        salary: formData.salary ? parseFloat(formData.salary) : null,
        notes: formData.notes
      };

      const res = await fetch(
        `/api/firms/${firmId}/contracts/${contract.id}/renew`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to renew contract');
      }

      onSuccess?.();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle>Renouveler le contrat</DialogTitle>
          <DialogDescription>
            Renouvellement du contrat de {contract.employee?.firstName || ''}{' '}
            {contract.employee?.lastName || ''}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            {/* Eligibility Information */}
            {eligibilityInfo && (
              <Alert>
                <Info className='h-4 w-4' />
                <AlertDescription>
                  <div className='space-y-1'>
                    <p>
                      <strong>Durée du contrat actuel:</strong>{' '}
                      {eligibilityInfo.currentDuration} mois
                    </p>
                    {eligibilityInfo.totalDurationMonths && (
                      <>
                        <p>
                          <strong>Durée cumulée:</strong>{' '}
                          {eligibilityInfo.totalDurationMonths} mois / 24 mois
                        </p>
                        <p>
                          <strong>Durée restante autorisée:</strong>{' '}
                          {eligibilityInfo.remainingMonths} mois
                        </p>
                      </>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {error && !isEligible && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {error && isEligible && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isEligible && (
              <>
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
                            date &&
                            setFormData({ ...formData, startDate: date })
                          }
                          locale={fr}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  <div className='space-y-2'>
                    <Label>Date de fin *</Label>
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
                          disabled={(date) => date < formData.startDate}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                {/* Salary */}
                <div className='space-y-2'>
                  <Label htmlFor='salary'>
                    Nouveau salaire (optionnel - FCFA)
                  </Label>
                  <Input
                    id='salary'
                    type='number'
                    value={formData.salary}
                    onChange={(e) =>
                      setFormData({ ...formData, salary: e.target.value })
                    }
                    placeholder='Laisser vide pour conserver le salaire actuel'
                  />
                </div>

                {/* Notes */}
                <div className='space-y-2'>
                  <Label htmlFor='notes'>Notes (optionnel)</Label>
                  <Textarea
                    id='notes'
                    value={formData.notes}
                    onChange={(e) =>
                      setFormData({ ...formData, notes: e.target.value })
                    }
                    placeholder='Raison du renouvellement, conditions particulières...'
                    rows={3}
                  />
                </div>
              </>
            )}
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
            <Button type='submit' disabled={loading || !isEligible}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Renouveler
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
