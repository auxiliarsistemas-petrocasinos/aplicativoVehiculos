import { z } from 'zod';
export const incidentSchema = z.object({
  shift_id: z.uuid(),
  description: z.string().trim().min(1, 'Escribe una descripción.').max(4000),
  photos: z.array(z.uuid()).min(1, 'Agrega al menos una fotografía.').max(8),
});
