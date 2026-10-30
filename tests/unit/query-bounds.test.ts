import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';

describe('Límites de consultas', () => {
  const files = globSync(['app/**/*.{ts,tsx}', 'lib/**/*.{ts,tsx}']);
  const source = files.map((file) => readFileSync(file, 'utf8')).join('\n');

  it('no reintroduce la fotografía global', () => {
    expect(source).not.toContain('getSnapshot');
  });

  it('no permite select global sin columnas', () => {
    expect(source).not.toMatch(/\.select\(\s*['"]\*['"]\s*\)/);
  });

  it('mantiene topes cerrados para páginas y exportaciones', () => {
    const queries = readFileSync('lib/supabase/queries.ts', 'utf8');
    const exportRoute = readFileSync('app/api/export/route.ts', 'utf8');
    expect(queries).toContain('MAX_PAGE_SIZE = 200');
    expect(queries).toContain('.max(MAX_PAGE_SIZE)');
    expect(exportRoute).toContain('.limit(200)');
    expect(exportRoute).toContain('MAX_EXPORT_ROWS = 5000');
    expect(exportRoute).toContain('request.signal.aborted');
    expect(exportRoute).toContain('cancel()');
  });

  it('no confía en cabeceras genéricas ni en un bucket global de red', () => {
    const auth = readFileSync('features/auth/actions.ts', 'utf8');
    expect(auth).not.toContain("get('x-forwarded-for')");
    expect(auth).not.toContain("'unknown'");
    expect(auth).toContain('process.env.VERCEL');
  });

  it('reconcilia metadatos completos y reclama antes de borrar', () => {
    const cleanup = readFileSync('scripts/cleanup-evidence.mjs', 'utf8');
    expect(cleanup).toContain('new URL(url).hostname');
    expect(cleanup).toContain('.range(offset, offset + 999)');
    expect(cleanup).toContain(".update({ status: 'expired' })");
    expect(cleanup.indexOf(".update({ status: 'expired' })")).toBeLessThan(
      cleanup.indexOf('.remove([claimed.path])'),
    );
  });
});
