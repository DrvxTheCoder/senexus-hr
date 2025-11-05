import { z } from 'zod';

/**
 * Schema for creating a new employee
 */
export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  matricule: z.string().min(1, 'Le matricule est requis'),
  photoUrl: z.string().optional(),
  departmentId: z.string().optional(),
  assignedClientId: z.string().optional(),
  hireDate: z.string().min(1, "La date d'embauche est requise"),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().optional(),

  // Additional personal information
  dateOfBirth: z.string().optional(),
  placeOfBirth: z.string().optional(),
  maritalStatus: z.string().optional(),
  nationality: z.string().optional(),
  cni: z.string().optional(),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  jobTitle: z.string().optional(),
  category: z.string().optional(),
  contractEndDate: z.string().optional(),

  emergencyContact: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional()
    })
    .optional(),
  status: z
    .enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED', 'ON_LEAVE'])
    .default('ACTIVE')
});

/**
 * Schema for updating an existing employee
 */
export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  matricule: z.string().min(1).optional(),
  photoUrl: z.string().optional().nullable(),
  departmentId: z.string().optional().nullable(),
  assignedClientId: z.string().optional().nullable(),
  hireDate: z.string().optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),

  // Additional personal information
  dateOfBirth: z.string().optional().nullable(),
  placeOfBirth: z.string().optional().nullable(),
  maritalStatus: z.string().optional().nullable(),
  nationality: z.string().optional().nullable(),
  cni: z.string().optional().nullable(),
  fatherName: z.string().optional().nullable(),
  motherName: z.string().optional().nullable(),
  jobTitle: z.string().optional().nullable(),
  category: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),

  emergencyContact: z
    .object({
      name: z.string().optional(),
      phone: z.string().optional(),
      relationship: z.string().optional()
    })
    .optional()
    .nullable(),
  status: z
    .enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TERMINATED', 'ON_LEAVE'])
    .optional()
});

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>;
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>;
