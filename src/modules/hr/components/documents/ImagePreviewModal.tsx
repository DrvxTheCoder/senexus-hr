'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import { useState } from 'react';

interface ImagePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  fileName: string;
}

export function ImagePreviewModal({
  isOpen,
  onClose,
  imageUrl,
  fileName
}: ImagePreviewModalProps) {
  const [zoom, setZoom] = useState(100);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200));
  };

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-h-[90vh] max-w-4xl'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle>{fileName}</DialogTitle>
            <div className='flex gap-2'>
              <Button
                variant='outline'
                size='sm'
                onClick={handleZoomOut}
                disabled={zoom <= 50}
              >
                <ZoomOut className='h-4 w-4' />
              </Button>
              <span className='text-muted-foreground min-w-[3rem] self-center text-center text-sm'>
                {zoom}%
              </span>
              <Button
                variant='outline'
                size='sm'
                onClick={handleZoomIn}
                disabled={zoom >= 200}
              >
                <ZoomIn className='h-4 w-4' />
              </Button>
              <Button variant='outline' size='sm' onClick={handleDownload}>
                <Download className='mr-2 h-4 w-4' />
                Télécharger
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className='bg-muted/30 flex max-h-[70vh] items-center justify-center overflow-auto rounded-lg p-4'>
          <img
            src={imageUrl}
            alt={fileName}
            style={{
              width: `${zoom}%`,
              maxWidth: 'none',
              height: 'auto'
            }}
            className='object-contain'
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
