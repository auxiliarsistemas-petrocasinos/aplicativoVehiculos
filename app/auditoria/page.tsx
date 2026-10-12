import { redirect } from 'next/navigation';
import { pageData } from '@/lib/page-data';
import { serverClient } from '@/lib/supabase/server';
import { Shell } from '@/components/shell';
import { dateLabel } from '@/lib/utils';
export default async function Audit() {
  const data = await pageData();
  if (data.profile.role !== 'it_superadmin') redirect('/');
  const db = await serverClient();
  const { data: events, error } = await db
    .from('audit_events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(200);
  if (error) throw new Error('No se pudo consultar la auditoría');
  return (
    <Shell profile={data.profile}>
      <h1>Auditoría técnica</h1>
      <p className="muted">Últimas 200 actuaciones. Sin contraseñas ni respuestas sensibles.</p>
      <section className="panel table-wrap">
        <table>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Actuación</th>
              <th>Responsable</th>
              <th>Referencia</th>
            </tr>
          </thead>
          <tbody>
            {events?.map((e) => (
              <tr key={e.id}>
                <td>{dateLabel(e.created_at)}</td>
                <td>{e.action}</td>
                <td>{data.profiles.find((p) => p.id === e.actor_id)?.alias ?? e.actor_id}</td>
                <td className="max-w-56 break-all text-xs">{e.entity_id}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </Shell>
  );
}
