'use client';

import { useEffect } from 'react';
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
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  passwordChangeSchema,
  PasswordChangeFormData
} from '@/lib/validations/user';
import { toast } from 'sonner';

type ChangePasswordDialogProps = {
  open: boolean;
  onClose: () => void;
  userId: string;
};

export function ChangePasswordDialog({
  open,
  onClose,
  userId
}: ChangePasswordDialogProps) {
  const form = useForm<PasswordChangeFormData>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: {
      password: '',
      confirmPassword: ''
    }
  });

  useEffect(() => {
    if (open) {
      form.reset({
        password: '',
        confirmPassword: ''
      });
    }
  }, [open, form]);

  async function onSubmit(data: PasswordChangeFormData) {
    try {
      const res = await fetch(`/api/users/${userId}/password`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: data.password })
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Failed to change password');
      }

      toast.success('Mot de passe modifié avec succès');
      onClose();
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Échec de la modification du mot de passe'
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Modifier le mot de passe</DialogTitle>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nouveau mot de passe *</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Entrer le nouveau mot de passe'
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

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={onClose}>
              Annuler
            </Button>
            <Button type='submit' disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? 'Enregistrement...' : 'Modifier'}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
