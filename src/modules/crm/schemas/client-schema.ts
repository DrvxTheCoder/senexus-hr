import { z } from 'zod';

/**
 * Schema for creating a new client
 */
export const createClientSchema = z.object({
  name: z.string().min(1, 'Le nom du client est requis'),
  contactName: z.string().optional(),
  contactEmail: z.string().email('Email invalide').optional().or(z.literal('')),
  contactPhone: z.string().optional(),
  taxNumber: z.string().optional(),
  address: z.string().optional(),
  industry: z.string().optional(),
  tags: z.array(z.string()).default([]),
  status: z
    .enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'ARCHIVED'])
    .default('PROSPECT'),
  contractStartDate: z.string().optional(),
  contractEndDate: z.string().optional(),
  notes: z.string().optional()
});

/**
 * Schema for updating an existing client
 */
export const updateClientSchema = z.object({
  name: z.string().min(1).optional(),
  contactName: z.string().optional().nullable(),
  contactEmail: z.string().email().optional().nullable().or(z.literal('')),
  contactPhone: z.string().optional().nullable(),
  taxNumber: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  industry: z.string().optional().nullable(),
  tags: z.array(z.string()).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'PROSPECT', 'ARCHIVED']).optional(),
  contractStartDate: z.string().optional().nullable(),
  contractEndDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable()
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
