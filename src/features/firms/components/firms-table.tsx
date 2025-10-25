'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { FirmDialog } from './firm-dialog';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';

type Firm = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  themeColor: string | null;
  holdingId: string;
  holding: {
    id: string;
    name: string;
  };
  userFirms: {
    id: string;
    role: string;
    user: {
      id: string;
      name: string | null;
      email: string;
    };
  }[];
  _count: {
    employees: number;
    departments: number;
  };
};

export function FirmsTable() {
  const [firms, setFirms] = useState<Firm[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFirm, setEditingFirm] = useState<Firm | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [firmToDelete, setFirmToDelete] = useState<Firm | null>(null);

  useEffect(() => {
    fetchFirms();
  }, []);

  async function fetchFirms() {
    try {
      const res = await fetch('/api/firms');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setFirms(data);
    } catch (error) {
      toast.error('Échec du chargement des entreprises');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreate() {
    setEditingFirm(null);
    setIsDialogOpen(true);
  }

  function handleEdit(firm: Firm) {
    setEditingFirm(firm);
    setIsDialogOpen(true);
  }

  function handleDeleteClick(firm: Firm) {
    setFirmToDelete(firm);
    setDeleteDialogOpen(true);
  }

  async function handleDelete() {
    if (!firmToDelete) return;

    try {
      const res = await fetch(`/api/firms/${firmToDelete.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Failed to delete');

      toast.success('Entreprise supprimée avec succès');
      fetchFirms();
    } catch (error) {
      toast.error("Échec de la suppression de l'entreprise");
    } finally {
      setDeleteDialogOpen(false);
      setFirmToDelete(null);
    }
  }

  function handleDialogClose(refresh?: boolean) {
    setIsDialogOpen(false);
    setEditingFirm(null);
    if (refresh) {
      fetchFirms();
    }
  }

  if (isLoading) {
    return <div className='p-8 text-center'>Chargement...</div>;
  }

  return (
    <>
      <div className='space-y-4'>
        <div className='flex justify-end'>
          <Button onClick={handleCreate}>
            <Plus className='mr-2 h-4 w-4' />
            Ajouter une Entreprise
          </Button>
        </div>

        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Identifiant</TableHead>
                <TableHead>Holding</TableHead>
                <TableHead>Couleur du thème</TableHead>
                <TableHead>Nombre d&apos;utilisateurs</TableHead>
                <TableHead className='w-[100px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {firms.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center'>
                    Aucune entreprise trouvée. Créez votre première entreprise
                    pour commencer.
                  </TableCell>
                </TableRow>
              ) : (
                firms.map((firm) => (
                  <TableRow key={firm.id}>
                    <TableCell className='font-medium'>{firm.name}</TableCell>
                    <TableCell>
                      <code className='bg-muted rounded px-2 py-1 text-xs'>
                        {firm.slug}
                      </code>
                    </TableCell>
                    <TableCell>{firm.holding.name}</TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <Badge
                          style={{
                            backgroundColor: firm.themeColor || '#3b82f6',
                            color: '#ffffff'
                          }}
                        >
                          {firm.themeColor || '#3b82f6'}
                        </Badge>
                        <div
                          className='h-6 w-6 rounded border'
                          style={{
                            backgroundColor: firm.themeColor || '#3b82f6'
                          }}
                        />
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className='text-muted-foreground'>
                        {firm.userFirms.length}{' '}
                        {firm.userFirms.length === 1
                          ? 'utilisateur'
                          : 'utilisateurs'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleEdit(firm)}
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleDeleteClick(firm)}
                        >
                          <Trash2 className='h-4 w-4' />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <FirmDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        firm={editingFirm}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cela supprimera définitivement &quot;{firmToDelete?.name}&quot; et
              toutes les données associées. Cette action ne peut pas être
              annulée.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
