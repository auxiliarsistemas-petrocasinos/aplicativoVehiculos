import { pageData } from '@/lib/page-data';
import { Shell, SignOutButton } from '@/components/shell';
import { roleLabels } from '@/lib/types';
export default async function Profile() {
  const data = await pageData();
  const p = data.profile;
  return (
    <Shell profile={p}>
      <div className="mx-auto max-w-xl">
        <h1>Mi perfil</h1>
        <section className="panel stack">
          <div>
            <h2>{p.full_name}</h2>
            <p className="muted">
              {roleLabels[p.role]} · {p.alias}
            </p>
          </div>
          <div>
            <p className="eyebrow">CAMPO ASIGNADO</p>
            {data.fields.find((f) => f.id === p.field_id)?.name ?? 'Acceso administrativo'}
          </div>
          <p className="info-box">
            Para cambios de cuenta o restablecimiento de acceso, contacta al administrador por un
            canal externo.
          </p>
          <SignOutButton />
        </section>
      </div>
    </Shell>
  );
}
