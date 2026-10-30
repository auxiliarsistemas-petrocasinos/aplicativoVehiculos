import { z } from 'zod';
export const answerSchema = z
  .object({
    item_id: z.string().min(1),
    rating: z.enum(['good', 'regular', 'bad', 'na']),
    observation: z.string().max(2000),
    photos: z.array(z.uuid()).max(5),
  })
  .superRefine((a, ctx) => {
    if (['regular', 'bad'].includes(a.rating)) {
      if (!a.observation.trim())
        ctx.addIssue({ code: 'custom', path: ['observation'], message: 'Agrega una observación.' });
      if (!a.photos.length)
        ctx.addIssue({
          code: 'custom',
          path: ['photos'],
          message: 'Agrega al menos una fotografía.',
        });
    }
  });
export const inspectionSchema = z.object({
  template_id: z.uuid(),
  odometer: z.number().finite().nonnegative(),
  answers: z.array(answerSchema).min(1),
  signature: z.uuid().optional(),
});
export function photoError(file: { size: number; type: string }) {
  return file.size > 8 * 1024 * 1024
    ? 'La fotografía supera 8 MB.'
    : !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)
      ? 'Utiliza JPG, PNG o WebP.'
      : file.size === 0
        ? 'El archivo está vacío.'
        : null;
}
