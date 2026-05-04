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
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, Loader2, ArrowRightLeft, Info } from 'lucide-react';

interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
}

interface Firm {
  id: string;
  name: string;
  slug: string;
}

interface Client {
  id: string;
  name: string;
}

interface EmployeeBulkTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employees: Employee[];
  onSuccess?: (succeededCount: number) => void;
}

export function EmployeeBulkTransferDialog({
  open,
  onOpenChange,
  employees,
  onSuccess
}: EmployeeBulkTransferDialogProps) {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [firmId, setFirmId] = React.useState<string | null>(null);
  const [holdingId, setHoldingId] = React.useState<string | null>(null);
  const [firms, setFirms] = React.useState<Firm[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [failures, setFailures] = React.useState<
    { employee: Employee; message: string }[]
  >([]);

  const [formData, setFormData] = React.useState({
    toFirmId: '',
    clientId: '',
    transferDate: new Date().toISOString().split('T')[0],
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: '',
    notes: ''
  });

  React.useEffect(() => {
    if (open) {
      fetchFirmAndHolding();
      setFailures([]);
      setError(null);
    }
  }, [open, firmSlug]);

  React.useEffect(() => {
    if (holdingId && open) {
      fetchHoldingFirms();
    }
  }, [holdingId, open]);

  React.useEffect(() => {
    if (formData.toFirmId && open) {
      fetchClientsForFirm(formData.toFirmId);
    }
  }, [formData.toFirmId, open]);

  const fetchFirmAndHolding = async () => {
    try {
      const res = await fetch(`/api/firms/by-slug/${firmSlug}`);
      if (res.ok) {
        const data = await res.json();
        setFirmId(data.id);
        setHoldingId(data.holdingId);
      }
    } catch (error) {
      console.error('Error fetching firm:', error);
    }
  };

  const fetchHoldingFirms = async () => {
    if (!holdingId) return;
    try {
      const res = await fetch(`/api/holdings/${holdingId}/firms?module=hr`);
      if (res.ok) {
        const data = await res.json();
        setFirms(data.filter((f: Firm) => f.id !== firmId));
      }
    } catch (error) {
      console.error('Error fetching firms:', error);
    }
  };

  const fetchClientsForFirm = async (targetFirmId: string) => {
    try {
      const res = await fetch(
        `/api/firms/${targetFirmId}/clients?status=ACTIVE`
      );
      if (res.ok) {
        const data = await res.json();
        setClients(data);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      toFirmId: '',
      clientId: '',
      transferDate: new Date().toISOString().split('T')[0],
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: '',
      notes: ''
    });
    setFailures([]);
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmId || employees.length === 0) return;

    if (!formData.toFirmId) {
      setError("Veuillez sélectionner l'entreprise de destination");
      return;
    }

    if (!formData.reason.trim()) {
      setError('Veuillez indiquer la raison du transfert');
      return;
    }

    setLoading(true);
    setError(null);
    setFailures([]);

    const results = await Promise.all(
      employees.map(async (employee) => {
        const payload = {
          employeeId: employee.id,
          fromFirmId: firmId,
          toFirmId: formData.toFirmId,
          clientId: formData.clientId || null,
          transferDate: new Date(formData.transferDate).toISOString(),
          effectiveDate: new Date(formData.effectiveDate).toISOString(),
          reason: formData.reason,
          notes: formData.notes,
          status: 'PENDING'
        };

        try {
          const res = await fetch(`/api/firms/${firmId}/transfers`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
          });

          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            return {
              employee,
              ok: false,
              message: data.error || 'Échec de la demande'
            };
          }

          return { employee, ok: true, message: '' };
        } catch (err: any) {
          return {
            employee,
            ok: false,
            message: err?.message || 'Erreur réseau'
          };
        }
      })
    );

    const failed = results.filter((r) => !r.ok);
    const succeeded = results.length - failed.length;

    setLoading(false);

    if (failed.length > 0) {
      setFailures(
        failed.map((f) => ({ employee: f.employee, message: f.message }))
      );
    }

    if (succeeded > 0) {
      onSuccess?.(succeeded);
    }

    if (failed.length === 0) {
      onOpenChange(false);
      resetForm();
    }
  };

  if (employees.length === 0) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) resetForm();
      }}
    >
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ArrowRightLeft className='h-5 w-5' />
            Transférer {employees.length} employé(s)
          </DialogTitle>
          <DialogDescription>
            Créer une demande de transfert pour les employés sélectionnés vers
            une autre entreprise du groupe.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            <Alert>
              <Info className='h-4 w-4' />
              <AlertDescription>
                Une demande de transfert sera créée pour chaque employé. Si un
                employé a déjà une demande en attente, sa demande sera ignorée.
                Les conflits de matricule devront être résolus individuellement
                avant la finalisation.
              </AlertDescription>
            </Alert>

            {/* Selected employees list */}
            <div className='space-y-2'>
              <Label>Employés sélectionnés ({employees.length})</Label>
              <ScrollArea className='h-32 rounded-md border'>
                <div className='divide-y'>
                  {employees.map((emp) => (
                    <div
                      key={emp.id}
                      className='flex items-center justify-between px-3 py-2 text-sm'
                    >
                      <span>
                        {emp.firstName} {emp.lastName}
                      </span>
                      <span className='text-muted-foreground font-mono text-xs'>
                        {emp.matricule}
                      </span>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {error && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {failures.length > 0 && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>
                  <div className='font-medium'>
                    {failures.length} demande(s) en échec :
                  </div>
                  <ul className='mt-2 list-disc space-y-1 pl-4 text-sm'>
                    {failures.map((f) => (
                      <li key={f.employee.id}>
                        {f.employee.firstName} {f.employee.lastName} —{' '}
                        {f.message}
                      </li>
                    ))}
                  </ul>
                </AlertDescription>
              </Alert>
            )}

            {/* Destination Firm */}
            <div className='space-y-2'>
              <Label htmlFor='toFirm'>Entreprise de destination *</Label>
              <Select
                value={formData.toFirmId || 'NONE'}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    toFirmId: value === 'NONE' ? '' : value,
                    clientId: ''
                  })
                }
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder='Sélectionner une entreprise' />
                </SelectTrigger>
                <SelectContent>
                  {firms.length === 0 ? (
                    <SelectItem value='NONE' disabled>
                      Aucune entreprise avec module RH disponible
                    </SelectItem>
                  ) : (
                    firms.map((firm) => (
                      <SelectItem key={firm.id} value={firm.id}>
                        {firm.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            {/* Client Assignment */}
            {formData.toFirmId && (
              <div className='space-y-2'>
                <Label htmlFor='client'>Client assigné (optionnel)</Label>
                <Select
                  value={formData.clientId || 'NONE'}
                  onValueChange={(value) =>
                    setFormData({
                      ...formData,
                      clientId: value === 'NONE' ? '' : value
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Aucun client' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='NONE'>Aucun</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Transfer Dates */}
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='transferDate'>Date de demande *</Label>
                <input
                  id='transferDate'
                  type='date'
                  value={formData.transferDate}
                  onChange={(e) =>
                    setFormData({ ...formData, transferDate: e.target.value })
                  }
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='effectiveDate'>Date d&apos;effet *</Label>
                <input
                  id='effectiveDate'
                  type='date'
                  value={formData.effectiveDate}
                  onChange={(e) =>
                    setFormData({ ...formData, effectiveDate: e.target.value })
                  }
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  required
                />
              </div>
            </div>

            {/* Reason */}
            <div className='space-y-2'>
              <Label htmlFor='reason'>Raison du transfert *</Label>
              <Textarea
                id='reason'
                value={formData.reason}
                onChange={(e) =>
                  setFormData({ ...formData, reason: e.target.value })
                }
                placeholder="Ex: Limite de 24 mois atteinte, besoin de l'entreprise cible..."
                rows={3}
                required
              />
            </div>

            {/* Notes */}
            <div className='space-y-2'>
              <Label htmlFor='notes'>Notes supplémentaires (optionnel)</Label>
              <Textarea
                id='notes'
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder='Informations additionnelles...'
                rows={2}
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
            <Button type='submit' disabled={loading || firms.length === 0}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Créer {employees.length} demande(s) de transfert
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
