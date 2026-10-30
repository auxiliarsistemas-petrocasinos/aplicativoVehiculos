'use client';
import { useRef, useState } from 'react';
import { Eraser, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { uploadEvidence } from './evidence-input';
export function SignaturePad({
  shiftId,
  value,
  onChange,
}: {
  shiftId: string;
  value?: string;
  onChange: (id: string | undefined) => void;
}) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const points = useRef(0);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const position = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) * 600) / rect.width,
      y: ((e.clientY - rect.top) * 180) / rect.height,
    };
  };
  return (
    <div>
      <h2>Firma del conductor</h2>
      <p className="muted text-sm">
        Dibuja tu firma dentro del recuadro. Se asociará a tu cuenta y a la fecha de confirmación.
      </p>
      <canvas
        ref={canvas}
        width={600}
        height={180}
        className="signature"
        aria-label="Recuadro para dibujar la firma con el dedo o el ratón"
        onPointerDown={(e) => {
          if (value || pending) return;
          drawing.current = true;
          e.currentTarget.setPointerCapture(e.pointerId);
          const p = position(e);
          const ctx = e.currentTarget.getContext('2d')!;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.strokeStyle = '#123969';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          points.current++;
        }}
        onPointerMove={(e) => {
          if (!drawing.current) return;
          const p = position(e);
          const ctx = e.currentTarget.getContext('2d')!;
          ctx.lineTo(p.x, p.y);
          ctx.stroke();
          points.current++;
        }}
        onPointerUp={() => (drawing.current = false)}
        onPointerCancel={() => (drawing.current = false)}
      />
      <div className="mt-3 flex flex-wrap gap-3">
        <Button
          type="button"
          variant="outline"
          disabled={pending}
          onClick={() => {
            canvas.current?.getContext('2d')?.clearRect(0, 0, 600, 180);
            points.current = 0;
            onChange(undefined);
          }}
        >
          <Eraser size={16} />
          Limpiar
        </Button>
        <Button
          type="button"
          disabled={pending || Boolean(value)}
          onClick={async () => {
            if (points.current < 5) {
              setError('Dibuja tu firma antes de guardarla.');
              return;
            }
            setPending(true);
            setError('');
            try {
              const blob = await new Promise<Blob | null>((resolve) =>
                canvas.current!.toBlob(resolve, 'image/png'),
              );
              if (!blob) throw new Error('No se pudo capturar la firma.');
              onChange(
                await uploadEvidence(
                  new File([blob], 'firma.png', { type: 'image/png' }),
                  shiftId,
                  'signature',
                ),
              );
            } catch (e) {
              setError(e instanceof Error ? e.message : 'No se confirmó la firma.');
            } finally {
              setPending(false);
            }
          }}
        >
          {value ? (
            <>
              <CheckCircle2 size={16} />
              Firma guardada
            </>
          ) : pending ? (
            'Guardando…'
          ) : (
            'Guardar firma'
          )}
        </Button>
      </div>
      {error && (
        <p className="error-box mt-3" role="alert">
          {error}
        </p>
      )}
      <p className="mt-3 text-xs text-slate-400">
        Constancia dibujada; no es una firma digital certificada. Si no puedes dibujarla, solicita
        asistencia para completar la captura.
      </p>
    </div>
  );
}
