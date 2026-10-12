import type { Snapshot, Vehicle } from '@/lib/types';
export function eligibleVehicles(data: Snapshot, fieldId = data.profile.field_id) {
  return data.vehicles.filter(
    (v) =>
      v.field_id === fieldId &&
      v.active &&
      v.fitness !== 'unfit' &&
      data.vehicleStates.some((state) => state.vehicle_id === v.id && state.eligible) &&
      !data.restrictions.some((r) => r.vehicle_id === v.id && !r.lifted_at),
  );
}
export function vehicleAvailability(v: Vehicle, data: Snapshot) {
  return data.vehicleStates.some((state) => state.vehicle_id === v.id && state.in_use)
    ? 'En uso'
    : data.restrictions.some((r) => r.vehicle_id === v.id && !r.lifted_at)
      ? 'Restringido'
      : 'Fuera de uso';
}
