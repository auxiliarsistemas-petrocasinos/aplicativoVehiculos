import { NextResponse } from 'next/server';
import { z } from 'zod';
import { session } from '@/features/auth/session';
import { canExport } from '@/features/auth/authorization';
import { csvCell } from '@/features/analytics/metrics';
import { statusLabels } from '@/lib/types';
import { observed } from '@/lib/observability';

const filtersSchema = z.object({
  field: z.string().uuid().optional(),
  from: z.iso.date().optional(),
  to: z.iso.date().optional(),
});
const MAX_EXPORT_ROWS = 5000;
const MAX_EXPORT_DURATION_MS = 30_000;

export async function GET(request: Request) {
  return observed('export.get', async (requestId) => {
    try {
      const { db, profile } = await session();
      if (!canExport(profile.role))
        return new NextResponse('Acceso no autorizado', { status: 403 });
      const params = new URL(request.url).searchParams;
      const filters = filtersSchema.parse({
        field: params.get('field') || undefined,
        from: params.get('from') || undefined,
        to: params.get('to') || undefined,
      });
      const { data: fields, error: fieldError } = await db
        .from('fields')
        .select('id,name')
        .order('id')
        .limit(200);
      if (fieldError) throw fieldError;
      let countQuery = db.from('shifts').select('id', { count: 'exact', head: true });
      if (filters.field) countQuery = countQuery.eq('field_id', filters.field);
      if (filters.from) countQuery = countQuery.gte('created_at', `${filters.from}T00:00:00-05:00`);
      if (filters.to) countQuery = countQuery.lte('created_at', `${filters.to}T23:59:59-05:00`);
      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      if ((count ?? 0) > MAX_EXPORT_ROWS)
        return new NextResponse('La exportación supera 5.000 turnos. Ajusta los filtros.', {
          status: 422,
          headers: { 'X-Request-ID': requestId },
        });
      const fieldNames = new Map((fields ?? []).map((field) => [field.id, field.name]));
      const encoder = new TextEncoder();
      let cancelled = false;
      const stream = new ReadableStream({
        async start(controller) {
          controller.enqueue(
            encoder.encode(
              '\ufeff' +
                ['ID', 'Campo', 'Estado', 'Apertura', 'Cierre', 'Kilómetros']
                  .map(csvCell)
                  .join(';') +
                '\r\n',
            ),
          );
          let before: string | undefined;
          let exported = 0;
          const deadline = Date.now() + MAX_EXPORT_DURATION_MS;
          try {
            for (;;) {
              if (cancelled || request.signal.aborted) break;
              if (Date.now() > deadline)
                throw new Error('La exportación excedió su tiempo máximo.');
              let query = db
                .from('shifts')
                .select('id,field_id,status,opened_at,closed_at,created_at')
                .order('created_at', { ascending: false })
                .limit(200);
              if (before) query = query.lt('created_at', before);
              if (filters.field) query = query.eq('field_id', filters.field);
              if (filters.from) query = query.gte('created_at', `${filters.from}T00:00:00-05:00`);
              if (filters.to) query = query.lte('created_at', `${filters.to}T23:59:59-05:00`);
              const { data: shifts, error } = await query;
              if (error) throw error;
              if (!shifts?.length) break;
              exported += shifts.length;
              if (exported > MAX_EXPORT_ROWS) throw new Error('La exportación excedió su límite.');
              const ids = shifts.map((shift) => shift.id);
              const { data: usages, error: usageError } = await db
                .from('vehicle_usages')
                .select('shift_id,start_km,end_km')
                .in('shift_id', ids)
                .limit(1000);
              if (usageError) throw usageError;
              const rows = shifts.map((shift) => {
                const kilometers = (usages ?? [])
                  .filter((usage) => usage.shift_id === shift.id && usage.end_km !== null)
                  .reduce((total, usage) => total + usage.end_km! - usage.start_km, 0);
                return [
                  shift.id,
                  fieldNames.get(shift.field_id) ?? shift.field_id,
                  statusLabels[shift.status] ?? shift.status,
                  shift.opened_at,
                  shift.closed_at,
                  kilometers,
                ]
                  .map(csvCell)
                  .join(';');
              });
              controller.enqueue(encoder.encode(rows.join('\r\n') + '\r\n'));
              if (shifts.length < 200) break;
              before = shifts.at(-1)!.created_at;
            }
            controller.close();
          } catch (error) {
            controller.error(error);
          }
        },
        cancel() {
          cancelled = true;
        },
      });
      return new NextResponse(stream, {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="turnos-demostracion.csv"',
          'Cache-Control': 'private, no-store',
          'X-Content-Type-Options': 'nosniff',
          'X-Request-ID': requestId,
        },
      });
    } catch (error) {
      return new NextResponse('Solicitud de exportación inválida', {
        status: error instanceof z.ZodError ? 400 : 403,
        headers: { 'X-Request-ID': requestId },
      });
    }
  });
}
