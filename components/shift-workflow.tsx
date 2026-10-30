'use client';
import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Clock3, Check, Save, Truck, TriangleAlert } from 'lucide-react';
import type { InspectionInput, Snapshot } from '@/lib/types';
import { statusLabels } from '@/lib/types';
import { dateLabel } from '@/lib/utils';
import catalog from '@/features/inspections/catalog-simplified.json';
import { inspectionSchema } from '@/features/inspections/validation';
import { eligibleVehicles } from '@/features/vehicles/eligibility';
import { saveDraft } from '@/features/shifts/actions';
import { useCommand } from './command-form';
import { Button } from './ui/button';
import { InspectionForm, initialInspection, applicableItems } from './inspection-form';
import { SignaturePad } from './signature-pad';
export type WorkflowDraft = {
  step?: number;
  vehicleId?: string;
  assessment?: Record<string, boolean>;
  inspection?: InspectionInput;
  delivery?: InspectionInput;
  reception?: InspectionInput;
  changing?: boolean;
};
function validateInspection(input: InspectionInput | undefined, count: number) {
  return input && inspectionSchema.safeParse(input).success && input.answers.length === count;
}
export function ShiftWorkflow({ data, draft = {} }: { data: Snapshot; draft?: WorkflowDraft }) {
  const router = useRouter();
  const { run, pending, error, setError } = useCommand();
  const shift = data.shifts.find((s) => ['opening', 'active', 'closing'].includes(s.status));
  const usage = data.usages.find((u) => u.shift_id === shift?.id && !u.delivered_at);
  const vehicle = data.vehicles.find((v) => v.id === usage?.vehicle_id);
  const authorization = data.authorizations.find((a) => a.shift_id === shift?.id && !a.used_at);
  const replacement = data.vehicles.find((v) => v.id === authorization?.replacement_id);
  const [step, setStep] = useState(draft.step ?? 0);
  const [vehicleId, setVehicleId] = useState(draft.vehicleId ?? '');
  const [assessment, setAssessment] = useState<Record<string, boolean>>(draft.assessment ?? {});
  const selected = data.vehicles.find((v) => v.id === vehicleId);
  const [inspection, setInspection] = useState<InspectionInput | undefined>(
    draft.inspection?.template_id === data.templateId
      ? draft.inspection
      : vehicle
        ? initialInspection(vehicle, data.templateId)
        : selected
          ? initialInspection(selected, data.templateId)
          : undefined,
  );
  const [changing, setChanging] = useState(draft.changing ?? false);
  const [delivery, setDelivery] = useState<InspectionInput | undefined>(
    draft.delivery?.template_id === data.templateId
      ? draft.delivery
      : vehicle
        ? initialInspection(vehicle, data.templateId)
        : undefined,
  );
  const [reception, setReception] = useState<InspectionInput | undefined>(
    draft.reception?.template_id === data.templateId
      ? draft.reception
      : replacement
        ? initialInspection(replacement, data.templateId)
        : undefined,
  );
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);
  async function keepDraft() {
    if (!shift) return;
    setSaving(true);
    const result = await saveDraft(
      shift.id,
      changing ? 'substitution' : shift.status === 'closing' ? 'closing' : 'opening',
      { step, vehicleId, assessment, inspection, delivery, reception, changing },
    );
    setSaving(false);
    if (result.error) setError(result.error);
    else setSaved('Borrador guardado en el servidor. Puedes retomarlo desde tu cuenta.');
  }
  async function confirm(action: string, payload: Record<string, unknown>) {
    const id = await run(action, payload);
    if (id) router.push(`/turnos/${id}`);
  }
  if (!shift)
    return (
      <div className="mx-auto max-w-xl">
        <div className="page-heading">
          <div>
            <p className="eyebrow">MI TURNO</p>
            <h1>Una nueva jornada</h1>
          </div>
        </div>
        <div className="panel text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
            <Truck size={38} />
          </div>
          <h2>Prepara tu salida</h2>
          <p className="muted leading-7">
            Selecciona el vehículo, responde tu autoevaluación y registra la inspección de
            recepción. Tu turno estará activo cuando confirmemos toda la información.
          </p>
          <p className="info-box text-left">
            Demostración con datos ficticios. El catálogo aún requiere validación PESV.
          </p>
          {error && (
            <p className="error-box" role="alert">
              {error}
            </p>
          )}
          <Button disabled={pending} onClick={() => run('start_shift', {})}>
            <Clock3 size={18} />
            {pending ? 'Creando apertura…' : 'Iniciar turno'}
          </Button>
        </div>
      </div>
    );
  const opening = shift.status === 'opening';
  const closing = shift.status === 'closing';
  return (
    <div className="mx-auto max-w-3xl">
      <div className="page-heading">
        <div>
          <p className="eyebrow">MI TURNO</p>
          <h1>
            {changing
              ? 'Cambio autorizado'
              : opening
                ? 'Apertura de turno'
                : closing
                  ? 'Cierre de turno'
                  : 'Tu turno está activo'}
          </h1>
          <p className="muted text-sm">{dateLabel(shift.opened_at ?? shift.created_at)}</p>
        </div>
        <span className="badge badge-blue">{statusLabels[shift.status]}</span>
      </div>
      {!opening && !closing && !changing ? (
        <div className="stack">
          <section className="hero-surface p-7">
            <p className="mb-2 text-sm text-blue-200">Vehículo en uso</p>
            <h2 className="mb-1 text-3xl">{usage?.plate_snapshot}</h2>
            <p className="mb-5 text-blue-100">{vehicle?.description}</p>
            <p className="mb-0 text-sm">Recepción: {usage?.start_km.toLocaleString('es-CO')} km</p>
          </section>
          <div className="grid gap-4 sm:grid-cols-2">
            <Button asChild variant="outline">
              <Link href="/incidencias?new=1">
                <TriangleAlert size={18} />
                Reportar incidencia
              </Link>
            </Button>
            <Button
              disabled={pending}
              onClick={() => {
                if (vehicle) setInspection(initialInspection(vehicle, data.templateId));
                setStep(0);
                run('begin_closing', { shift_id: shift.id });
              }}
            >
              Iniciar cierre
              <ArrowRight size={18} />
            </Button>
          </div>
          {authorization && replacement && (
            <section className="panel">
              <h2>Cambio de vehículo autorizado</h2>
              <p className="muted">
                Administración asignó {replacement.plate}. Completa entrega y recepción para
                continuar en el mismo turno.
              </p>
              <Button
                onClick={() => {
                  setChanging(true);
                  setStep(0);
                  if (vehicle) setDelivery(initialInspection(vehicle, data.templateId));
                  setReception(initialInspection(replacement, data.templateId));
                }}
              >
                Documentar el cambio
              </Button>
            </section>
          )}
          <Link href={`/turnos/${shift.id}`} className="text-sm text-blue-600">
            Ver historial y evidencias de este turno →
          </Link>
        </div>
      ) : (
        <section className="panel">
          {opening && (
            <div className="mb-8 flex items-center justify-between gap-2">
              {['Vehículo', 'Tu estado', 'Inspección', 'Firma'].map((label, i) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-2 text-[11px] text-slate-500"
                >
                  <span className={`step ${step === i ? 'current' : step > i ? 'done' : ''}`}>
                    {step > i ? <Check size={15} /> : i + 1}
                  </span>
                  {label}
                </div>
              ))}
            </div>
          )}
          {opening && step === 0 && (
            <div className="stack">
              <div>
                <h2>Selecciona tu vehículo</h2>
                <p className="muted text-sm">
                  Solo unidades de tu campo. La elegibilidad se verificará nuevamente al confirmar.
                </p>
              </div>
              {eligibleVehicles(data).length ? (
                eligibleVehicles(data).map((v) => (
                  <label
                    key={v.id}
                    className={`flex items-center gap-4 rounded-xl border p-4 ${vehicleId === v.id ? 'border-blue-500 bg-blue-50' : 'border-slate-200'}`}
                  >
                    <input
                      type="radio"
                      name="vehicle"
                      checked={vehicleId === v.id}
                      onChange={() => {
                        setVehicleId(v.id);
                        setInspection(initialInspection(v, data.templateId));
                      }}
                    />
                    <Truck className="text-blue-500" />
                    <span>
                      <strong className="block text-base">{v.plate}</strong>
                      <span className="text-xs font-normal text-slate-500">
                        {v.description} · {statusLabels[v.vehicle_type]}
                      </span>
                    </span>
                  </label>
                ))
              ) : (
                <p className="info-box">
                  No hay vehículos elegibles en tu campo. Contacta a administración.
                </p>
              )}
              <Button disabled={!selected} onClick={() => setStep(1)}>
                Continuar
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
          {opening && step === 1 && (
            <div className="stack">
              <div>
                <h2>Estado del conductor</h2>
                <p className="muted text-sm">
                  Responde de acuerdo con tu estado actual. Tus respuestas tienen acceso
                  restringido.
                </p>
              </div>
              {catalog.fatigue.map((q, i) => (
                <fieldset className="rounded-xl border border-slate-200 p-4" key={q.id}>
                  <legend className="px-1 text-sm font-semibold">
                    {i + 1}. {q.label}
                  </legend>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: true, l: 'Sí' },
                      { v: false, l: 'No' },
                    ].map((a) => (
                      <label
                        className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 ${assessment[q.id] === a.v ? 'border-blue-400 bg-blue-50' : 'border-slate-200'}`}
                        key={a.l}
                      >
                        <input
                          type="radio"
                          name={q.id}
                          checked={assessment[q.id] === a.v}
                          onChange={() => setAssessment({ ...assessment, [q.id]: a.v })}
                        />
                        {a.l}
                      </label>
                    ))}
                  </div>
                </fieldset>
              ))}
              <p className="info-box">
                No se emite una decisión médica ni autorización automática. Ante una situación de
                riesgo, utiliza los canales externos de atención.
              </p>
              <Button disabled={Object.keys(assessment).length !== 6} onClick={() => setStep(2)}>
                Continuar
                <ArrowRight size={16} />
              </Button>
            </div>
          )}
          {opening && step === 2 && selected && inspection && (
            <>
              <InspectionForm
                allItems={data.inspectionItems}
                version={data.templateVersion}
                vehicle={selected}
                shiftId={shift.id}
                value={inspection}
                onChange={setInspection}
              />
              <Button
                className="mt-6 w-full"
                onClick={() => {
                  if (
                    validateInspection(
                      inspection,
                      applicableItems(selected, data.inspectionItems).length,
                    )
                  ) {
                    setError('');
                    setStep(3);
                  } else
                    setError(
                      'Completa todos los controles. Regular/Malo requiere observación y foto guardada.',
                    );
                }}
              >
                Continuar a firma
                <ArrowRight size={16} />
              </Button>
            </>
          )}
          {opening && step === 3 && inspection && (
            <div className="stack">
              <SignaturePad
                shiftId={shift.id}
                value={inspection.signature}
                onChange={(signature) => setInspection({ ...inspection, signature })}
              />
              <p className="info-box">
                Confirma que la información corresponde a esta recepción. El turno se activa
                únicamente al recibir confirmación del servidor.
              </p>
              <Button
                disabled={pending || !inspection.signature}
                onClick={() =>
                  confirm('confirm_opening', {
                    shift_id: shift.id,
                    vehicle_id: vehicleId,
                    assessment,
                    inspection,
                  })
                }
              >
                {pending ? 'Confirmando…' : 'Confirmar apertura'}
              </Button>
            </div>
          )}
          {closing && vehicle && inspection && (
            <div className="stack">
              <h2>Inspección de entrega</h2>
              <InspectionForm
                allItems={data.inspectionItems}
                version={data.templateVersion}
                vehicle={vehicle}
                shiftId={shift.id}
                value={inspection}
                onChange={setInspection}
              />
              <p className="muted text-sm">
                Las incidencias pendientes continuarán en seguimiento después del cierre.
              </p>
              <Button
                disabled={pending}
                onClick={() => confirm('close_shift', { shift_id: shift.id, inspection })}
              >
                {pending ? 'Confirmando…' : 'Finalizar turno'}
              </Button>
            </div>
          )}
          {changing && vehicle && replacement && delivery && reception && (
            <div className="stack">
              <div className="flex gap-3">
                <span className="badge badge-blue">{step + 1} de 2</span>
                <span className="font-semibold">
                  {step === 0 ? `Entrega · ${vehicle.plate}` : `Recepción · ${replacement.plate}`}
                </span>
              </div>
              {step === 0 ? (
                <>
                  <InspectionForm
                    allItems={data.inspectionItems}
                    version={data.templateVersion}
                    vehicle={vehicle}
                    shiftId={shift.id}
                    value={delivery}
                    onChange={setDelivery}
                  />
                  <Button
                    onClick={() => {
                      if (
                        validateInspection(
                          delivery,
                          applicableItems(vehicle, data.inspectionItems).length,
                        )
                      ) {
                        setError('');
                        setStep(1);
                      } else setError('Completa entrega, observaciones y fotos requeridas.');
                    }}
                  >
                    Continuar a recepción
                  </Button>
                </>
              ) : (
                <>
                  <InspectionForm
                    allItems={data.inspectionItems}
                    version={data.templateVersion}
                    vehicle={replacement}
                    shiftId={shift.id}
                    value={reception}
                    onChange={setReception}
                  />
                  <Button
                    disabled={pending}
                    onClick={() =>
                      confirm('substitute', {
                        shift_id: shift.id,
                        authorization_id: authorization?.id,
                        delivery,
                        reception,
                      })
                    }
                  >
                    {pending ? 'Confirmando…' : 'Confirmar cambio de vehículo'}
                  </Button>
                </>
              )}
            </div>
          )}
          <div className="mt-7 flex flex-wrap justify-between gap-3 border-t border-slate-100 pt-5">
            {step > 0 && (opening || changing) && (
              <Button variant="ghost" onClick={() => setStep(step - 1)}>
                <ArrowLeft size={16} />
                Atrás
              </Button>
            )}
            <Button variant="outline" disabled={saving} onClick={keepDraft}>
              <Save size={16} />
              {saving ? 'Guardando…' : 'Guardar borrador'}
            </Button>
          </div>
          {saved && (
            <p role="status" className="mt-4 text-sm text-emerald-700">
              {saved}
            </p>
          )}
        </section>
      )}
      {error && (
        <p role="alert" className="error-box mt-5">
          {error}
        </p>
      )}
      <p className="mt-5 text-xs leading-5 text-slate-400">
        Solo en línea. Cerrar el navegador o la sesión no cierra tu turno. Las fotos deben tomarse
        con el vehículo detenido y en condiciones seguras.
      </p>
    </div>
  );
}
