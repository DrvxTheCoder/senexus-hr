'use client';

import { IconCamera, IconX } from '@tabler/icons-react';
import Image from 'next/image';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { Trash2 } from 'lucide-react';

export interface ProfilePhotoPreviewProps {
  value?: string; // Existing photo URL (for edit mode)
  onFileChange?: (file: File | null) => void;
  disabled?: boolean;
  className?: string;
}

export function ProfilePhotoPreview({
  value,
  onFileChange,
  disabled = false,
  className
}: ProfilePhotoPreviewProps) {
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Update preview when value prop changes (for edit mode)
  useEffect(() => {
    if (value && !selectedFile) {
      setPreviewUrl(value);
    }
  }, [value, selectedFile]);

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

    // Create preview URL
    const preview = URL.createObjectURL(file);
    setPreviewUrl(preview);
    setSelectedFile(file);
    onFileChange?.(file);

    // Reset input
    e.target.value = '';
  };

  const handleRemove = () => {
    if (previewUrl && selectedFile) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(value); // Reset to original value if editing, or undefined if new
    setSelectedFile(null);
    onFileChange?.(null);
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
          <div className='flex size-24 items-center justify-center rounded-full border-2 border-dashed'>
            <IconCamera className='size-8 text-gray-400' />
          </div>
        )}
      </div>

      {/* Upload/Remove Buttons */}
      <div className='flex flex-col gap-2'>
        <div className='flex flex-row gap-2'>
          <label>
            <input
              type='file'
              accept='image/*'
              onChange={handleFileSelect}
              disabled={disabled}
              className='hidden'
            />
            <Button
              type='button'
              variant='outline'
              size='sm'
              disabled={disabled}
              asChild
            >
              <span>
                <IconCamera className='mr-2 size-4' />
                {previewUrl ? 'Changer la photo' : 'Ajouter une photo'}
              </span>
            </Button>
          </label>

          {(previewUrl || selectedFile) && (
            <Button
              type='button'
              variant='ghost'
              size='icon'
              onClick={handleRemove}
              disabled={disabled}
            >
              <Trash2 className='size-4' />
            </Button>
          )}
        </div>

        <p className='text-xs text-gray-500'>{`JPG, PNG ou WebP. (Maximum: 5 Mo)`}</p>
      </div>
    </div>
  );
}
