'use client';

import { IconCamera, IconX } from '@tabler/icons-react';
import Image from 'next/image';
import { useState } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export interface ProfilePhotoUploadProps {
  value?: string; // URL of the current photo
  onValueChange?: (url: string | undefined) => void;
  disabled?: boolean;
  className?: string;
}

export function ProfilePhotoUpload({
  value,
  onValueChange,
  disabled = false,
  className
}: ProfilePhotoUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error('Seuls les fichiers image sont acceptés');
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La taille du fichier ne doit pas dépasser 5 Mo');
      return;
    }

    setUploading(true);

    try {
      // Upload via API route (server-side Zipline upload)
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Échec du téléchargement');
      }

      const data = await response.json();
      const url = data.url;

      setPreviewUrl(url);
      onValueChange?.(url);
      toast.success('Photo téléchargée avec succès');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Échec du téléchargement'
      );
    } finally {
      setUploading(false);
      // Reset input
      e.target.value = '';
    }
  };

  const handleRemove = () => {
    setPreviewUrl(undefined);
    onValueChange?.(undefined);
    toast.success('Photo retirée');
  };

  return (
    <div className={cn('flex items-center gap-4', className)}>
      {/* Photo Preview */}
      <div className='relative'>
        {previewUrl ? (
          <div className='relative size-24 overflow-hidden rounded-full border-2 border-gray-200'>
            <Image
              src={previewUrl}
              alt='Photo de profil'
              fill
              className='object-cover'
            />
          </div>
        ) : (
          <div className='flex size-24 items-center justify-center rounded-full border-2 border-dashed border-gray-300 bg-gray-50'>
            <IconCamera className='size-8 text-gray-400' />
          </div>
        )}

        {uploading && (
          <div className='absolute inset-0 flex items-center justify-center rounded-full bg-black/50'>
            <div className='size-6 animate-spin rounded-full border-2 border-white border-t-transparent' />
          </div>
        )}
      </div>

      {/* Upload/Remove Buttons */}
      <div className='flex flex-col gap-2'>
        <label>
          <input
            type='file'
            accept='image/*'
            onChange={handleFileSelect}
            disabled={disabled || uploading}
            className='hidden'
          />
          <Button
            type='button'
            variant='outline'
            size='sm'
            disabled={disabled || uploading}
            asChild
          >
            <span>
              <IconCamera className='mr-2 size-4' />
              {previewUrl ? 'Changer la photo' : 'Ajouter une photo'}
            </span>
          </Button>
        </label>

        {previewUrl && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            onClick={handleRemove}
            disabled={disabled || uploading}
          >
            <IconX className='mr-2 size-4' />
            Retirer
          </Button>
        )}

        <p className='text-xs text-gray-500'>JPG, PNG ou WebP. Max 5 Mo.</p>
      </div>
    </div>
  );
}
