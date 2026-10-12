'use server';
import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { session } from '@/features/auth/session';
import { inspectionSchema } from '@/features/inspections/validation';
import { incidentSchema } from '@/features/incidents/validation';
import { fieldSchema } from '@/features/fields/validation';
const requestSchema = z.object({
  action: z.string().max(80),
  payload: z.record(z.string(), z.unknown()),
  requestId: z.uuid(),
});
export async function execute(input: unknown): Promise<{ id?: string; error?: string }> {
  try {
    const { action, payload, requestId } = requestSchema.parse(input);
    const { db } = await session();
    if (action === 'create_field') fieldSchema.parse(payload);
    if (['confirm_opening', 'close_shift'].includes(action))
      inspectionSchema.parse(payload.inspection);
    if (action === 'substitute') {
      inspectionSchema.parse(payload.delivery);
      inspectionSchema.parse(payload.reception);
    }
    if (action === 'report_incident') incidentSchema.parse(payload);
    const { data, error } = await db.rpc('execute_command', {
      action,
      payload,
      request_id: requestId,
    });
    if (error)
      return {
        error:
          error.code === '23505'
            ? 'Ya existe un turno o una asignación vigente. Actualiza antes de continuar.'
            : error.code === 'P0001' || error.code === '42501'
              ? error.message
              : 'No se pudo confirmar la operación. Revisa los datos y reintenta con el mismo formulario.',
      };
    revalidatePath('/');
    return { id: data.id };
  } catch (error) {
    return {
      error:
        error instanceof z.ZodError
          ? 'Completa los campos, fotografías y observaciones requeridos.'
          : 'No se confirmó el guardado. Conserva el formulario y reintenta.',
    };
  }
}
export async function saveDraft(shiftId: string, kind: string, data: Record<string, unknown>) {
  try {
    const { db } = await session();
    const { error } = await db.rpc('save_draft', { shift_id: shiftId, kind, data });
    return error
      ? { error: 'No se confirmó el borrador. Mantén abierto el formulario y reintenta.' }
      : { ok: true };
  } catch {
    return { error: 'No se confirmó el borrador. Revisa tu conexión.' };
  }
}
