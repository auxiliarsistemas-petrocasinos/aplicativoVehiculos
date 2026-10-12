'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, TriangleAlert, Save } from 'lucide-react';
import type { Snapshot } from '@/lib/types';
import { statusLabels } from '@/lib/types';
import { dateLabel } from '@/lib/utils';
import { saveDraft } from '@/features/shifts/actions';
import { Button } from './ui/button';
import { CommandForm, useCommand } from './command-form';
import { EvidenceInput } from './evidence-input';
import { EvidenceGallery } from './evidence-gallery';
export type Followup = {
  id: string;
  incident_id: string;
  comment: string;
  status: string;
  created_at: string;
};
export function IncidentsPanel({
  data,
  actions,
  evidences,
  newReport = false,
  draft = {},
}: {
  data: Snapshot;
  actions: Followup[];
  evidences: { id: string; entity_id: string | null }[];
  newReport?: boolean;
  draft?: { description?: string; photos?: string[] };
}) {
  const driver = data.profile.role === 'driver';
  const admin = ['fleet_admin', 'it_superadmin'].includes(data.profile.role);
  const shift = data.shifts.find((s) => ['active', 'closing'].includes(s.status));
  const [adding, setAdding] = useState(newReport);
  const [description, setDescription] = useState(draft.description ?? '');
  const [photos, setPhotos] = useState<string[]>(draft.photos ?? []);
  const [filter, setFilter] = useState('');
  const [notice, setNotice] = useState('');
  const { run, pending, error, setError } = useCommand();
  const router = useRouter();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">NOVEDADES DE LA OPERACIÓN</p>
          <h1>Incidencias</h1>
          <p className="muted">Evidencias y seguimiento hasta su resolución.</p>
        </div>
        {driver && shift && (
          <Button onClick={() => setAdding(!adding)}>
            <Plus size={17} />
            Reportar incidencia
          </Button>
        )}
      </div>
      {adding && driver && shift && (
        <section className="panel mb-6 max-w-2xl">
          <h2>Registrar una novedad</h2>
          <p className="info-box">
            Detente en un lugar seguro antes de tomar fotografías. Si la situación es urgente,
            utiliza los canales externos de atención. Puedes guardar un borrador y completarlo
            después.
          </p>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              if (await run('report_incident', { shift_id: shift.id, description, photos })) {
                setAdding(false);
                setDescription('');
                setPhotos([]);
                await saveDraft(shift.id, 'incident', {});
                router.refresh();
              }
            }}
          >
            <label>
              Descripción obligatoria
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                rows={4}
                maxLength={4000}
                placeholder="Describe lo ocurrido y el lugar del vehículo que presenta la novedad…"
              />
            </label>
            <EvidenceInput shiftId={shift.id} value={photos} onChange={setPhotos} />
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={async () => {
                  const result = await saveDraft(shift.id, 'incident', { description, photos });
                  if (result.error) setError(result.error);
                  else setNotice('Borrador confirmado. Aún no es una incidencia formal.');
                }}
              >
                <Save size={16} />
                Guardar borrador
              </Button>
              <Button disabled={pending || !description.trim() || photos.length === 0}>
                {pending ? 'Confirmando…' : 'Confirmar incidencia'}
              </Button>
            </div>
            {notice && (
              <p role="status" className="info-box">
                {notice}
              </p>
            )}
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
          </form>
        </section>
      )}
      {driver && !shift && (
        <p className="info-box">
          Podrás registrar una incidencia cuando tengas una utilización activa. Aquí puedes
          consultar tus reportes anteriores.
        </p>
      )}
      <label className="mb-6 max-w-xs">
        Estado
        <select value={filter} onChange={(e) => setFilter(e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="pending">Pendiente</option>
          <option value="following">En seguimiento</option>
          <option value="resolved">Resuelta</option>
        </select>
      </label>
      <div className="stack">
        {data.incidents
          .filter((i) => !filter || i.status === filter)
          .sort((a, b) => b.created_at.localeCompare(a.created_at))
          .map((i) => (
            <section className="panel" key={i.id}>
              <div className="mb-4 flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="stat-icon !bg-red-50 !text-red-500">
                    <TriangleAlert size={22} />
                  </div>
                  <div>
                    <h2 className="mb-1">
                      {data.usages.find((u) => u.id === i.usage_id)?.plate_snapshot ?? 'Vehículo'}
                    </h2>
                    <p className="muted mb-0 text-xs">{dateLabel(i.created_at)}</p>
                  </div>
                </div>
                <span className={`badge ${i.status === 'resolved' ? '' : 'badge-warning'}`}>
                  {statusLabels[i.status]}
                </span>
              </div>
              <p className="whitespace-pre-wrap text-sm leading-6">{i.description}</p>
              <EvidenceGallery
                ids={evidences.filter((e) => e.entity_id === i.id).map((e) => e.id)}
              />
              <Link href={`/turnos/${i.shift_id}`} className="text-xs text-blue-600">
                Consultar turno asociado →
              </Link>
              {actions
                .filter((a) => a.incident_id === i.id)
                .map((a) => (
                  <div key={a.id} className="mt-4 border-l-2 border-blue-200 pl-4">
                    <p className="mb-1 text-xs text-slate-400">
                      {dateLabel(a.created_at)} · {statusLabels[a.status]}
                    </p>
                    <p className="mb-0 text-sm">{a.comment}</p>
                  </div>
                ))}
              {admin && (
                <details className="mt-5 border-t border-slate-100 pt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-blue-600">
                    Registrar seguimiento
                  </summary>
                  <div className="mt-4">
                    <CommandForm
                      action="follow_incident"
                      extra={{ id: i.id }}
                      label="Confirmar seguimiento"
                    >
                      <label>
                        Estado
                        <select name="status" defaultValue={i.status}>
                          <option value="pending">Pendiente</option>
                          <option value="following">En seguimiento</option>
                          <option value="resolved">Resuelta</option>
                        </select>
                      </label>
                      <label>
                        Comentario
                        <textarea name="comment" required rows={3} />
                      </label>
                    </CommandForm>
                  </div>
                </details>
              )}
            </section>
          ))}
      </div>
      {!data.incidents.length && (
        <div className="panel empty">
          <TriangleAlert className="mx-auto mb-3 text-slate-300" size={36} />
          No hay incidencias registradas.
        </div>
      )}
    </>
  );
}
