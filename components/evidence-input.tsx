'use client';
import { useRef, useState } from 'react';
import { Camera, CheckCircle2, Trash2 } from 'lucide-react';
import { Button } from './ui/button';
import { photoError } from '@/features/inspections/validation';
import { browserClient } from '@/lib/supabase/browser';
export async function uploadEvidence(file: File, shiftId: string, kind = 'photo') {
  const validation = photoError(file);
  if (validation) throw new Error(validation);
  const db = browserClient();
  const {
    data: { user },
    error: userError,
  } = await db.auth.getUser();
  if (userError || !user) throw new Error('Inicia sesión nuevamente para guardar la evidencia.');
  const id = crypto.randomUUID();
  const path = `${user.id}/${shiftId}/${id}`;
  const { error: uploadError } = await db.storage.from('evidence').upload(path, file, {
    contentType: file.type,
    upsert: false,
  });
  if (uploadError) throw new Error('No se confirmó la carga. Conserva el archivo y reintenta.');
  const response = await fetch('/api/evidence', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, shift_id: shiftId, kind }),
  });
  const body = await response.json();
  if (!response.ok || !body.id) throw new Error(body.error ?? 'No se confirmó la carga.');
  return body.id as string;
}
export function EvidenceInput({
  shiftId,
  value,
  onChange,
}: {
  shiftId: string;
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  return (
    <div className="mt-3">
      <input
        ref={input}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        className="sr-only"
        aria-label="Agregar fotografía"
        disabled={pending || value.length >= 5}
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (!file) return;
          setError('');
          const error = photoError(file);
          if (error) {
            setError(error);
            return;
          }
          setPending(true);
          try {
            const id = await uploadEvidence(file, shiftId);
            onChange([...value, id]);
          } catch (error) {
            setError(error instanceof Error ? error.message : 'No se confirmó la carga.');
          } finally {
            setPending(false);
            e.target.value = '';
          }
        }}
      />
      <div className="flex flex-wrap items-center gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pending || value.length >= 5}
          onClick={() => input.current?.click()}
        >
          <Camera size={17} />
          {pending ? 'Guardando foto…' : 'Agregar fotografía'}
        </Button>
        {value.length > 0 && (
          <span className="flex items-center gap-1 text-xs text-emerald-700">
            <CheckCircle2 size={15} />
            {value.length} foto(s) guardada(s)
          </span>
        )}
        {value.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Quitar fotografías del borrador"
            onClick={() => onChange([])}
          >
            <Trash2 size={16} />
          </Button>
        )}
      </div>
      {error && (
        <p role="alert" className="error-box mt-3">
          {error}
        </p>
      )}
      <p className="mt-2 mb-0 text-xs text-slate-400">
        JPG, PNG o WebP · Máximo 8 MB por foto. Tómala solo cuando sea seguro.
      </p>
    </div>
  );
}
