'use client';
import { useState } from 'react';
import {
  MapPin,
  Truck,
  Plus,
  ShieldAlert,
  ArrowRightLeft,
  FileCheck2,
  ChevronDown,
} from 'lucide-react';
import type { Snapshot } from '@/lib/types';
import { statusLabels } from '@/lib/types';
import { vehicleAvailability } from '@/features/vehicles/eligibility';
import { CommandForm } from './command-form';
import { Button } from './ui/button';
function FieldSelect({
  data,
  name = 'field_id',
  label = 'Campo',
  value,
}: {
  data: Snapshot;
  name?: string;
  label?: string;
  value?: string;
}) {
  return (
    <label>
      {label}
      <select name={name} defaultValue={value} required>
        {data.fields
          .filter((f) => f.active)
          .map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
      </select>
    </label>
  );
}
export function FieldsPanel({ data }: { data: Snapshot }) {
  const admin = ['fleet_admin', 'it_superadmin'].includes(data.profile.role);
  const [adding, setAdding] = useState(false);
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">ORGANIZACIÓN</p>
          <h1>Campos operativos</h1>
          <p className="muted">Organiza los sitios y consulta su flota.</p>
        </div>
        {admin && (
          <Button onClick={() => setAdding(!adding)}>
            <Plus size={17} />
            Nuevo campo
          </Button>
        )}
      </div>
      {adding && (
        <section className="panel mb-6 max-w-xl">
          <h2>Registrar campo</h2>
          <CommandForm action="create_field" onSuccess={() => setAdding(false)}>
            <label>
              Nombre del campo
              <input name="name" required maxLength={120} />
            </label>
          </CommandForm>
        </section>
      )}
      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {data.fields.map((f) => (
          <section className="panel" key={f.id}>
            <div className="mb-5 flex justify-between">
              <div className="stat-icon">
                <MapPin />
              </div>
              <span className={`badge ${f.active ? '' : 'badge-warning'}`}>
                {f.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <h2>{f.name}</h2>
            <p className="muted text-sm">
              {data.vehicles.filter((v) => v.field_id === f.id).length} vehículos ·{' '}
              {
                data.shifts.filter(
                  (s) => s.field_id === f.id && ['active', 'closing'].includes(s.status),
                ).length
              }{' '}
              turnos activos
            </p>
            {admin && (
              <details className="border-t border-slate-100 pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-blue-600">
                  Editar campo
                </summary>
                <div className="mt-4">
                  <CommandForm action="update_field" extra={{ id: f.id }}>
                    <label>
                      Nombre
                      <input name="name" defaultValue={f.name} required />
                    </label>
                    <label>
                      Estado
                      <select name="active" defaultValue={String(f.active)}>
                        <option value="true">Activo</option>
                        <option value="false">Inactivo</option>
                      </select>
                    </label>
                  </CommandForm>
                </div>
              </details>
            )}
          </section>
        ))}
      </div>
      {!data.fields.length && <div className="panel empty">No hay campos disponibles.</div>}
    </>
  );
}
export type VehicleDocument = {
  id: string;
  vehicle_id: string;
  name: string;
  expires_on: string | null;
  required: boolean;
};
export function VehiclesPanel({
  data,
  documents,
}: {
  data: Snapshot;
  documents: VehicleDocument[];
}) {
  const admin = ['fleet_admin', 'it_superadmin'].includes(data.profile.role);
  const [adding, setAdding] = useState(false);
  const [search, setSearch] = useState('');
  const [field, setField] = useState('');
  const filtered = data.vehicles.filter(
    (v) =>
      (!field || v.field_id === field) &&
      (v.plate + ' ' + v.description).toLowerCase().includes(search.toLowerCase()),
  );
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TU FLOTA</p>
          <h1>Vehículos</h1>
          <p className="muted">Disponibilidad, documentación y trazabilidad.</p>
        </div>
        {admin && (
          <Button onClick={() => setAdding(!adding)}>
            <Plus size={17} />
            Nuevo vehículo
          </Button>
        )}
      </div>
      {adding && (
        <section className="panel mb-6">
          <h2>Registrar vehículo</h2>
          <CommandForm action="create_vehicle" onSuccess={() => setAdding(false)}>
            <div className="form-grid">
              <label>
                Placa ficticia
                <input name="plate" required maxLength={12} placeholder="DEM004" />
              </label>
              <label>
                Marca / línea / descripción
                <input name="description" required maxLength={150} />
              </label>
              <label>
                Tipo
                <select name="vehicle_type">
                  <option value="light">Liviano</option>
                  <option value="heavy">Pesado</option>
                </select>
              </label>
              <FieldSelect data={data} />
              <label>
                Odómetro inicial (km)
                <input type="number" name="odometer" required min="0" step="0.1" />
              </label>
            </div>
            <p className="muted text-xs">
              La propiedad de la unidad sigue pendiente y no se exige.
            </p>
          </CommandForm>
        </section>
      )}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <label>
          Buscar vehículo
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Placa o descripción…"
          />
        </label>
        <label>
          Campo
          <select value={field} onChange={(e) => setField(e.target.value)}>
            <option value="">Todos los campos autorizados</option>
            {data.fields.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {filtered.map((v) => (
          <section className="panel" key={v.id}>
            <div className="mb-5 flex justify-between">
              <div className="flex items-center gap-3">
                <div className="stat-icon">
                  <Truck />
                </div>
                <div>
                  <h2 className="mb-1">{v.plate}</h2>
                  <p className="muted mb-0 text-xs">{v.description}</p>
                </div>
              </div>
              <span className="badge badge-blue h-fit">{vehicleAvailability(v, data)}</span>
            </div>
            <div className="mb-5 grid grid-cols-2 gap-x-4 gap-y-3 text-sm">
              <div>
                <p className="mb-1 text-xs text-slate-400">Campo</p>
                {data.fields.find((f) => f.id === v.field_id)?.name}
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-400">Tipo / odómetro</p>
                {statusLabels[v.vehicle_type]} · {v.odometer.toLocaleString('es-CO')} km
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-400">Administrativo</p>
                {v.active ? 'Activo' : 'Inactivo'}
              </div>
              <div>
                <p className="mb-1 text-xs text-slate-400">Aptitud</p>
                <span
                  className={`badge ${v.fitness === 'unfit' ? 'badge-red' : v.fitness === 'observations' ? 'badge-warning' : ''}`}
                >
                  {statusLabels[v.fitness]}
                </span>
              </div>
            </div>
            {data.restrictions
              .filter((r) => r.vehicle_id === v.id && !r.lifted_at)
              .map((r) => (
                <div className="mb-3 rounded-xl bg-amber-50 p-4" key={r.id}>
                  <p className="mb-2 flex items-center gap-2 text-sm text-amber-800">
                    <ShieldAlert size={16} />
                    {r.reason}
                  </p>
                  {admin && (
                    <details>
                      <summary className="cursor-pointer text-xs text-amber-800">
                        Levantar restricción
                      </summary>
                      <div className="mt-3">
                        <CommandForm
                          action="lift_restriction"
                          extra={{ id: r.id }}
                          label="Confirmar levantamiento"
                        >
                          <label>
                            Justificación
                            <input name="reason" required />
                          </label>
                        </CommandForm>
                      </div>
                    </details>
                  )}
                </div>
              ))}
            <details className="border-t border-slate-100 pt-4">
              <summary className="flex cursor-pointer items-center gap-2 text-sm font-semibold text-blue-700">
                <FileCheck2 size={17} />
                Documentación
                <ChevronDown size={15} />
              </summary>
              <div className="mt-4 stack">
                {documents
                  .filter((d) => d.vehicle_id === v.id)
                  .map((d) => (
                    <div className="rounded-lg bg-slate-50 p-3 text-sm" key={d.id}>
                      <strong>{d.name}</strong>
                      <p className="mb-0 mt-1 text-xs text-slate-500">
                        Vigencia: {d.expires_on ?? 'No acreditada'} ·{' '}
                        {d.required ? 'Obligatorio registrado' : 'Referencia'}
                      </p>
                    </div>
                  ))}
                {!documents.some((d) => d.vehicle_id === v.id) && (
                  <p className="muted text-sm">
                    Sin documentos registrados. Esto no certifica cumplimiento legal.
                  </p>
                )}
                {admin && (
                  <CommandForm
                    action="add_document"
                    extra={{ vehicle_id: v.id }}
                    label="Registrar documento"
                  >
                    <label>
                      Nombre
                      <input name="name" required />
                    </label>
                    <label>
                      Vencimiento
                      <input type="date" name="expires_on" />
                    </label>
                    <label>
                      Exigibilidad validada por administración
                      <select name="required">
                        <option value="false">Referencia · no definida</option>
                        <option value="true">Obligatorio para esta unidad</option>
                      </select>
                    </label>
                    <p className="text-xs text-slate-500">
                      Un obligatorio vencido o sin fecha bloquea nuevas recepciones. El catálogo
                      legal general requiere aprobación.
                    </p>
                  </CommandForm>
                )}
              </div>
            </details>
            {admin && (
              <details className="mt-4 border-t border-slate-100 pt-4">
                <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                  Administrar vehículo
                </summary>
                <div className="mt-5 stack">
                  <CommandForm action="update_vehicle" extra={{ id: v.id }} label="Guardar estado">
                    <label>
                      Descripción
                      <input name="description" defaultValue={v.description} required />
                    </label>
                    <div className="form-grid">
                      <label>
                        Administrativo
                        <select name="active" defaultValue={String(v.active)}>
                          <option value="true">Activo</option>
                          <option value="false">Inactivo</option>
                        </select>
                      </label>
                      <label>
                        Aptitud
                        <select name="fitness" defaultValue={v.fitness}>
                          <option value="fit">Apto</option>
                          <option value="observations">Apto con observaciones</option>
                          <option value="unfit">No apto</option>
                        </select>
                      </label>
                    </div>
                  </CommandForm>
                  <div className="border-t border-slate-200 pt-5">
                    <h3 className="flex items-center gap-2">
                      <ArrowRightLeft size={16} />
                      Trasladar a otro campo
                    </h3>
                    <CommandForm
                      action="transfer_vehicle"
                      extra={{ id: v.id }}
                      label="Confirmar traslado"
                    >
                      <FieldSelect data={data} value={v.field_id} label="Campo destino" />
                      <label>
                        Motivo
                        <input name="reason" required />
                      </label>
                    </CommandForm>
                  </div>
                  <div className="border-t border-slate-200 pt-5">
                    <h3>Restricción preventiva manual</h3>
                    <CommandForm
                      action="restrict_vehicle"
                      extra={{ vehicle_id: v.id }}
                      label="Registrar restricción"
                    >
                      <label>
                        Motivo
                        <input
                          name="reason"
                          required
                          placeholder="Describe la causa de indisponibilidad"
                        />
                      </label>
                    </CommandForm>
                  </div>
                </div>
              </details>
            )}
          </section>
        ))}
      </div>
      {!filtered.length && (
        <div className="panel empty">No hay vehículos que coincidan con la búsqueda.</div>
      )}
    </>
  );
}
