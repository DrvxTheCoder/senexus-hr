import { z } from 'zod';

export const userSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
  email: z.string().email('Adresse email invalide'),
  role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'VIEWER']),
  firmIds: z
    .array(z.string())
    .min(1, 'Au moins une entreprise doit être sélectionnée'),
  employeeId: z.string().optional(),
  password: z.string().optional(),
  confirmPassword: z.string().optional()
});

export const userWithPasswordSchema = z
  .object({
    name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
    email: z.string().email('Adresse email invalide'),
    role: z.enum(['OWNER', 'ADMIN', 'MANAGER', 'STAFF', 'VIEWER']),
    firmIds: z
      .array(z.string())
      .min(1, 'Au moins une entreprise doit être sélectionnée'),
    employeeId: z.string().optional(),
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword']
  });

export const passwordChangeSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword']
  });

export type UserFormData = z.infer<typeof userSchema>;
export type UserWithPasswordFormData = z.infer<typeof userWithPasswordSchema>;
export type PasswordChangeFormData = z.infer<typeof passwordChangeSchema>;
