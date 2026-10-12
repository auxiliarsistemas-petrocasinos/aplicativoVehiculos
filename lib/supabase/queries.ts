import 'server-only';
import { session } from '@/features/auth/session';
import type { Snapshot } from '@/lib/types';
export async function getSnapshot(): Promise<Snapshot> {
  const { db, profile } = await session();
  const tables = [
    'fields',
    'vehicles',
    'shifts',
    'vehicle_usages',
    'incidents',
    'vehicle_restrictions',
    'vehicle_change_authorizations',
    'profiles',
  ] as const;
  const results = await Promise.all(
    tables.map(async (t) => {
      const rows: Record<string, unknown>[] = [];
      for (let offset = 0; ; offset += 1000) {
        const { data, error } = await db
          .from(t)
          .select('*')
          .order('id')
          .range(offset, offset + 999);
        if (error) throw new Error('No fue posible consultar la operación. Intenta nuevamente.');
        rows.push(...data);
        if (data.length < 1000) break;
      }
      return { data: rows };
    }),
  );
  const { data: template, error } = await db
    .from('form_templates')
    .select('id,version')
    .eq('status', 'demo_only')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();
  if (error || !template) throw new Error('El catálogo de formularios requiere migraciones.');
  const { data: items, error: itemsError } = await db
    .from('form_items')
    .select('*')
    .eq('template_id', template.id)
    .order('position');
  if (itemsError || !items?.length)
    throw new Error('No fue posible consultar los controles de la plantilla.');
  const { data: vehicleStates, error: availabilityError } = await db.rpc('vehicle_availability');
  if (availabilityError) throw new Error('No se pudo consultar disponibilidad de vehículos.');
  return {
    vehicleStates,
    profile,
    fields: results[0].data!,
    vehicles: results[1].data!,
    shifts: results[2].data!,
    usages: results[3].data!,
    incidents: results[4].data!,
    restrictions: results[5].data!,
    authorizations: results[6].data!,
    profiles: results[7].data!,
    templateId: template.id,
    templateVersion: template.version,
    inspectionItems: items.map((i) => ({
      id: i.id,
      label: i.label,
      category: i.category,
      vehicleType: i.vehicle_type,
      sources: i.sources,
    })),
  } as Snapshot;
}
