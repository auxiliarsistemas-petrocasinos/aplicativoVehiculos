import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Truck, ArrowLeft, ClipboardCheck } from 'lucide-react';
import { pageData } from '@/lib/page-data';
import { serverClient } from '@/lib/supabase/server';
import { Shell } from '@/components/shell';
import { CommandForm } from '@/components/command-form';
import { EvidenceGallery } from '@/components/evidence-gallery';
import { Button } from '@/components/ui/button';
import { dateLabel } from '@/lib/utils';
import { statusLabels } from '@/lib/types';
import { eligibleVehicles } from '@/features/vehicles/eligibility';
export default async function ShiftDetail({ params }: { params: Promise<{ id: string }> }) {
  const data = await pageData();
  const { id } = await params;
  const shift = data.shifts.find((s) => s.id === id);
  if (!shift) notFound();
  const db = await serverClient();
  const results = await Promise.all([
    db.from('inspections').select('*,inspection_answers(*)').eq('shift_id', id),
    db.from('evidences').select('*').eq('shift_id', id),
    db.from('odometer_corrections').select('*'),
    db.from('form_items').select('id,label,template_id'),
  ]);
  if (results.some((r) => r.error)) throw new Error('No fue posible consultar el detalle.');
  const inspections = results[0].data ?? [];
  const evidences = results[1].data ?? [];
  const corrections = results[2].data ?? [];
  const admin = ['fleet_admin', 'it_superadmin'].includes(data.profile.role);
  const usages = data.usages
    .filter((u) => u.shift_id === id)
    .sort((a, b) => a.received_at.localeCompare(b.received_at));
  const ratingLabels: Record<string, string> = {
    good: 'Bueno',
    regular: 'Regular',
    bad: 'Malo',
    na: 'No aplica',
  };
  return (
    <Shell profile={data.profile}>
      <Link href="/turnos" className="mb-6 inline-flex items-center gap-2 text-sm text-blue-600">
        <ArrowLeft size={16} />
        Volver a turnos
      </Link>
      <div className="page-heading">
        <div>
          <p className="eyebrow">DETALLE DEL TURNO</p>
          <h1>{dateLabel(shift.created_at)}</h1>
          <p className="muted">{data.fields.find((f) => f.id === shift.field_id)?.name}</p>
        </div>
        <span className="badge badge-blue">{statusLabels[shift.status]}</span>
      </div>
      {data.profile.role === 'driver' &&
        ['opening', 'active', 'closing'].includes(shift.status) && (
          <Button asChild className="mb-6">
            <Link href="/turno">Continuar mi turno</Link>
          </Button>
        )}
      {shift.status === 'regularized' && (
        <section className="error-box mb-6">
          <h2>Regularización administrativa</h2>
          <p>{shift.regularization_reason}</p>
          <p>Faltantes conservados: {shift.missing?.join(', ')}.</p>
          <p className="mb-0">
            La regularización no certifica entrega. Una utilización sin entrega permanece retenida;
            su liberación requiere un procedimiento aprobado que está pendiente.
          </p>
        </section>
      )}
      <div className="stack">
        {usages.map((u, index) => (
          <section className="panel" key={u.id}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="stat-icon">
                  <Truck />
                </div>
                <div>
                  <h2 className="mb-1">{u.plate_snapshot}</h2>
                  <p className="muted mb-0 text-xs">
                    Segmento {index + 1} · {u.delivered_at ? 'Entregado' : 'Utilización abierta'}
                  </p>
                </div>
              </div>
              <span className="badge badge-blue">
                {u.end_km !== null
                  ? `${u.end_km - u.start_km} km registrados`
                  : 'Kilometraje final pendiente'}
              </span>
            </div>
            <div className="form-grid mb-6 text-sm">
              <div>
                <p className="eyebrow">RECEPCIÓN</p>
                {dateLabel(u.received_at)}
                <p className="mt-2 mb-0 font-semibold">{u.start_km} km</p>
              </div>
              <div>
                <p className="eyebrow">ENTREGA</p>
                {dateLabel(u.delivered_at)}
                <p className="mt-2 mb-0 font-semibold">{u.end_km ?? 'Pendiente'} km</p>
              </div>
            </div>
            {u.end_km !== null && u.end_km < u.start_km && (
              <p className="info-box">
                Lecturas inconsistentes: se conserva el valor registrado y la alerta auditada.
              </p>
            )}
            {['reception', 'delivery'].map((kind) => {
              const inspection = inspections.find((i) => i.usage_id === u.id && i.kind === kind);
              return (
                <details key={kind} className="mb-4 rounded-xl border border-slate-200 p-4">
                  <summary className="cursor-pointer text-sm font-semibold">
                    <ClipboardCheck size={16} className="mr-2 inline" />
                    {kind === 'reception'
                      ? 'Inspección de recepción'
                      : 'Inspección de entrega'} · {inspection ? 'Confirmada' : 'Faltante'}
                  </summary>
                  {inspection && (
                    <div className="mt-4">
                      <p className="muted text-xs">
                        {dateLabel(inspection.created_at)} · Plantilla {inspection.template_id}
                      </p>
                      {inspection.inspection_answers.map(
                        (a: { item_id: string; rating: string; observation: string }) => (
                          <div key={a.item_id} className="border-t border-slate-100 py-3">
                            <div className="flex items-start justify-between gap-3">
                              <span className="text-sm">
                                {results[3].data?.find(
                                  (item) =>
                                    item.id === a.item_id &&
                                    item.template_id === inspection.template_id,
                                )?.label ?? a.item_id}
                              </span>
                              <span
                                className={`badge ${['regular', 'bad'].includes(a.rating) ? 'badge-warning' : 'badge-blue'}`}
                              >
                                {ratingLabels[a.rating]}
                              </span>
                            </div>
                            {a.observation && (
                              <p className="muted mt-2 mb-0 text-sm">{a.observation}</p>
                            )}
                            <EvidenceGallery
                              ids={evidences
                                .filter(
                                  (e) => e.entity_id === inspection.id && e.item_id === a.item_id,
                                )
                                .map((e) => e.id)}
                            />
                          </div>
                        ),
                      )}
                      {inspection.signature_id && (
                        <>
                          <h3 className="mt-5">Firma de la recepción</h3>
                          <EvidenceGallery ids={[inspection.signature_id]} />
                        </>
                      )}
                    </div>
                  )}
                </details>
              );
            })}
            {corrections
              .filter((c) => c.usage_id === u.id)
              .map((c) => (
                <p key={c.id} className="info-box">
                  Corrección propuesta registrada de{' '}
                  {c.reading === 'start' ? 'recepción' : 'entrega'}: {c.original_value} →{' '}
                  {c.corrected_value} km. Motivo: {c.reason}. El original se conserva; los
                  indicadores actuales utilizan las lecturas originales.
                </p>
              ))}
            {admin && (
              <details>
                <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                  Registrar corrección de lectura
                </summary>
                <div className="mt-4">
                  <CommandForm
                    action="correct_odometer"
                    extra={{ usage_id: u.id }}
                    label="Registrar actuación"
                  >
                    <div className="form-grid">
                      <label>
                        Lectura
                        <select name="reading">
                          <option value="start">Recepción</option>
                          {u.end_km !== null && <option value="end">Entrega</option>}
                        </select>
                      </label>
                      <label>
                        Valor corregido
                        <input name="value" type="number" min="0" step="0.1" required />
                      </label>
                    </div>
                    <label>
                      Justificación
                      <input name="reason" required />
                    </label>
                  </CommandForm>
                </div>
              </details>
            )}
          </section>
        ))}
      </div>
      {!usages.length && <p className="panel empty">Aún no se ha confirmado ninguna recepción.</p>}
      {admin &&
        shift.status === 'active' &&
        !data.authorizations.some((a) => a.shift_id === id && !a.used_at) && (
          <section className="panel mt-6">
            <h2>Autorizar sustitución</h2>
            <p className="muted text-sm">
              Selecciona el reemplazo. El conductor deberá documentar entrega y recepción en este
              mismo turno.
            </p>
            <CommandForm
              action="authorize_substitution"
              extra={{ shift_id: id }}
              label="Autorizar cambio"
            >
              <label>
                Vehículo sustituto
                <select name="replacement_id" required>
                  <option value="">Selecciona un vehículo</option>
                  {eligibleVehicles(data, shift.field_id).map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.plate} · {v.description}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Motivo
                <input name="reason" required />
              </label>
            </CommandForm>
          </section>
        )}
      {admin && ['opening', 'active', 'closing'].includes(shift.status) && (
        <details className="panel mt-6">
          <summary className="cursor-pointer font-semibold text-amber-700">
            Regularización administrativa excepcional
          </summary>
          <div className="mt-5">
            <p className="info-box">
              No se generarán datos faltantes ni se liberará una unidad sin entrega acreditada. La
              actuación se registra con responsable y fecha actual.
            </p>
            <CommandForm
              action="regularize"
              extra={{ shift_id: id }}
              label="Regularizar conservando faltantes"
            >
              <label>
                Justificación
                <textarea name="reason" required rows={3} />
              </label>
            </CommandForm>
          </div>
        </details>
      )}
      <section className="panel mt-6">
        <h2>Incidencias asociadas</h2>
        {data.incidents
          .filter((i) => i.shift_id === id)
          .map((i) => (
            <p key={i.id} className="text-sm">
              {i.description}{' '}
              <span className="badge badge-warning ml-2">{statusLabels[i.status]}</span>
            </p>
          ))}
        <Link href="/incidencias" className="text-sm text-blue-600">
          Consultar seguimiento →
        </Link>
      </section>
    </Shell>
  );
}
