import { NextResponse } from 'next/server';
import { session } from '@/features/auth/session';
import { z } from 'zod';
import { photoError } from '@/features/inspections/validation';
const uploadReceipt = z.object({
  id: z.uuid(),
  shift_id: z.uuid(),
  kind: z.enum(['photo', 'signature']),
});
export async function POST(request: Request) {
  try {
    const origin = request.headers.get('origin');
    if (
      !origin ||
      new URL(origin).host !== request.headers.get('host') ||
      !['http:', 'https:'].includes(new URL(origin).protocol)
    )
      return NextResponse.json({ error: 'Origen no autorizado.' }, { status: 403 });
    if (Number(request.headers.get('content-length') ?? 0) > 4096)
      return NextResponse.json({ error: 'Solicitud demasiado grande.' }, { status: 413 });
    const { db, profile } = await session();
    if (profile.role !== 'driver')
      return NextResponse.json({ error: 'Acceso no autorizado.' }, { status: 403 });
    const { id, shift_id: shift, kind } = uploadReceipt.parse(await request.json());
    const path = `${profile.id}/${shift}/${id}`;
    // El binario viaja directamente a Storage; Vercel recibe solo este recibo.
    // La descarga usa el JWT del propietario y RLS, nunca la clave de servicio.
    const { data: file, error: downloadError } = await db.storage.from('evidence').download(path);
    if (downloadError || !file)
      return NextResponse.json(
        { error: 'No se pudo verificar la imagen guardada. Conserva el archivo y reintenta.' },
        { status: 400 },
      );
    const validation = photoError(file);
    if (validation) return NextResponse.json({ error: validation }, { status: 400 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPng = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
    const isJpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
    const isWebp =
      String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
      String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
    if (
      !(
        (isPng && file.type === 'image/png') ||
        (isJpeg && file.type === 'image/jpeg') ||
        (isWebp && file.type === 'image/webp')
      )
    )
      return NextResponse.json(
        { error: 'El contenido no corresponde a una imagen permitida.' },
        { status: 400 },
      );
    const { error } = await db.rpc('execute_command', {
      action: 'register_evidence',
      payload: { shift_id: shift, id, path, kind },
      request_id: id,
    });
    if (error)
      return NextResponse.json(
        {
          error:
            'La imagen se cargó, pero su asociación no se confirmó. Reintenta; el archivo huérfano queda sujeto a limpieza técnica.',
        },
        { status: 400 },
      );
    return NextResponse.json({ id });
  } catch {
    return NextResponse.json({ error: 'No fue posible guardar la evidencia.' }, { status: 400 });
  }
}
export async function GET(request: Request) {
  try {
    const { db } = await session();
    const id = new URL(request.url).searchParams.get('id');
    const { data, error } = await db.from('evidences').select('path').eq('id', id).single();
    if (error || !data)
      return NextResponse.json({ error: 'Evidencia no disponible.' }, { status: 404 });
    const { data: url, error: signedError } = await db.storage
      .from('evidence')
      .createSignedUrl(data.path, 60);
    if (signedError || !url)
      return NextResponse.json({ error: 'Evidencia no disponible.' }, { status: 404 });
    return NextResponse.json(
      { url: url.signedUrl },
      { headers: { 'Cache-Control': 'private, no-store' } },
    );
  } catch {
    return NextResponse.json({ error: 'Acceso no autorizado.' }, { status: 403 });
  }
}
