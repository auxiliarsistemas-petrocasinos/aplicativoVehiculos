'use client';
import Image from 'next/image';
import { useState } from 'react';
import { Camera } from 'lucide-react';
import { Button } from './ui/button';
export function EvidenceGallery({ ids }: { ids: string[] }) {
  const [urls, setUrls] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  if (!ids.length) return null;
  return (
    <div className="my-3">
      <Button
        variant="outline"
        size="sm"
        disabled={loading}
        onClick={async () => {
          setLoading(true);
          setError('');
          try {
            const results = await Promise.all(
              ids.map(async (id) => {
                const response = await fetch(`/api/evidence?id=${id}`);
                const data = await response.json();
                if (!response.ok) throw new Error();
                return data.url as string;
              }),
            );
            setUrls(results);
          } catch {
            setError('No se pudieron consultar las evidencias.');
          } finally {
            setLoading(false);
          }
        }}
      >
        <Camera size={16} />
        {loading ? 'Consultando…' : `Ver evidencias (${ids.length})`}
      </Button>
      {urls.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {urls.map((url, i) => (
            <a href={url} key={i} target="_blank" rel="noopener noreferrer">
              <Image
                src={url}
                alt={`Evidencia ${i + 1} del registro`}
                width={180}
                height={120}
                unoptimized
                className="h-28 w-40 rounded-xl border border-slate-200 object-contain"
              />
            </a>
          ))}
        </div>
      )}
      {urls.length > 0 && (
        <p className="mt-2 text-xs text-slate-400">
          Enlaces privados válidos durante 60 segundos. Usa «Ver evidencias» para renovarlos.
        </p>
      )}
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
    </div>
  );
}
