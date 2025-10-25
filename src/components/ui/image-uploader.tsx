'use client';

import { useState, useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import ReactCrop, { Crop, PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Upload, X, Crop as CropIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ImageUploaderProps {
  value?: string;
  onChange: (url: string) => void;
  onRemove?: () => void;
  maxSize?: number; // in bytes
  aspectRatio?: number; // width/height ratio (e.g., 16/9, 1 for square)
  className?: string;
  disabled?: boolean;
}

export function ImageUploader({
  value,
  onChange,
  onRemove,
  maxSize = 5 * 1024 * 1024, // 5MB default
  aspectRatio,
  className,
  disabled = false
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);
  const [originalFile, setOriginalFile] = useState<File | null>(null);

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];

      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File size exceeds ${maxSize / (1024 * 1024)}MB limit`);
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Only image files are allowed');
        return;
      }

      // Store original file
      setOriginalFile(file);

      // Create preview URL
      const reader = new FileReader();
      reader.onload = () => {
        setImageToCrop(reader.result as string);
        setShowCropDialog(true);
      };
      reader.readAsDataURL(file);
    },
    [maxSize]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    maxFiles: 1,
    disabled: disabled || uploading
  });

  const getCroppedImage = async (): Promise<File | null> => {
    if (!completedCrop || !imgRef.current || !originalFile) {
      return originalFile;
    }

    const canvas = document.createElement('canvas');
    const image = imgRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = crop.width;
    canvas.height = crop.height;

    const ctx = canvas.getContext('2d');
    if (!ctx) return null;

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height
    );

    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) {
          resolve(null);
          return;
        }
        const file = new File([blob], originalFile.name, {
          type: originalFile.type
        });
        resolve(file);
      }, originalFile.type);
    });
  };

  const handleUpload = async () => {
    try {
      setUploading(true);

      // Get the cropped image or original
      const fileToUpload = await getCroppedImage();
      if (!fileToUpload) {
        toast.error('Failed to process image');
        return;
      }

      // Upload to server
      const formData = new FormData();
      formData.append('file', fileToUpload);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      onChange(data.url);
      toast.success('Image uploaded successfully');

      // Reset states
      setShowCropDialog(false);
      setImageToCrop(null);
      setOriginalFile(null);
      setCrop(undefined);
      setCompletedCrop(undefined);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleSkipCrop = async () => {
    if (!originalFile) return;

    try {
      setUploading(true);

      // Upload original file without cropping
      const formData = new FormData();
      formData.append('file', originalFile);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Upload failed');
      }

      const data = await response.json();
      onChange(data.url);
      toast.success('Image uploaded successfully');

      // Reset states
      setShowCropDialog(false);
      setImageToCrop(null);
      setOriginalFile(null);
    } catch (error) {
      console.error('Upload error:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to upload image'
      );
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    if (onRemove) {
      onRemove();
    } else {
      onChange('');
    }
  };

  return (
    <>
      <div className={cn('w-full', className)}>
        {value ? (
          <Card className='relative overflow-hidden'>
            <img
              src={value}
              alt='Uploaded image'
              className='h-32 w-full object-cover'
            />
            <Button
              type='button'
              variant='destructive'
              size='icon'
              className='absolute top-2 right-2'
              onClick={handleRemove}
              disabled={disabled}
            >
              <X className='h-4 w-4' />
            </Button>
          </Card>
        ) : (
          <div
            {...getRootProps()}
            className={cn(
              'border-border hover:border-primary flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors',
              isDragActive && 'border-primary bg-primary/5',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            <input {...getInputProps()} />
            <Upload className='text-muted-foreground mb-2 h-8 w-8' />
            <p className='text-muted-foreground text-sm'>
              {isDragActive
                ? 'Drop the image here'
                : 'Drag & drop an image here, or click to select'}
            </p>
            <p className='text-muted-foreground mt-1 text-xs'>
              Max size: {maxSize / (1024 * 1024)}MB
            </p>
          </div>
        )}
      </div>

      {/* Crop Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className='max-w-3xl'>
          <DialogHeader>
            <DialogTitle>Crop Image</DialogTitle>
          </DialogHeader>

          {imageToCrop && (
            <div className='max-h-[60vh] overflow-auto'>
              <ReactCrop
                crop={crop}
                onChange={(c) => setCrop(c)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspectRatio}
              >
                <img
                  ref={imgRef}
                  src={imageToCrop}
                  alt='Crop preview'
                  className='max-w-full'
                />
              </ReactCrop>
            </div>
          )}

          <DialogFooter className='gap-2'>
            <Button
              type='button'
              variant='outline'
              onClick={() => {
                setShowCropDialog(false);
                setImageToCrop(null);
                setOriginalFile(null);
              }}
              disabled={uploading}
            >
              Cancel
            </Button>
            <Button
              type='button'
              variant='secondary'
              onClick={handleSkipCrop}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Uploading...
                </>
              ) : (
                'Skip Crop'
              )}
            </Button>
            <Button type='button' onClick={handleUpload} disabled={uploading}>
              {uploading ? (
                <>
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  Uploading...
                </>
              ) : (
                <>
                  <CropIcon className='mr-2 h-4 w-4' />
                  Crop & Upload
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
