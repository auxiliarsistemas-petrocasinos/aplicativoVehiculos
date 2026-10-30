'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { execute } from '@/features/shifts/actions';
import { Button } from './ui/button';
export function useCommand() {
  const router = useRouter();
  const last = useRef<{ serialized: string; key: string } | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function run(action: string, payload: Record<string, unknown>) {
    if (pending) return;
    const serialized = JSON.stringify({ action, payload });
    if (last.current?.serialized !== serialized)
      last.current = { serialized, key: crypto.randomUUID() };
    setPending(true);
    setError('');
    try {
      const result = await execute({ action, payload, requestId: last.current.key });
      if (result.error) {
        setError(result.error);
        return;
      }
      last.current = null;
      router.refresh();
      return result.id;
    } catch {
      setError(
        'La confirmación no llegó. Reintenta sin cambiar los datos para verificar el guardado.',
      );
    } finally {
      setPending(false);
    }
  }
  return { run, pending, error, setError };
}
export function CommandForm({
  action,
  children,
  extra = {},
  label = 'Guardar',
  onSuccess,
}: {
  action: string;
  children: React.ReactNode;
  extra?: Record<string, unknown>;
  label?: string;
  onSuccess?: () => void;
}) {
  const { run, pending, error } = useCommand();
  const [success, setSuccess] = useState(false);
  return (
    <form
      className="stack"
      onSubmit={async (e) => {
        e.preventDefault();
        setSuccess(false);
        const form = new FormData(e.currentTarget);
        const payload: Record<string, unknown> = { ...extra };
        for (const [key, value] of form) payload[key] = value;
        if (await run(action, payload)) {
          setSuccess(true);
          onSuccess?.();
        }
      }}
    >
      {children}
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      {success && (
        <p role="status" className="badge">
          Guardado y confirmado por el servidor.
        </p>
      )}
      <Button disabled={pending} type="submit">
        {pending ? 'Confirmando…' : label}
      </Button>
    </form>
  );
}
