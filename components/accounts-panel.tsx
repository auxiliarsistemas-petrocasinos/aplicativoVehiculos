'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Plus, KeyRound } from 'lucide-react';
import type { Snapshot, Profile } from '@/lib/types';
import { roleLabels } from '@/lib/types';
import { normalizeAlias } from '@/features/auth/alias';
import { createAccount, resetPassword, suggestAccountAlias } from '@/features/auth/actions';
import { Button } from './ui/button';
import { PasswordInput } from './password-input';
import { CommandForm } from './command-form';
function ResetAccount({ profile }: { profile: Profile }) {
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  return (
    <form
      className="stack mt-4"
      onSubmit={async (e) => {
        e.preventDefault();
        const password = String(new FormData(e.currentTarget).get('password'));
        setPending(true);
        const result = await resetPassword(profile.id, password);
        setPending(false);
        setMessage(
          result.error ??
            'Restablecimiento confirmado. El próximo acceso exige cambiar la contraseña.',
        );
      }}
    >
      <PasswordInput label="Contraseña temporal" autoComplete="new-password" />
      <p className="text-xs text-slate-500">
        Verifica la identidad y comunica la clave por un medio autorizado. El protocolo corporativo
        definitivo está pendiente.
      </p>
      <Button disabled={pending} variant="outline">
        {pending ? 'Restableciendo…' : 'Restablecer contraseña'}
      </Button>
      {message && (
        <p role="status" className="info-box">
          {message}
        </p>
      )}
    </form>
  );
}
export function AccountsPanel({ data }: { data: Snapshot }) {
  const admin = ['fleet_admin', 'it_superadmin'].includes(data.profile.role);
  const it = data.profile.role === 'it_superadmin';
  const [adding, setAdding] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [alias, setAlias] = useState('');
  const [aliasHint, setAliasHint] = useState('');
  const router = useRouter();
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow">PERSONAS Y ACCESO</p>
          <h1>{it ? 'Cuentas del aplicativo' : 'Conductores'}</h1>
          <p className="muted">Perfiles, asignaciones y control de acceso.</p>
        </div>
        {admin && (
          <Button onClick={() => setAdding(!adding)}>
            <Plus size={17} />
            {it ? 'Nueva cuenta' : 'Nuevo conductor'}
          </Button>
        )}
      </div>
      {!admin && (
        <p className="info-box">
          La consulta de cuentas personales requiere permisos administrativos. Los informes
          operativos conservan la referencia de cada conductor.
        </p>
      )}
      {adding && (
        <section className="panel mb-6">
          <h2>Alta de cuenta</h2>
          <form
            className="stack"
            onSubmit={async (e) => {
              e.preventDefault();
              setError('');
              setPending(true);
              const form = new FormData(e.currentTarget);
              const result = await createAccount({
                ...Object.fromEntries(form),
                alias: normalizeAlias(alias),
              });
              setPending(false);
              if (result.error) setError(result.error);
              else {
                setAdding(false);
                router.refresh();
              }
            }}
          >
            <div className="form-grid">
              <label>
                Primer nombre
                <input name="first_name" required />
              </label>
              <label>
                Primer apellido
                <input name="first_surname" required />
              </label>
              <label>
                Segundo apellido
                <input name="second_surname" />
              </label>
              <label>
                Usuario
                <input
                  name="alias"
                  value={alias}
                  onChange={(e) => setAlias(normalizeAlias(e.target.value))}
                  required
                  placeholder="nombre.apellido"
                />
              </label>
            </div>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={async (e) => {
                const form = new FormData(e.currentTarget.form!);
                setPending(true);
                try {
                  const result = await suggestAccountAlias(
                    String(form.get('first_name')),
                    String(form.get('first_surname')),
                    String(form.get('second_surname')),
                  );
                  setAliasHint(
                    result.reason ?? 'Alias sugerido. La unicidad se comprueba al guardar.',
                  );
                  if (result.alias) setAlias(result.alias);
                } catch {
                  setAliasHint('No se pudo comprobar el alias. Revisa la conexión y reintenta.');
                } finally {
                  setPending(false);
                }
              }}
            >
              Sugerir alias según los apellidos
            </Button>
            {aliasHint && <p className="info-box">{aliasHint}</p>}
            <div className="form-grid">
              <label>
                Correo
                <input type="email" name="email" required autoComplete="off" />
              </label>
              <label>
                Teléfono
                <input name="phone" required type="tel" />
              </label>
              <label>
                Campo
                <select name="field_id" required>
                  {data.fields
                    .filter((f) => f.active)
                    .map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                </select>
              </label>
              <label>
                Rol
                <select name="role">
                  <option value="driver">Conductor</option>
                  {it && (
                    <>
                      <option value="fleet_admin">Administrador de flota</option>
                      <option value="management">Gerencia</option>
                      <option value="it_superadmin">Superadministrador IT</option>
                    </>
                  )}
                </select>
              </label>
            </div>
            <PasswordInput label="Contraseña temporal" autoComplete="new-password" />
            <p className="text-xs text-slate-500">
              Mínimo 12 caracteres. No uses cédulas. El primer acceso exige un cambio; nunca se
              almacena una contraseña en tablas propias.
            </p>
            {error && (
              <p className="error-box" role="alert">
                {error}
              </p>
            )}
            <Button disabled={pending}>{pending ? 'Creando cuenta…' : 'Crear cuenta'}</Button>
          </form>
        </section>
      )}
      <div className="grid items-start gap-5 lg:grid-cols-2">
        {data.profiles
          .filter((p) => p.role === 'driver' || it)
          .map((p) => (
            <section className="panel" key={p.id}>
              <div className="mb-4 flex items-center gap-3">
                <div className="stat-icon">
                  <Users />
                </div>
                <div>
                  <h2 className="mb-1">{p.full_name}</h2>
                  <p className="muted mb-0 text-xs">
                    {p.alias} · {roleLabels[p.role]}
                  </p>
                </div>
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                <span className="badge">{p.active ? 'Activo' : 'Inactivo'}</span>
                {p.must_change_password && (
                  <span className="badge badge-warning">Cambio de clave pendiente</span>
                )}
                {p.reset_in_progress && (
                  <span className="badge badge-red">Restablecimiento incompleto</span>
                )}
              </div>
              <p className="muted text-sm">
                {data.fields.find((f) => f.id === p.field_id)?.name ?? 'Sin campo operativo'}
              </p>
              {admin && (it || p.role === 'driver') && p.id !== data.profile.id && (
                <details>
                  <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                    <KeyRound className="mr-2 inline" size={16} />
                    Restablecer acceso
                  </summary>
                  <ResetAccount profile={p} />
                </details>
              )}
              {admin && p.role === 'driver' && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-semibold text-blue-700">
                    Asignación y vinculación
                  </summary>
                  <div className="stack mt-4">
                    <CommandForm
                      action="transfer_driver"
                      extra={{ id: p.id }}
                      label="Trasladar conductor"
                    >
                      <label>
                        Campo destino
                        <select name="field_id" defaultValue={p.field_id ?? ''}>
                          {data.fields
                            .filter((f) => f.active)
                            .map((f) => (
                              <option key={f.id} value={f.id}>
                                {f.name}
                              </option>
                            ))}
                        </select>
                      </label>
                      <label>
                        Motivo
                        <input name="reason" required />
                      </label>
                    </CommandForm>
                    <CommandForm
                      action="set_driver_active"
                      extra={{ id: p.id }}
                      label="Actualizar vinculación"
                    >
                      <label>
                        Vinculación
                        <select name="active" defaultValue={String(p.active)}>
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
    </>
  );
}
