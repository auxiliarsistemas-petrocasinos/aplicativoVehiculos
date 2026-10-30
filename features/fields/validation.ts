import { z } from 'zod';
export const fieldSchema = z.object({ name: z.string().trim().min(1).max(120) });
