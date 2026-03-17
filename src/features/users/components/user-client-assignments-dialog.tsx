'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Check, X, Loader2, Building2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

type Client = {
  id: string;
  name: string;
  status: string;
  photoUrl: string | null;
};

type Assignment = {
  id: string;
  clientId: string;
  client: Client;
};

type Firm = {
  id: string;
  name: string;
  slug: string;
};

type UserFirm = {
  firmId: string;
  role: string;
  firm: Firm;
};

type Props = {
  open: boolean;
  onClose: () => void;
  userId: string;
  userName: string;
  userFirms: UserFirm[];
};

export function UserClientAssignmentsDialog({
  open,
  onClose,
  userId,
  userName,
  userFirms
}: Props) {
  const [selectedFirmId, setSelectedFirmId] = useState<string>(
    userFirms[0]?.firmId ?? ''
  );
  const [allClients, setAllClients] = useState<Client[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingClients, setLoadingClients] = useState(false);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [saving, setSaving] = useState<string | null>(null); // clientId being toggled
  const [search, setSearch] = useState('');

  const assignedClientIds = new Set(assignments.map((a) => a.clientId));

  useEffect(() => {
    if (!open || !selectedFirmId) return;
    fetchClientsAndAssignments(selectedFirmId);
  }, [open, selectedFirmId]);

  async function fetchClientsAndAssignments(firmId: string) {
    setLoadingClients(true);
    setLoadingAssignments(true);
    try {
      const [clientsRes, assignmentsRes] = await Promise.all([
        fetch(`/api/firms/${firmId}/clients`),
        fetch(`/api/user-client-assignments?userId=${userId}&firmId=${firmId}`)
      ]);

      if (clientsRes.ok) {
        const data = await clientsRes.json();
        // API returns { clients: [...] } or just array depending on route
        setAllClients(Array.isArray(data) ? data : (data.clients ?? []));
      }

      if (assignmentsRes.ok) {
        const data = await assignmentsRes.json();
        setAssignments(data);
      }
    } catch {
      toast.error('Erreur lors du chargement des données');
    } finally {
      setLoadingClients(false);
      setLoadingAssignments(false);
    }
  }

  async function toggleAssignment(clientId: string, isAssigned: boolean) {
    setSaving(clientId);
    try {
      const res = await fetch('/api/user-client-assignments', {
        method: isAssigned ? 'DELETE' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, clientId, firmId: selectedFirmId })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }

      // Optimistic update
      if (isAssigned) {
        setAssignments((prev) => prev.filter((a) => a.clientId !== clientId));
      } else {
        const newAssignment = await res.json();
        setAssignments((prev) => [...prev, newAssignment]);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Erreur lors de la mise à jour'
      );
    } finally {
      setSaving(null);
    }
  }

  const filteredClients = allClients.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const isLoading = loadingClients || loadingAssignments;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className='max-w-lg'>
        <DialogHeader>
          <DialogTitle>Clients assignés — {userName}</DialogTitle>
          <DialogDescription>
            Sélectionnez les clients que cet utilisateur peut gérer. Seuls les
            rôles OWNER et ADMIN ont accès à tous les clients par défaut.
          </DialogDescription>
        </DialogHeader>

        {/* Firm selector (if user belongs to multiple firms) */}
        {userFirms.length > 1 && (
          <div className='flex flex-wrap gap-2'>
            {userFirms.map((uf) => (
              <Button
                key={uf.firmId}
                variant={selectedFirmId === uf.firmId ? 'default' : 'outline'}
                size='sm'
                onClick={() => {
                  setSelectedFirmId(uf.firmId);
                  setSearch('');
                }}
              >
                {uf.firm.name}
              </Button>
            ))}
          </div>
        )}

        {userFirms.length === 1 && (
          <div className='text-muted-foreground flex items-center gap-2 text-sm'>
            <Building2 className='h-4 w-4' />
            <span>{userFirms[0].firm.name}</span>
            <Badge variant='outline'>{userFirms[0].role}</Badge>
          </div>
        )}

        <Separator />

        {/* Summary */}
        <div className='flex items-center justify-between text-sm'>
          <span className='text-muted-foreground'>
            {assignments.length} client(s) assigné(s)
          </span>
          <Input
            placeholder='Rechercher un client...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='ml-4 h-8 w-48'
          />
        </div>

        {/* Client list */}
        {isLoading ? (
          <div className='flex h-48 items-center justify-center'>
            <Loader2 className='text-muted-foreground h-6 w-6 animate-spin' />
          </div>
        ) : allClients.length === 0 ? (
          <div className='text-muted-foreground flex h-48 items-center justify-center text-sm'>
            Aucun client trouvé pour cette entreprise
          </div>
        ) : (
          <ScrollArea className='h-72 pr-2'>
            <div className='space-y-1'>
              {filteredClients.map((client) => {
                const isAssigned = assignedClientIds.has(client.id);
                const isSaving = saving === client.id;
                return (
                  <div
                    key={client.id}
                    className='hover:bg-muted/50 flex items-center justify-between rounded-md px-2 py-2'
                  >
                    <div className='flex items-center gap-3'>
                      <Checkbox
                        id={client.id}
                        checked={isAssigned}
                        disabled={isSaving}
                        onCheckedChange={() =>
                          toggleAssignment(client.id, isAssigned)
                        }
                      />
                      <label
                        htmlFor={client.id}
                        className='cursor-pointer text-sm leading-none font-medium'
                      >
                        {client.name}
                      </label>
                    </div>
                    <div className='flex items-center gap-2'>
                      <Badge
                        variant={
                          client.status === 'ACTIVE' ? 'default' : 'secondary'
                        }
                        className='text-xs'
                      >
                        {client.status}
                      </Badge>
                      {isSaving && (
                        <Loader2 className='text-muted-foreground h-3 w-3 animate-spin' />
                      )}
                      {isAssigned && !isSaving && (
                        <Check className='h-3 w-3 text-green-500' />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}

        <div className='flex justify-end'>
          <Button variant='outline' onClick={onClose}>
            <X className='mr-2 h-4 w-4' />
            Fermer
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
