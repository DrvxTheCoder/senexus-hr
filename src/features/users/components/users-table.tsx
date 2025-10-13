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
import { Plus, Pencil, Trash2, Key } from 'lucide-react';
import { UserDialog } from './user-dialog';
import { ChangePasswordDialog } from './change-password-dialog';
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

type User = {
  id: string;
  name: string;
  email: string;
  emailVerified: Date | null;
  createdAt: string;
  userFirms: {
    firmId: string;
    role: string;
    firm: {
      id: string;
      name: string;
      slug: string;
    };
  }[];
};

export function UsersTable() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [userForPasswordChange, setUserForPasswordChange] = useState<
    string | null
  >(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const res = await fetch('/api/users');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setUsers(data);
    } catch (error) {
      toast.error('Échec du chargement des utilisateurs');
    } finally {
      setIsLoading(false);
    }
  }

  function handleCreate() {
    setEditingUser(null);
    setIsDialogOpen(true);
  }

  function handleEdit(user: User) {
    setEditingUser(user);
    setIsDialogOpen(true);
  }

  function handleDeleteClick(user: User) {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  }

  function handlePasswordChange(userId: string) {
    setUserForPasswordChange(userId);
    setPasswordDialogOpen(true);
  }

  function handlePasswordDialogClose() {
    setPasswordDialogOpen(false);
    setUserForPasswordChange(null);
  }

  async function handleDelete() {
    if (!userToDelete) return;

    try {
      const res = await fetch(`/api/users/${userToDelete.id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to delete');
      }

      toast.success('Utilisateur supprimé avec succès');
      fetchUsers();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Échec de la suppression de l'utilisateur"
      );
    } finally {
      setDeleteDialogOpen(false);
      setUserToDelete(null);
    }
  }

  function handleDialogClose(refresh?: boolean) {
    setIsDialogOpen(false);
    setEditingUser(null);
    if (refresh) {
      fetchUsers();
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
            Ajouter un Utilisateur
          </Button>
        </div>

        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Email vérifié</TableHead>
                <TableHead>Entreprises</TableHead>
                <TableHead>Créé le</TableHead>
                <TableHead className='w-[100px]'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className='h-24 text-center'>
                    Aucun utilisateur trouvé. Créez votre premier utilisateur
                    pour commencer.
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className='font-medium'>{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      {user.emailVerified ? (
                        <Badge variant='default'>Vérifié</Badge>
                      ) : (
                        <Badge variant='secondary'>Non vérifié</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className='flex items-center gap-2'>
                        <span className='text-sm'>{user.userFirms.length}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.createdAt).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className='flex gap-2'>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleEdit(user)}
                          title='Modifier'
                        >
                          <Pencil className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handlePasswordChange(user.id)}
                          title='Changer le mot de passe'
                        >
                          <Key className='h-4 w-4' />
                        </Button>
                        <Button
                          variant='ghost'
                          size='icon'
                          onClick={() => handleDeleteClick(user)}
                          title='Supprimer'
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

      <UserDialog
        open={isDialogOpen}
        onClose={handleDialogClose}
        user={editingUser}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Êtes-vous sûr ?</AlertDialogTitle>
            <AlertDialogDescription>
              Cela supprimera définitivement &quot;{userToDelete?.name}&quot; (
              {userToDelete?.email}). Cette action ne peut pas être annulée.
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

      {userForPasswordChange && (
        <ChangePasswordDialog
          open={passwordDialogOpen}
          onClose={handlePasswordDialogClose}
          userId={userForPasswordChange}
        />
      )}
    </>
  );
}
