import { redirect } from 'next/navigation';
import { pageData } from '@/lib/page-data';
import { getCurrentShift } from '@/lib/supabase/queries';
import { serverClient } from '@/lib/supabase/server';
import { Shell } from '@/components/shell';
import { ShiftWorkflow, type WorkflowDraft } from '@/components/shift-workflow';
export default async function ShiftPage() {
  const data = await pageData(getCurrentShift);
  if (data.profile.role !== 'driver') redirect('/turnos');
  const shift = data.shifts.find((s) => ['opening', 'active', 'closing'].includes(s.status));
  let draft: WorkflowDraft = {};
  if (shift) {
    const db = await serverClient();
    const { data: rows } = await db
      .from('operation_drafts')
      .select('data')
      .eq('shift_id', shift.id)
      .eq(
        'kind',
        shift.status === 'active'
          ? 'substitution'
          : shift.status === 'closing'
            ? 'closing'
            : 'opening',
      )
      .maybeSingle();
    draft = (rows?.data ?? {}) as WorkflowDraft;
  }
  return (
    <Shell profile={data.profile}>
      <ShiftWorkflow key={shift?.id ?? 'none'} data={data} draft={draft} />
    </Shell>
  );
}
