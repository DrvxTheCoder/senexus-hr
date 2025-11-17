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
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, Loader2, XCircle } from 'lucide-react';

interface Contract {
  id: string;
  type: string;
  status: string;
  employee: {
    firstName: string;
    lastName: string;
  };
}

interface ContractTerminationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contract: Contract | null;
  onSuccess?: () => void;
}

export function ContractTerminationDialog({
  open,
  onOpenChange,
  contract,
  onSuccess
}: ContractTerminationDialogProps) {
  const params = useParams();
  const firmSlug = params.firmSlug as string;

  const [firmId, setFirmId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState('');

  React.useEffect(() => {
    if (open) {
      fetchFirmId();
    }
  }, [open, firmSlug]);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firmId || !contract) return;

    if (!reason.trim()) {
      setError('Veuillez indiquer la raison de la résiliation');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(
        `/api/firms/${firmId}/contracts/${contract.id}/terminate`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ reason })
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to terminate contract');
      }

      onSuccess?.();
      onOpenChange(false);
      setReason('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!contract) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle className='text-destructive flex items-center gap-2'>
            <XCircle className='h-5 w-5' />
            Résilier le contrat
          </DialogTitle>
          <DialogDescription>
            Résiliation du contrat de {contract.employee.firstName}{' '}
            {contract.employee.lastName}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className='space-y-4 py-4'>
            <Alert variant='destructive'>
              <AlertTriangle className='h-4 w-4' />
              <AlertDescription>
                Cette action est irréversible. Le contrat sera marqué comme
                TERMINÉ et ne pourra plus être renouvelé.
              </AlertDescription>
            </Alert>

            {error && (
              <Alert variant='destructive'>
                <AlertTriangle className='h-4 w-4' />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className='space-y-2'>
              <Label htmlFor='reason'>Raison de la résiliation *</Label>
              <Textarea
                id='reason'
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder='Ex: Fin de mission, démission, licenciement, faute grave...'
                rows={4}
                required
              />
              <p className='text-muted-foreground text-xs'>
                Cette information sera enregistrée dans l'historique du contrat
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                onOpenChange(false);
                setReason('');
                setError(null);
              }}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button type='submit' variant='destructive' disabled={loading}>
              {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Résilier le contrat
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
