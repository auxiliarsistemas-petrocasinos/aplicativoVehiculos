import type { Snapshot } from '@/lib/types';
import { statusLabels } from '@/lib/types';
export function operationDate(value: string) {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'America/Bogota',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date(value));
}
export function metrics(data: Snapshot, field = '', from = '', to = '') {
  const inPeriod = (s: Snapshot['shifts'][number]) =>
    (!field || s.field_id === field) &&
    (!from || operationDate(s.created_at) >= from) &&
    (!to || operationDate(s.created_at) <= to);
  const shifts = data.shifts.filter(inPeriod);
  const ids = new Set(shifts.map((s) => s.id));
  const vehicles = data.vehicles.filter((v) => !field || v.field_id === field);
  const vehicleIds = new Set(vehicles.map((v) => v.id));
  const states = data.vehicleStates.filter((state) => vehicleIds.has(state.vehicle_id));
  const months = [...new Set(shifts.map((s) => operationDate(s.created_at).slice(0, 7)))].sort();
  const trend = months.map((month) => ({
    month,
    turnos: shifts.filter((s) => operationDate(s.created_at).startsWith(month)).length,
  }));
  return {
    shifts,
    vehicles,
    trend,
    active: shifts.filter((s) => ['active', 'closing'].includes(s.status)).length,
    inUse: states.filter((state) => state.in_use).length,
    pending: data.incidents.filter((i) => ids.has(i.shift_id) && i.status !== 'resolved').length,
    restricted: new Set(
      data.restrictions
        .filter((r) => !r.lifted_at && vehicleIds.has(r.vehicle_id))
        .map((r) => r.vehicle_id),
    ).size,
    kilometers: data.usages
      .filter((u) => ids.has(u.shift_id) && u.end_km !== null)
      .reduce((n, u) => n + (u.end_km! - u.start_km), 0),
    byField: data.fields
      .filter((f) => !field || field === f.id)
      .map((f) => ({
        name: f.name,
        turnos: shifts.filter((s) => s.field_id === f.id).length,
        vehiculos: vehicles.filter((v) => v.field_id === f.id).length,
      })),
  };
}
export function csvCell(value: unknown) {
  let s = String(value ?? '');
  if (/^[=+\-@\t\r]/.test(s)) s = "'" + s;
  return '"' + s.replaceAll('"', '""') + '"';
}
export function shiftsCsv(data: Snapshot, field = '', from = '', to = '') {
  return (
    '\ufeff' +
    [
      ['ID', 'Campo', 'Estado', 'Apertura', 'Cierre', 'Kilómetros'],
      ...metrics(data, field, from, to).shifts.map((s) => [
        s.id,
        data.fields.find((f) => f.id === s.field_id)?.name ?? s.field_id,
        statusLabels[s.status],
        s.opened_at,
        s.closed_at,
        data.usages
          .filter((u) => u.shift_id === s.id && u.end_km !== null)
          .reduce((n, u) => n + u.end_km! - u.start_km, 0),
      ]),
    ]
      .map((r) => r.map(csvCell).join(';'))
      .join('\r\n')
  );
}
