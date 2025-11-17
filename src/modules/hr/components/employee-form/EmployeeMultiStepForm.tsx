'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AnimatePresence } from 'framer-motion';
import { z } from 'zod';
import { StepSidebar } from './StepSidebar';
import { FormWrapper } from './FormWrapper';
import { PersonalInfoForm } from './PersonalInfoForm';
import { ProfessionalInfoForm } from './ProfessionalInfoForm';
import { EmployeeFormData, EmployeeFormErrors } from './types';
import { Separator } from '@/components/ui/separator';

interface Step {
  id: number;
  name: string;
  // description: string;
}

const steps: Step[] = [
  {
    id: 1,
    name: 'Informations personnelles'
    // description: 'Données personnelles',
  },
  {
    id: 2,
    name: 'Informations professionnelles'
    // description: 'Données de travail',
  }
];

// Zod schemas
const personalInfoSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  matricule: z.string().min(1, 'Matricule requis'),
  email: z.string().email('Email invalide'),
  phone: z.string().min(1, 'Téléphone requis'),
  dateOfBirth: z.string().min(1, 'Date de naissance requise'),
  placeOfBirth: z.string().min(1, 'Lieu de naissance requis'),
  nationality: z.string().min(1, 'Nationalité requise'),
  cni: z.string().min(1, 'CNI requise'),
  maritalStatus: z.string().min(1, 'État civil requis'),
  address: z.string().min(1, 'Adresse requise'),
  fatherName: z.string().min(1, 'Nom du père requis'),
  motherName: z.string().min(1, 'Nom de la mère requis'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  photoUrl: z.string().optional()
});

const professionalInfoSchema = z.object({
  jobTitle: z.string().min(1, 'Poste requis'),
  category: z.string().min(1, 'Catégorie requise'),
  netSalary: z.string().min(1, 'Salaire net requis'),
  hireDate: z.string().min(1, "Date d'embauche requise"),
  contractEndDate: z.string().optional(),
  departmentId: z.string().min(1, 'Département requis'),
  assignedClientId: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ON_LEAVE', 'SUSPENDED', 'TERMINATED']),
  emergencyContact: z.object({
    name: z.string().min(1, 'Nom du contact requis'),
    phone: z.string().min(1, 'Téléphone du contact requis'),
    relationship: z.string().min(1, 'Relation requise')
  })
});

interface EmployeeMultiStepFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  employee?: any;
  onSuccess: () => void;
}

const initialFormData: EmployeeFormData = {
  firstName: '',
  lastName: '',
  matricule: '',
  photoUrl: '',
  email: '',
  phone: '',
  address: '',
  dateOfBirth: '',
  placeOfBirth: '',
  gender: undefined,
  maritalStatus: '',
  nationality: '',
  cni: '',
  fatherName: '',
  motherName: '',
  jobTitle: '',
  category: '',
  netSalary: '',
  hireDate: '',
  contractEndDate: '',
  departmentId: '',
  assignedClientId: '',
  status: 'ACTIVE',
  emergencyContact: {
    name: '',
    phone: '',
    relationship: ''
  }
};

export function EmployeeMultiStepForm({
  open,
  onOpenChange,
  employee,
  onSuccess
}: EmployeeMultiStepFormProps) {
  const params = useParams();
  const firmSlug = params.firmSlug as string;
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<EmployeeFormData>(initialFormData);
  const [errors, setErrors] = useState<EmployeeFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [firmId, setFirmId] = useState<string>('');

  // Fetch firm ID from slug
  useEffect(() => {
    if (firmSlug) {
      fetch(`/api/firms?slug=${firmSlug}`)
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data) && data.length > 0) {
            setFirmId(data[0].id);
          }
        })
        .catch(console.error);
    }
  }, [firmSlug]);

  // Load employee data when editing
  useEffect(() => {
    if (employee) {
      setFormData({
        firstName: employee.firstName || '',
        lastName: employee.lastName || '',
        matricule: employee.matricule || '',
        photoUrl: employee.photoUrl || '',
        email: employee.email || '',
        phone: employee.phone || '',
        address: employee.address || '',
        dateOfBirth: employee.dateOfBirth
          ? new Date(employee.dateOfBirth).toISOString().split('T')[0]
          : '',
        placeOfBirth: employee.placeOfBirth || '',
        gender: employee.gender || undefined,
        maritalStatus: employee.maritalStatus || '',
        nationality: employee.nationality || '',
        cni: employee.cni || '',
        fatherName: employee.fatherName || '',
        motherName: employee.motherName || '',
        jobTitle: employee.jobTitle || '',
        category: employee.category || '',
        netSalary: employee.netSalary?.toString() || '',
        hireDate: employee.hireDate
          ? new Date(employee.hireDate).toISOString().split('T')[0]
          : '',
        contractEndDate: employee.contractEndDate
          ? new Date(employee.contractEndDate).toISOString().split('T')[0]
          : '',
        departmentId: employee.departmentId || '',
        assignedClientId: employee.assignedClientId || '',
        status: employee.status || 'ACTIVE',
        emergencyContact: employee.emergencyContact || {
          name: '',
          phone: '',
          relationship: ''
        }
      });
    } else {
      setFormData(initialFormData);
    }
    setCurrentStep(1);
    setErrors({});
  }, [employee, open]);

  const handleFieldChange = (field: keyof EmployeeFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const validateCurrentStep = (): boolean => {
    const newErrors: EmployeeFormErrors = {};

    if (currentStep === 1) {
      const result = personalInfoSchema.safeParse(formData);
      if (!result.success) {
        result.error.issues.forEach((error) => {
          newErrors[error.path[0] as string] = error.message;
        });
      }
    } else if (currentStep === 2) {
      const result = professionalInfoSchema.safeParse(formData);
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
      // Get firm ID from slug
      const firmResponse = await fetch(`/api/firms?slug=${firmSlug}`);
      const firms = await firmResponse.json();
      const firmId = firms[0]?.id;

      if (!firmId) {
        throw new Error('Firm not found');
      }

      const payload = {
        ...formData,
        firmId,
        dateOfBirth: formData.dateOfBirth
          ? new Date(formData.dateOfBirth).toISOString()
          : undefined,
        hireDate: formData.hireDate
          ? new Date(formData.hireDate).toISOString()
          : undefined,
        contractEndDate: formData.contractEndDate
          ? new Date(formData.contractEndDate).toISOString()
          : undefined,
        netSalary: formData.netSalary
          ? parseFloat(formData.netSalary)
          : undefined,
        gender: formData.gender || undefined
      };

      const url = employee ? `/api/employees/${employee.id}` : '/api/employees';
      const method = employee ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to save employee');
      }

      onSuccess();
      onOpenChange(false);
      setFormData(initialFormData);
      setCurrentStep(1);
    } catch (error) {
      console.error('Error saving employee:', error);
      alert(error instanceof Error ? error.message : 'Failed to save employee');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='h-fit max-h-[70vh] w-full max-w-[90vw] overflow-hidden p-0 md:max-h-[90vh] md:max-w-[70vw]'>
        <DialogHeader className='sr-only'>
          <DialogTitle>
            {employee ? "Modifier l'employé" : 'Nouvel employé'}
          </DialogTitle>
        </DialogHeader>

        <div className='flex h-[600px] p-0'>
          <StepSidebar currentStep={currentStep} steps={steps} />

          <div className='flex flex-1 flex-col'>
            <div className='p-4 text-2xl font-bold'>
              {employee ? "Modifier l'employé" : 'Ajouter un employé'}
            </div>
            <Separator className='mb-2' />
            <div className='flex-1 overflow-y-auto px-6 py-4'>
              <AnimatePresence mode='wait'>
                {currentStep === 1 && (
                  <FormWrapper
                    key='step1'
                    title='Informations personnelles'
                    description="Renseignez les données personnelles de l'employé"
                  >
                    <PersonalInfoForm
                      formData={formData}
                      errors={errors}
                      onChange={handleFieldChange}
                    />
                  </FormWrapper>
                )}

                {currentStep === 2 && (
                  <FormWrapper
                    key='step2'
                    title='Informations professionnelles'
                    description="Renseignez les données de travail de l'employé"
                  >
                    <ProfessionalInfoForm
                      formData={formData}
                      errors={errors}
                      onChange={handleFieldChange}
                      firmId={firmId}
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
                      : employee
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
