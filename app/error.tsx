'use client';
import { Button } from '@/components/ui/button';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="mx-auto my-20 max-w-lg p-5">
      <div className="panel">
        <h1>No pudimos cargar la operación</h1>
        <p className="muted">
          Revisa tu conexión e intenta nuevamente. Si el problema continúa, contacta al
          administrador.
        </p>
        <Button onClick={reset}>Reintentar</Button>
        <a href="/login" className="ml-4 text-blue-700">
          Ir al inicio de sesión
        </a>
      </div>
    </main>
  );
}
