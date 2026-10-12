export type Role = 'driver' | 'fleet_admin' | 'management' | 'it_superadmin';
export type VehicleType = 'light' | 'heavy';
export type Profile = {
  id: string;
  alias: string;
  full_name: string;
  email: string;
  phone: string;
  role: Role;
  field_id: string | null;
  active: boolean;
  must_change_password: boolean;
  reset_in_progress: boolean;
};
export type Field = { id: string; name: string; active: boolean };
export type Vehicle = {
  id: string;
  plate: string;
  description: string;
  vehicle_type: VehicleType;
  field_id: string;
  active: boolean;
  fitness: 'fit' | 'observations' | 'unfit';
  odometer: number;
};
export type Shift = {
  id: string;
  driver_id: string;
  field_id: string;
  status: 'opening' | 'active' | 'closing' | 'closed' | 'regularized';
  created_at: string;
  opened_at: string | null;
  closed_at: string | null;
  regularization_reason: string | null;
  missing: string[] | null;
};
export type Usage = {
  id: string;
  shift_id: string;
  vehicle_id: string;
  received_at: string;
  delivered_at: string | null;
  start_km: number;
  end_km: number | null;
  plate_snapshot: string;
  field_id: string;
};
export type Incident = {
  id: string;
  shift_id: string;
  usage_id: string;
  vehicle_id: string;
  driver_id: string;
  description: string;
  status: 'pending' | 'following' | 'resolved';
  created_at: string;
};
export type Restriction = {
  id: string;
  vehicle_id: string;
  reason: string;
  lifted_at: string | null;
};
export type Authorization = {
  id: string;
  shift_id: string;
  old_usage_id: string;
  replacement_id: string;
  reason: string;
  used_at: string | null;
};
export type Evidence = {
  id: string;
  owner_id: string;
  shift_id: string;
  kind: 'photo' | 'signature';
  path: string;
  entity_type: string | null;
  entity_id: string | null;
};
export type InspectionItem = {
  id: string;
  label: string;
  category: string;
  vehicleType: string;
  sources: string[];
};
export type Answer = {
  item_id: string;
  rating: 'good' | 'regular' | 'bad' | 'na';
  observation: string;
  photos: string[];
};
export type InspectionInput = {
  template_id: string;
  answers: Answer[];
  odometer: number;
  signature?: string;
};
export type Snapshot = {
  profile: Profile;
  fields: Field[];
  vehicles: Vehicle[];
  shifts: Shift[];
  usages: Usage[];
  incidents: Incident[];
  restrictions: Restriction[];
  authorizations: Authorization[];
  profiles: Profile[];
  templateId: string;
  templateVersion: string;
  inspectionItems: InspectionItem[];
  vehicleStates: { vehicle_id: string; in_use: boolean; eligible: boolean }[];
};
export const roleLabels: Record<Role, string> = {
  driver: 'Conductor',
  fleet_admin: 'Administración de flota',
  management: 'Gerencia',
  it_superadmin: 'Superadministración IT',
};
export const statusLabels: Record<string, string> = {
  opening: 'En apertura',
  active: 'Activo',
  closing: 'En cierre',
  closed: 'Cerrado',
  regularized: 'Regularizado',
  pending: 'Pendiente',
  following: 'En seguimiento',
  resolved: 'Resuelta',
  fit: 'Apto',
  observations: 'Apto con observaciones',
  unfit: 'No apto',
  light: 'Liviano',
  heavy: 'Pesado',
};
