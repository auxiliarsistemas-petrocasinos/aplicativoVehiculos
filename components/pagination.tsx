import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function Pagination({
  nextCursor,
  params,
}: {
  nextCursor?: string;
  params?: Record<string, string | undefined>;
}) {
  if (!nextCursor) return null;
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params ?? {})) if (value) query.set(key, value);
  query.set('cursor', nextCursor);
  return (
    <nav className="mt-6 flex justify-end" aria-label="Paginación">
      <Link
        className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-semibold text-blue-700"
        href={`?${query.toString()}`}
      >
        Siguiente página
        <ArrowRight size={16} />
      </Link>
    </nav>
  );
}
