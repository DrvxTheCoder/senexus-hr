import { z } from 'zod';

/**
 * Schema for creating a new employee
 */
export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, 'Le prénom est requis'),
  lastName: z.string().min(1, 'Le nom est requis'),
  matricule: z.string().min(1, 'Le matricule est requis'),
  departmentId: z.string().optional(),
  assignedClientId: z.string().optional(),
  assignmentStartDate: z.string().optional(),
  hireDate: z.string().min(1, "La date d'embauche est requise"),
  firstInterimDate: z.string().min(1, "La date de début d'intérim est requise"),
  phone: z.string().optional(),
  email: z.string().email('Email invalide').optional().or(z.literal('')),
  address: z.string().optional(),
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
  departmentId: z.string().optional().nullable(),
  assignedClientId: z.string().optional().nullable(),
  assignmentStartDate: z.string().optional().nullable(),
  hireDate: z.string().optional(),
  firstInterimDate: z.string().optional(),
  phone: z.string().optional().nullable(),
  email: z.string().email().optional().nullable().or(z.literal('')),
  address: z.string().optional().nullable(),
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
