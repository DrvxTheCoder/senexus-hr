'use client';

import { ensureHttps } from '@/lib/utils';
import { ImagePreviewModal } from './ImagePreviewModal';
import { PDFPreviewModal } from './PDFPreviewModal';

interface DocumentPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileUrl: string;
  fileName: string;
  mimeType: string;
}

export function DocumentPreviewModal({
  isOpen,
  onClose,
  fileUrl,
  fileName,
  mimeType
}: DocumentPreviewModalProps) {
  const isPDF = mimeType === 'application/pdf';
  const isImage = mimeType.startsWith('image/');
  const secureUrl = ensureHttps(fileUrl);

  if (isPDF) {
    return (
      <PDFPreviewModal
        isOpen={isOpen}
        onClose={onClose}
        pdfUrl={secureUrl}
        fileName={fileName}
      />
    );
  }

  if (isImage) {
    return (
      <ImagePreviewModal
        isOpen={isOpen}
        onClose={onClose}
        imageUrl={secureUrl}
        fileName={fileName}
      />
    );
  }

  // Fallback for unsupported types (shouldn't happen with our restrictions)
  return null;
}
