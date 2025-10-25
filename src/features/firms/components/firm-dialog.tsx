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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { firmSchema, FirmFormData } from '@/lib/validations/firm';
import { DEFAULT_THEMES } from '@/lib/constants/themes';
import { toast } from 'sonner';
import { ImageUploader } from '@/components/ui/image-uploader';

type FirmDialogProps = {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  firm?: {
    id: string;
    name: string;
    slug: string;
    logo: string | null;
    holdingId: string;
    themeColor: string | null;
  } | null;
};

export function FirmDialog({ open, onClose, firm }: FirmDialogProps) {
  // Use Senexus Group holding ID directly
  const SENEXUS_HOLDING_ID = 'senexus-group-holding';

  const form = useForm<FirmFormData>({
    resolver: zodResolver(firmSchema),
    defaultValues: {
      name: '',
      slug: '',
      logo: '',
      holdingId: SENEXUS_HOLDING_ID,
      themeColor: 'default'
    }
  });

  useEffect(() => {
    if (firm) {
      form.reset({
        name: firm.name,
        slug: firm.slug,
        logo: firm.logo || '',
        holdingId: firm.holdingId,
        themeColor: firm.themeColor || 'default'
      });
    } else {
      form.reset({
        name: '',
        slug: '',
        logo: '',
        holdingId: SENEXUS_HOLDING_ID,
        themeColor: 'default'
      });
    }
  }, [firm, form, SENEXUS_HOLDING_ID]);

  async function onSubmit(data: FirmFormData) {
    try {
      const url = firm ? `/api/firms/${firm.id}` : '/api/firms';
      const method = firm ? 'PATCH' : 'POST';

      console.log('Submitting firm data:', data);

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const error = await res.json();
        console.error('API error:', error);
        throw new Error(error.error || 'Failed to save');
      }

      const result = await res.json();
      console.log('API response:', result);

      toast.success(
        firm
          ? 'Entreprise mise à jour avec succès'
          : 'Entreprise créée avec succès'
      );
      onClose(true);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Échec de l'enregistrement de l'entreprise"
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {firm ? "Modifier l'Entreprise" : 'Créer une Entreprise'}
          </DialogTitle>
        </DialogHeader>

        <Form
          form={form}
          onSubmit={form.handleSubmit(onSubmit)}
          className='space-y-4'
        >
          <FormField
            control={form.control}
            name='name'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nom *</FormLabel>
                <FormControl>
                  <Input placeholder='Acme Corporation' {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='slug'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Identifiant *</FormLabel>
                <FormControl>
                  <Input
                    placeholder='acme-corp'
                    {...field}
                    onChange={(e) => {
                      // Auto-convert to lowercase and remove invalid characters
                      const value = e.target.value
                        .toLowerCase()
                        .replace(/[^a-z0-9-]/g, '');
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Holding is fixed to Senexus Group - hidden field */}
          <input
            type='hidden'
            {...form.register('holdingId')}
            value={SENEXUS_HOLDING_ID}
          />

          <FormField
            control={form.control}
            name='logo'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Logo (optionnel)</FormLabel>
                <FormControl>
                  <ImageUploader
                    value={field.value || ''}
                    onChange={field.onChange}
                    onRemove={() => field.onChange('')}
                    maxSize={5 * 1024 * 1024}
                    aspectRatio={1}
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name='themeColor'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Thème</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder='Sélectionner un thème' />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {DEFAULT_THEMES.map((theme) => (
                      <SelectItem key={theme.value} value={theme.value}>
                        <div className='flex items-center gap-2'>
                          <div
                            className='h-4 w-4 rounded-full border'
                            style={{ backgroundColor: theme.color }}
                          />
                          <span>{theme.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className='flex justify-end gap-2'>
            <Button type='button' variant='outline' onClick={() => onClose()}>
              Annuler
            </Button>
            <Button type='submit' disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting
                ? 'Enregistrement...'
                : firm
                  ? 'Mettre à jour'
                  : 'Créer'}
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
