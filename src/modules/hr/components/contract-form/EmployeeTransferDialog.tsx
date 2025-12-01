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
import { Checkbox } from '@/components/ui/checkbox';
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

interface EmployeeTransferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee: Employee | null;
  onSuccess?: () => void;
}

export function EmployeeTransferDialog({
  open,
  onOpenChange,
  employee,
  onSuccess
}: EmployeeTransferDialogProps) {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [firmId, setFirmId] = React.useState<string | null>(null);
  const [holdingId, setHoldingId] = React.useState<string | null>(null);
  const [firms, setFirms] = React.useState<Firm[]>([]);
  const [clients, setClients] = React.useState<Client[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [formData, setFormData] = React.useState({
    toFirmId: '',
    clientId: '',
    transferDate: new Date().toISOString().split('T')[0],
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: '',
    createNewContract: false,
    notes: ''
  });

  React.useEffect(() => {
    if (open) {
      fetchFirmAndHolding();
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
        // Filter out current firm
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmId || !employee) return;

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

    try {
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

      const res = await fetch(`/api/firms/${firmId}/transfers`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create transfer request');
      }

      onSuccess?.();
      onOpenChange(false);

      // Reset form
      setFormData({
        toFirmId: '',
        clientId: '',
        transferDate: new Date().toISOString().split('T')[0],
        effectiveDate: new Date().toISOString().split('T')[0],
        reason: '',
        createNewContract: false,
        notes: ''
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!employee) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-2xl'>
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <ArrowRightLeft className='h-5 w-5' />
            Transférer l'employé
          </DialogTitle>
          <DialogDescription>
            Transférer {employee.firstName} {employee.lastName} (
            {employee.matricule}) vers une autre entreprise
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            <Alert>
              <Info className='h-4 w-4' />
              <AlertDescription>
                Ce transfert est utilisé lorsqu'un employé a atteint la limite
                de 24 mois cumulés en contrat intérimaire et doit être transféré
                vers une autre entreprise du groupe.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
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
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label htmlFor='effectiveDate'>Date d'effet *</Label>
                <input
                  id='effectiveDate'
                  type='date'
                  value={formData.effectiveDate}
                  onChange={(e) =>
                    setFormData({ ...formData, effectiveDate: e.target.value })
                  }
                  className='border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex h-10 w-full rounded-md border px-3 py-2 text-sm file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50'
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

            {/* Create Contract Option */}
            <div className='flex items-center space-x-2'>
              <Checkbox
                id='createContract'
                checked={formData.createNewContract}
                onCheckedChange={(checked) =>
                  setFormData({
                    ...formData,
                    createNewContract: checked as boolean
                  })
                }
              />
              <Label
                htmlFor='createContract'
                className='cursor-pointer text-sm font-normal'
              >
                Créer automatiquement un nouveau contrat dans l'entreprise de
                destination
              </Label>
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
              Créer la demande de transfert
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
