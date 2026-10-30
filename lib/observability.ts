import 'server-only';
import { randomUUID } from 'node:crypto';

type Outcome = 'ok' | 'error';

export async function observed<T>(operation: string, work: (requestId: string) => Promise<T>) {
  const requestId = randomUUID();
  const started = performance.now();
  let outcome: Outcome = 'ok';
  try {
    return await work(requestId);
  } catch (error) {
    outcome = 'error';
    throw error;
  } finally {
    // Solo metadatos técnicos de lista cerrada: no filtros, usuarios, rutas de Storage ni payloads.
    console.info(
      JSON.stringify({
        event: 'server_operation',
        operation,
        requestId,
        outcome,
        durationMs: Math.round(performance.now() - started),
      }),
    );
  }
}
