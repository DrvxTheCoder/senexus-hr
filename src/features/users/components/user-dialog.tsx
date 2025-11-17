'use client';

import { UserMultiStepForm } from './user-form/UserMultiStepForm';

type UserDialogProps = {
  open: boolean;
  onClose: (refresh?: boolean) => void;
  user?: {
    id: string;
    name: string;
    email: string;
    image?: string;
    userFirms: Array<{ firmId: string; role: string }>;
  } | null;
};

export function UserDialog({ open, onClose, user }: UserDialogProps) {
  const handleSuccess = () => {
    onClose(true);
  };

  return (
    <UserMultiStepForm
      open={open}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      user={user}
      onSuccess={handleSuccess}
    />
  );
}
