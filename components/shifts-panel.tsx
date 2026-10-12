'use client';
import Link from 'next/link';
import { useState } from 'react';
import { ArrowRight, Clock3 } from 'lucide-react';
import type { Snapshot } from '@/lib/types';
import { statusLabels } from '@/lib/types';
import { dateLabel } from '@/lib/utils';
export function ShiftsPanel({ data }: { data: Snapshot }) {
  const [status, setStatus] = useState('');
  const [field, setField] = useState('');
  const list = data.shifts
    .filter((s) => (!status || s.status === status) && (!field || s.field_id === field))
    .sort((a, b) => b.created_at.localeCompare(a.created_at));
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">TRAZABILIDAD</p>
          <h1>{data.profile.role === 'driver' ? 'Mi historial' : 'Turnos'}</h1>
          <p className="muted">Recepciones, entregas y segmentos de cada jornada.</p>
        </div>
      </div>
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        <label>
          Estado
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Todos</option>
            {['opening', 'active', 'closing', 'closed', 'regularized'].map((s) => (
              <option key={s} value={s}>
                {statusLabels[s]}
              </option>
            ))}
          </select>
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
      <div className="grid gap-4 lg:grid-cols-2">
        {list.map((s) => {
          const uses = data.usages.filter((u) => u.shift_id === s.id);
          return (
            <Link
              className="panel flex items-center justify-between gap-4 hover:border-blue-300"
              href={`/turnos/${s.id}`}
              key={s.id}
            >
              <div>
                <div className="mb-3 flex items-center gap-3">
                  <Clock3 size={20} className="text-blue-500" />
                  <span
                    className={`badge ${s.status === 'regularized' ? 'badge-warning' : 'badge-blue'}`}
                  >
                    {statusLabels[s.status]}
                  </span>
                </div>
                <h2 className="mb-2 text-base">
                  {uses.map((u) => u.plate_snapshot).join(' → ') ||
                    'Apertura sin vehículo recibido'}
                </h2>
                <p className="muted mb-2 text-xs">{dateLabel(s.created_at)}</p>
                <p className="muted mb-0 text-xs">
                  {data.fields.find((f) => f.id === s.field_id)?.name} · {uses.length} segmento(s)
                </p>
              </div>
              <ArrowRight size={18} className="shrink-0 text-slate-300" />
            </Link>
          );
        })}
      </div>
      {!list.length && <p className="panel empty">No hay turnos para estos filtros.</p>}
    </>
  );
}
