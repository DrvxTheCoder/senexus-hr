import { z } from 'zod';
import { DEFAULT_THEMES } from '@/lib/constants/themes';

const themeValues = DEFAULT_THEMES.map((t) => t.value) as [string, ...string[]];

export const firmSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  slug: z
    .string()
    .min(2, 'Slug must be at least 2 characters')
    .regex(
      /^[a-z0-9-]+$/,
      'Slug must be lowercase alphanumeric with hyphens only'
    ),
  holdingId: z.string().min(1, 'Holding is required'),
  logo: z
    .union([
      z.string().url('Logo must be a valid URL'),
      z.literal(''),
      z.undefined()
    ])
    .optional(),
  themeColor: z.enum(themeValues)
});

export type FirmFormData = z.infer<typeof firmSchema>;
