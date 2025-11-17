'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { StepSidebar } from '@/modules/hr/components/employee-form/StepSidebar';
import { FormWrapper } from '@/modules/hr/components/employee-form/FormWrapper';
import { PersonalDetailsForm } from './PersonalDetailsForm';
import { AdministrativeForm } from './AdministrativeForm';
import { UserFormData, UserFormErrors } from './types';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

interface Step {
  id: number;
  name: string;
}

const steps: Step[] = [
  {
    id: 1,
    name: 'Détails personnels'
  },
  {
    id: 2,
    name: 'Administration'
  }
];

// Zod schemas
const personalDetailsSchema = z.object({
  name: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  image: z.string().optional()
});

const administrativeSchemaCreate = z
  .object({
    role: z
      .enum(['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'VIEWER'])
      .default('STAFF'),
    firmIds: z.array(z.string()).min(1, 'Au moins une entreprise requise'),
    employeeId: z.string().optional(),
    password: z
      .string()
      .min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string().min(1, 'Confirmation du mot de passe requise')
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword']
  });

const administrativeSchemaEdit = z.object({
  role: z
    .enum(['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'VIEWER'])
    .default('STAFF'),
  firmIds: z.array(z.string()).min(1, 'Au moins une entreprise requise'),
  employeeId: z.string().optional()
});

interface UserMultiStepFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user?: any;
  onSuccess: () => void;
}

const initialFormData: UserFormData = {
  name: '',
  email: '',
  image: '',
  employeeId: undefined,
  firmIds: [],
  role: 'STAFF',
  password: '',
  confirmPassword: ''
};

export function UserMultiStepForm({
  open,
  onOpenChange,
  user,
  onSuccess
}: UserMultiStepFormProps) {
  const isEditing = !!user;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);
  const [errors, setErrors] = useState<UserFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPhotoFile, setSelectedPhotoFile] = useState<File | null>(null);

  // Load user data when editing
  useEffect(() => {
    if (user) {
      const role = (user.userFirms[0]?.role || 'STAFF') as UserFormData['role'];
      const firmIds = user.userFirms.map((uf: any) => uf.firmId);

      setFormData({
        name: user.name || '',
        email: user.email || '',
        image: user.image || '',
        employeeId: (user as any).employeeId || undefined,
        firmIds,
        role,
        password: '',
        confirmPassword: ''
      });
    } else {
      setFormData(initialFormData);
    }
    setCurrentStep(1);
    setErrors({});
    setSelectedPhotoFile(null);
  }, [user, open]);

  const handleFieldChange = (field: keyof UserFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: UserFormErrors = {};

    if (currentStep === 1) {
      const result = personalDetailsSchema.safeParse(formData);
      if (!result.success) {
        result.error.issues.forEach((error) => {
          newErrors[error.path[0] as string] = error.message;
        });
      }
    } else if (currentStep === 2) {
      const schema = isEditing
        ? administrativeSchemaEdit
        : administrativeSchemaCreate;
      const result = schema.safeParse(formData);
      if (!result.success) {
        result.error.issues.forEach((error) => {
          const path = error.path.join('.');
          newErrors[path] = error.message;
        });
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) {
      return;
    }

    setIsSubmitting(true);

    try {
      let photoUrl = formData.image || '';

      // If a new photo file is selected, upload it first
      if (selectedPhotoFile) {
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedPhotoFile);

        const uploadRes = await fetch('/api/upload-image', {
          method: 'POST',
          body: uploadFormData
        });

        if (!uploadRes.ok) {
          const error = await uploadRes.json();
          throw new Error(error.error || 'Failed to upload image');
        }

        const uploadData = await uploadRes.json();
        photoUrl = uploadData.url;
      }

      // Prepare payload
      const payload: any = {
        name: formData.name,
        email: formData.email,
        image: photoUrl,
        role: formData.role,
        firmIds: formData.firmIds,
        employeeId: formData.employeeId
      };

      // Add password fields for new users
      if (!isEditing) {
        payload.password = formData.password;
        payload.confirmPassword = formData.confirmPassword;
      }

      const url = user ? `/api/users/${user.id}` : '/api/users';
      const method = user ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save user');
      }

      toast.success(
        user
          ? 'Utilisateur mis à jour avec succès'
          : 'Utilisateur créé avec succès'
      );

      onSuccess();
      onOpenChange(false);
      setFormData(initialFormData);
      setCurrentStep(1);
      setSelectedPhotoFile(null);
    } catch (error) {
      console.error('Error saving user:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Échec de l'enregistrement de l'utilisateur"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='h-fit max-h-[70vh] w-full max-w-[90vw] overflow-hidden p-0 md:max-h-[90vh] md:max-w-[70vw]'>
        <DialogHeader className='sr-only'>
          <DialogTitle>
            {user ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
          </DialogTitle>
        </DialogHeader>

        <div className='flex h-[600px] p-0'>
          <StepSidebar currentStep={currentStep} steps={steps} />

          <div className='flex flex-1 flex-col'>
            <div className='p-4 text-2xl font-bold'>
              {user ? "Modifier l'utilisateur" : 'Ajouter un utilisateur'}
            </div>
            <Separator className='mb-2' />
            <div className='flex-1 overflow-y-auto px-6 py-4'>
              <AnimatePresence mode='wait'>
                {currentStep === 1 && (
                  <FormWrapper
                    key='step1'
                    title='Détails personnels'
                    description="Renseignez les informations de base de l'utilisateur"
                  >
                    <PersonalDetailsForm
                      formData={formData}
                      errors={errors}
                      onChange={handleFieldChange}
                      onPhotoFileChange={setSelectedPhotoFile}
                    />
                  </FormWrapper>
                )}

                {currentStep === 2 && (
                  <FormWrapper
                    key='step2'
                    title='Administration'
                    description="Définissez les accès et permissions de l'utilisateur"
                  >
                    <AdministrativeForm
                      formData={formData}
                      errors={errors}
                      onChange={handleFieldChange}
                      isEditing={isEditing}
                    />
                  </FormWrapper>
                )}
              </AnimatePresence>
            </div>

            <div className='bg-muted/30 flex items-center justify-between border-t px-6 py-4'>
              <Button
                type='button'
                variant='outline'
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={currentStep === 1 ? 'invisible' : ''}
              >
                Précédent
              </Button>

              <div className='flex gap-2'>
                <Button
                  type='button'
                  variant='outline'
                  onClick={() => onOpenChange(false)}
                >
                  Annuler
                </Button>

                {currentStep < steps.length ? (
                  <Button type='button' onClick={handleNext}>
                    Suivant
                  </Button>
                ) : (
                  <Button
                    type='button'
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting
                      ? 'Enregistrement...'
                      : user
                        ? 'Mettre à jour'
                        : 'Créer'}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
