import 'server-only';
import { z } from 'zod';
import { session } from '@/features/auth/session';
import type { Snapshot } from '@/lib/types';

const PAGE_SIZE = 50;
const MAX_PAGE_SIZE = 200;

export const listFiltersSchema = z.object({
  cursor: z.string().trim().min(1).max(80).optional(),
  limit: z.coerce.number().int().min(1).max(MAX_PAGE_SIZE).default(PAGE_SIZE),
  field: z.string().uuid().optional(),
  status: z.string().trim().min(1).max(40).optional(),
  search: z.string().trim().max(80).optional(),
});

export type ListFilters = z.input<typeof listFiltersSchema>;

type TableName =
  | 'fields'
  | 'vehicles'
  | 'shifts'
  | 'vehicle_usages'
  | 'incidents'
  | 'vehicle_restrictions'
  | 'vehicle_change_authorizations'
  | 'profiles';

const columns: Record<TableName, string> = {
  fields: 'id,name,active',
  vehicles: 'id,plate,description,vehicle_type,field_id,active,fitness,odometer',
  shifts:
    'id,driver_id,field_id,status,created_at,opened_at,closed_at,regularization_reason,missing',
  vehicle_usages:
    'id,shift_id,vehicle_id,field_id,plate_snapshot,received_at,delivered_at,start_km,end_km',
  incidents: 'id,shift_id,usage_id,vehicle_id,driver_id,description,status,created_at',
  vehicle_restrictions: 'id,vehicle_id,reason,lifted_at',
  vehicle_change_authorizations: 'id,shift_id,old_usage_id,replacement_id,reason,used_at',
  profiles:
    'id,alias,full_name,email,phone,role,field_id,active,must_change_password,reset_in_progress',
};

function empty(profile: Snapshot['profile']): Snapshot {
  return {
    profile,
    fields: [],
    vehicles: [],
    shifts: [],
    usages: [],
    incidents: [],
    restrictions: [],
    authorizations: [],
    profiles: [],
    templateId: '',
    templateVersion: '',
    inspectionItems: [],
    vehicleStates: [],
  };
}

async function loadTables(tables: readonly TableName[], rawFilters: ListFilters = {}) {
  const { db, profile } = await session();
  const filters = listFiltersSchema.parse(rawFilters);
  const data = empty(profile);
  const results = await Promise.all(
    tables.map(async (table) => {
      let query = db.from(table).select(columns[table]).limit(filters.limit);
      if (table === 'shifts' || table === 'incidents') {
        query = query.order('created_at', { ascending: false });
        if (filters.cursor) query = query.lt('created_at', filters.cursor);
      } else {
        query = query.order('id');
        if (filters.cursor && ['vehicles', 'profiles'].includes(table))
          query = query.gt('id' as never, filters.cursor);
      }
      if (filters.field && ['vehicles', 'shifts'].includes(table))
        query = query.eq('field_id' as never, filters.field);
      if (filters.status && ['shifts', 'incidents'].includes(table))
        query = query.eq('status' as never, filters.status);
      if (filters.search && table === 'vehicles')
        query = query.or(`plate.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
      if (filters.search && table === 'profiles')
        query = query.or(`alias.ilike.%${filters.search}%,full_name.ilike.%${filters.search}%`);
      const { data: rows, error } = await query;
      if (error) throw new Error('No fue posible consultar la operación. Intenta nuevamente.');
      return [table, rows ?? []] as const;
    }),
  );
  for (const [table, rows] of results) {
    if (table === 'vehicle_usages') data.usages = rows as unknown as Snapshot['usages'];
    else if (table === 'vehicle_restrictions')
      data.restrictions = rows as unknown as Snapshot['restrictions'];
    else if (table === 'vehicle_change_authorizations')
      data.authorizations = rows as unknown as Snapshot['authorizations'];
    else (data as unknown as Record<string, unknown>)[table] = rows;
  }
  return { db, data, filters };
}

async function withCatalog(data: Snapshot, db: Awaited<ReturnType<typeof session>>['db']) {
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
    .select('id,label,category,vehicle_type,sources')
    .eq('template_id', template.id)
    .order('position')
    .limit(MAX_PAGE_SIZE);
  if (itemsError || !items?.length)
    throw new Error('No fue posible consultar los controles de la plantilla.');
  data.templateId = template.id;
  data.templateVersion = template.version;
  data.inspectionItems = items.map((item) => ({
    id: item.id,
    label: item.label,
    category: item.category,
    vehicleType: item.vehicle_type,
    sources: item.sources as unknown as string[],
  }));
}

async function withAvailability(data: Snapshot, db: Awaited<ReturnType<typeof session>>['db']) {
  const { data: states, error } = await db.rpc('vehicle_availability');
  if (error) throw new Error('No se pudo consultar disponibilidad de vehículos.');
  data.vehicleStates = states ?? [];
}

export async function getDashboardData(filters: ListFilters = {}) {
  const { db, data } = await loadTables(
    ['fields', 'vehicles', 'shifts', 'vehicle_usages', 'incidents', 'vehicle_restrictions'],
    { ...filters, limit: filters.limit ?? MAX_PAGE_SIZE },
  );
  await withAvailability(data, db);
  return data;
}

export async function getCurrentShift() {
  const { db, data } = await loadTables(['fields', 'vehicles', 'vehicle_restrictions'], {
    limit: MAX_PAGE_SIZE,
  });
  const { data: shifts, error: shiftError } = await db
    .from('shifts')
    .select(columns.shifts)
    .in('status', ['opening', 'active', 'closing'])
    .order('created_at', { ascending: false })
    .limit(2);
  if (shiftError) throw new Error('No fue posible consultar el turno actual.');
  data.shifts = shifts as unknown as Snapshot['shifts'];
  const shiftIds = data.shifts.map((shift) => shift.id);
  if (shiftIds.length) {
    const [usages, incidents, authorizations] = await Promise.all([
      db
        .from('vehicle_usages')
        .select(columns.vehicle_usages)
        .in('shift_id', shiftIds)
        .order('received_at')
        .limit(50),
      db
        .from('incidents')
        .select(columns.incidents)
        .in('shift_id', shiftIds)
        .order('created_at', { ascending: false })
        .limit(50),
      db
        .from('vehicle_change_authorizations')
        .select(columns.vehicle_change_authorizations)
        .in('shift_id', shiftIds)
        .order('id')
        .limit(20),
    ]);
    if (usages.error || incidents.error || authorizations.error)
      throw new Error('No fue posible consultar el turno actual.');
    data.usages = usages.data as unknown as Snapshot['usages'];
    data.incidents = incidents.data as unknown as Snapshot['incidents'];
    data.authorizations = authorizations.data as unknown as Snapshot['authorizations'];
  }
  await Promise.all([withCatalog(data, db), withAvailability(data, db)]);
  return data;
}

export async function listShifts(filters: ListFilters = {}) {
  const loaded = await loadTables(['fields', 'shifts', 'vehicle_usages', 'profiles'], filters);
  if (loaded.data.shifts.length === loaded.filters.limit)
    loaded.data.nextCursor = loaded.data.shifts.at(-1)?.created_at;
  return loaded.data;
}

export async function getShiftDetail(id: string) {
  const parsedId = z.string().uuid().parse(id);
  const { db, data } = await loadTables(['fields', 'vehicles', 'vehicle_restrictions'], {
    limit: MAX_PAGE_SIZE,
  });
  const [shift, usages, incidents, authorizations] = await Promise.all([
    db.from('shifts').select(columns.shifts).eq('id', parsedId).maybeSingle(),
    db
      .from('vehicle_usages')
      .select(columns.vehicle_usages)
      .eq('shift_id', parsedId)
      .order('received_at')
      .limit(50),
    db
      .from('incidents')
      .select(columns.incidents)
      .eq('shift_id', parsedId)
      .order('created_at', { ascending: false })
      .limit(200),
    db
      .from('vehicle_change_authorizations')
      .select(columns.vehicle_change_authorizations)
      .eq('shift_id', parsedId)
      .order('id')
      .limit(50),
  ]);
  if (shift.error || usages.error || incidents.error || authorizations.error)
    throw new Error('No fue posible consultar el detalle del turno.');
  data.shifts = shift.data ? ([shift.data] as unknown as Snapshot['shifts']) : [];
  data.usages = usages.data as unknown as Snapshot['usages'];
  data.incidents = incidents.data as unknown as Snapshot['incidents'];
  data.authorizations = authorizations.data as unknown as Snapshot['authorizations'];
  await withAvailability(data, db);
  return data;
}

export async function listVehicles(filters: ListFilters = {}) {
  const {
    db,
    data,
    filters: parsed,
  } = await loadTables(['fields', 'vehicles', 'vehicle_restrictions'], filters);
  await withAvailability(data, db);
  if (data.vehicles.length === parsed.limit) data.nextCursor = data.vehicles.at(-1)?.id;
  return data;
}

export async function listDrivers(filters: ListFilters = {}) {
  const loaded = await loadTables(['fields', 'profiles'], filters);
  if (loaded.data.profiles.length === loaded.filters.limit)
    loaded.data.nextCursor = loaded.data.profiles.at(-1)?.id;
  return loaded.data;
}

export async function listIncidents(filters: ListFilters = {}) {
  const loaded = await loadTables(['incidents', 'shifts', 'vehicle_usages', 'profiles'], filters);
  if (loaded.data.incidents.length === loaded.filters.limit)
    loaded.data.nextCursor = loaded.data.incidents.at(-1)?.created_at;
  return loaded.data;
}

export async function getFieldsData() {
  return (await loadTables(['fields', 'profiles', 'vehicles'], { limit: MAX_PAGE_SIZE })).data;
}

export async function getProfile() {
  return (await loadTables(['fields'])).data;
}
