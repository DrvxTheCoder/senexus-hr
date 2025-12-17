'use client';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, ExternalLink } from 'lucide-react';

interface PDFPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  pdfUrl: string;
  fileName: string;
}

export function PDFPreviewModal({
  isOpen,
  onClose,
  pdfUrl,
  fileName
}: PDFPreviewModalProps) {
  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenNewTab = () => {
    window.open(pdfUrl, '_blank');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='h-fit max-h-[70vh] w-full max-w-[90vw] overflow-hidden pt-12 md:max-h-[90vh] md:max-w-[70vw]'>
        <DialogHeader>
          <div className='flex items-center justify-between'>
            <DialogTitle>{fileName}</DialogTitle>
            <div className='flex gap-2'>
              <Button variant='outline' size='sm' onClick={handleOpenNewTab}>
                <ExternalLink className='mr-2 h-4 w-4' />
                Ouvrir dans un nouvel onglet
              </Button>
              <Button variant='outline' size='sm' onClick={handleDownload}>
                <Download className='mr-2 h-4 w-4' />
                Télécharger
              </Button>
            </div>
          </div>
        </DialogHeader>
        <div className='h-[75vh] w-full overflow-hidden rounded-lg border'>
          <iframe src={pdfUrl} className='h-full w-full' title={fileName} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
