'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  userSchema,
  userWithPasswordSchema,
  UserFormData,
  UserWithPasswordFormData
} from '@/lib/validations/user';
import { toast } from 'sonner';

type Firm = { id: string; name: string };
type Employee = {
  id: string;
  firstName: string;
  lastName: string;
  matricule: string;
};

type UserDialogProps = {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  user?: {
    id: string;
    name: string;
    email: string;
    userFirms: Array<{ firmId: string; role: string }>;
  } | null;
};

export function UserDialog({ open, onClose, user }: UserDialogProps) {
  const isEditing = !!user;
  const [firms, setFirms] = useState<Firm[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingFirms, setLoadingFirms] = useState(true);
  const [loadingEmployees, setLoadingEmployees] = useState(true);

  const form = useForm<UserFormData>({
    resolver: zodResolver(isEditing ? userSchema : userWithPasswordSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'STAFF',
      firmIds: [],
      employeeId: undefined,
      password: '',
      confirmPassword: ''
    }
  });

  // Load firms and employees
  useEffect(() => {
    async function loadData() {
      setLoadingFirms(true);
      setLoadingEmployees(true);

      try {
        const [firmsRes, employeesRes] = await Promise.all([
          fetch('/api/firms'),
          fetch('/api/employees')
        ]);

        if (firmsRes.ok) {
          const firmsData = await firmsRes.json();
          // API returns array directly, not wrapped in { firms: [] }
          setFirms(
            Array.isArray(firmsData) ? firmsData : firmsData.firms || []
          );
        }

        if (employeesRes.ok) {
          const employeesData = await employeesRes.json();
          // API returns { employees: [] }
          setEmployees(employeesData.employees || []);
        }
      } catch (error) {
        console.error('Failed to load data:', error);
      } finally {
        setLoadingFirms(false);
        setLoadingEmployees(false);
      }
    }

    if (open) {
      loadData();
    }
  }, [open]);

  useEffect(() => {
    if (user) {
      const role = (user.userFirms[0]?.role || 'STAFF') as
        | 'OWNER'
        | 'ADMIN'
        | 'MANAGER'
        | 'STAFF'
        | 'VIEWER';
      const firmIds = user.userFirms.map((uf) => uf.firmId);

      form.reset({
        name: user.name,
        email: user.email,
        role,
        firmIds,
        employeeId: undefined,
        password: '',
        confirmPassword: ''
      });
    } else {
      form.reset({
        name: '',
        email: '',
        role: 'STAFF' as const,
        firmIds: [],
        employeeId: undefined,
        password: '',
        confirmPassword: ''
      });
    }
  }, [user, form]);

  const selectedRole = form.watch('role');
  const isOwnerOrAdmin = selectedRole === 'OWNER' || selectedRole === 'ADMIN';

  // Auto-select all firms for OWNER/ADMIN
  useEffect(() => {
    if (isOwnerOrAdmin && firms.length > 0) {
      form.setValue(
        'firmIds',
        firms.map((f) => f.id)
      );
    }
  }, [isOwnerOrAdmin, firms, form]);

  async function onSubmit(data: UserFormData | UserWithPasswordFormData) {
    try {
      const url = user ? `/api/users/${user.id}` : '/api/users';
      const method = user ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to save');
      }

      toast.success(
        user
          ? 'Utilisateur mis à jour avec succès'
          : 'Utilisateur créé avec succès'
      );
      onClose(true);
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Échec de l'enregistrement de l'utilisateur"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {user ? "Modifier l'Utilisateur" : 'Créer un Utilisateur'}
          </DialogTitle>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='max-h-[70vh] space-y-4 overflow-y-auto'
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input placeholder='Jean Dupont' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email *</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='jean.dupont@example.com'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='role'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Rôle *</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionner un rôle' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value='OWNER'>Propriétaire</SelectItem>
                    <SelectItem value='ADMIN'>Administrateur</SelectItem>
                    <SelectItem value='MANAGER'>Manager</SelectItem>
                    <SelectItem value='STAFF'>Personnel</SelectItem>
                    <SelectItem value='VIEWER'>Observateur</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='firmIds'
            render={() => (
              <FormItem>
                <FormLabel>Entreprises *</FormLabel>
                {isOwnerOrAdmin && (
                  <FormDescription>
                    Les propriétaires et administrateurs sont automatiquement
                    assignés à toutes les entreprises
                  </FormDescription>
                )}
                {!isOwnerOrAdmin && (
                  <div className='max-h-40 space-y-2 overflow-y-auto rounded-md border p-3'>
                    {loadingFirms ? (
                      <p className='text-muted-foreground text-sm'>
                        Chargement...
                      </p>
                    ) : firms.length === 0 ? (
                      <p className='text-muted-foreground text-sm'>
                        Aucune entreprise disponible
                      </p>
                    ) : (
                      firms.map((firm) => (
                        <FormField
                          key={firm.id}
                          control={form.control}
                          name='firmIds'
                          render={({ field }) => (
                            <FormItem className='flex items-start space-y-0 space-x-3'>
                              <FormControl>
                                <Checkbox
                                  checked={field.value?.includes(firm.id)}
                                  onCheckedChange={(checked) => {
                                    return checked
                                      ? field.onChange([
                                          ...field.value,
                                          firm.id
                                        ])
                                      : field.onChange(
                                          field.value?.filter(
                                            (value) => value !== firm.id
                                          )
                                        );
                                  }}
                                />
                              </FormControl>
                              <FormLabel className='font-normal'>
                                {firm.name}
                              </FormLabel>
                            </FormItem>
                          )}
                        />
                      ))
                    )}
                  </div>
                )}
                {isOwnerOrAdmin && firms.length > 0 && (
                  <div className='text-muted-foreground mt-2 text-sm'>
                    {firms.map((f) => f.name).join(', ')}
                  </div>
                )}
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='employeeId'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Employé (optionnel)</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionner un employé' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {loadingEmployees ? (
                      <SelectItem value='loading' disabled>
                        Chargement...
                      </SelectItem>
                    ) : employees.length === 0 ? (
                      <SelectItem value='none' disabled>
                        Aucun employé disponible
                      </SelectItem>
                    ) : (
                      employees.map((employee) => (
                        <SelectItem key={employee.id} value={employee.id}>
                          {employee.firstName} {employee.lastName} (
                          {employee.matricule})
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <FormDescription>
                  Lier ce compte utilisateur à un employé existant
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {!isEditing && (
            <>
              <FormField
                control={form.control}
                name='password'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe *</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='Entrer le mot de passe'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='confirmPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe *</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder='Répéter le mot de passe'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </>
          )}

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => onClose()}>
              Annuler
            </Button>
            <Button type='submit' disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? 'Enregistrement...'
                : user
                  ? 'Mettre à jour'
                  : 'Créer'}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
