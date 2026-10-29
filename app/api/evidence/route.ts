import { NextResponse } from 'next/server';
import { z } from 'zod';
import { session } from '@/features/auth/session';
import { photoError } from '@/features/inspections/validation';

const requestSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('initiate'),
    shift_id: z.uuid(),
    kind: z.enum(['photo', 'signature']),
    mime_type: z.enum(['image/jpeg', 'image/png', 'image/webp']),
    bytes: z
      .number()
      .int()
      .min(1)
      .max(8 * 1024 * 1024),
  }),
  z.object({ action: z.literal('complete'), intent_id: z.uuid() }),
]);

function sameOrigin(request: Request) {
  try {
    const origin = request.headers.get('origin');
    return (
      !!origin &&
      new URL(origin).host === request.headers.get('host') &&
      ['http:', 'https:'].includes(new URL(origin).protocol)
    );
  } catch {
    return false;
  }
}

function realImage(file: Blob, bytes: Uint8Array) {
  const isPng = bytes[0] === 137 && bytes[1] === 80 && bytes[2] === 78 && bytes[3] === 71;
  const isJpeg = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const isWebp =
    String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF' &&
    String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  return (
    (isPng && file.type === 'image/png') ||
    (isJpeg && file.type === 'image/jpeg') ||
    (isWebp && file.type === 'image/webp')
  );
}

export async function POST(request: Request) {
  try {
    if (!sameOrigin(request))
      return NextResponse.json({ error: 'Origen no autorizado.' }, { status: 403 });
    if (Number(request.headers.get('content-length') ?? 0) > 4096)
      return NextResponse.json({ error: 'Solicitud demasiado grande.' }, { status: 413 });
    const { db, profile } = await session();
    if (profile.role !== 'driver')
      return NextResponse.json({ error: 'Acceso no autorizado.' }, { status: 403 });
    const input = requestSchema.parse(await request.json());

    if (input.action === 'initiate') {
      const { data: intents, error } = await db.rpc('create_evidence_upload_intent', {
        shift_id_input: input.shift_id,
        kind_input: input.kind,
        mime_type_input: input.mime_type,
        expected_bytes_input: input.bytes,
      });
      const intent = intents?.[0];
      if (error || !intent)
        return NextResponse.json(
          { error: 'No fue posible autorizar la carga. Verifica el turno y los límites.' },
          { status: 400 },
        );
      const { data: signed, error: signedError } = await db.storage
        .from('evidence')
        .createSignedUploadUrl(intent.path, { upsert: false });
      if (signedError || !signed?.token)
        return NextResponse.json({ error: 'No fue posible autorizar la carga.' }, { status: 400 });
      return NextResponse.json({
        intent_id: intent.id,
        path: intent.path,
        token: signed.token,
        expires_at: intent.expires_at,
      });
    }

    const { data: intent, error: intentError } = await db
      .from('evidence_upload_intents')
      .select('id,path,mime_type,expected_bytes,status')
      .eq('id', input.intent_id)
      .single();
    if (intentError || !intent)
      return NextResponse.json({ error: 'Carga no disponible.' }, { status: 404 });
    if (intent.status === 'claimed') return NextResponse.json({ id: intent.id });
    const { data: file, error: downloadError } = await db.storage
      .from('evidence')
      .download(intent.path);
    if (downloadError || !file)
      return NextResponse.json(
        { error: 'No se pudo verificar la imagen guardada. Conserva el archivo y reintenta.' },
        { status: 400 },
      );
    const validation = photoError(file);
    const bytes = new Uint8Array(await file.arrayBuffer());
    if (
      validation ||
      file.size !== intent.expected_bytes ||
      file.type !== intent.mime_type ||
      !realImage(file, bytes)
    )
      return NextResponse.json(
        { error: validation ?? 'El contenido no corresponde a una imagen permitida.' },
        { status: 400 },
      );
    const { data: id, error } = await db.rpc('finalize_evidence_upload_intent', {
      intent_id_input: intent.id,
    });
    if (error || !id)
      return NextResponse.json(
        {
          error:
            'La imagen se cargó, pero su asociación no se confirmó. Reintenta; la reconciliación técnica conservará el estado.',
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
    if (!id) return NextResponse.json({ error: 'Evidencia no disponible.' }, { status: 404 });
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
