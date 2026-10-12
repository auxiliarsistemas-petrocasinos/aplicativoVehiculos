import { NextResponse } from 'next/server';
import { getSnapshot } from '@/lib/supabase/queries';
import { shiftsCsv } from '@/features/analytics/metrics';
export async function GET(request: Request) {
  try {
    const data = await getSnapshot();
    if (data.profile.role === 'driver')
      return new NextResponse('Acceso no autorizado', { status: 403 });
    const p = new URL(request.url).searchParams;
    return new NextResponse(
      shiftsCsv(data, p.get('field') ?? '', p.get('from') ?? '', p.get('to') ?? ''),
      {
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': 'attachment; filename="turnos-demostracion.csv"',
          'Cache-Control': 'private, no-store',
        },
      },
    );
  } catch {
    return new NextResponse('Acceso no autorizado', { status: 403 });
  }
}
