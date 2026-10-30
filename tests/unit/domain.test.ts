import { describe, it, expect } from 'vitest';
import { normalizeAlias, suggestAlias } from '@/features/auth/alias';
import { answerSchema, photoError } from '@/features/inspections/validation';
import { incidentSchema } from '@/features/incidents/validation';
import { csvCell, metrics, shiftsCsv } from '@/features/analytics/metrics';
import catalog from '@/features/inspections/catalog-simplified.json';
import sourceCatalog from '@/features/inspections/catalog.json';
import type { Snapshot } from '@/lib/types';
const id = '00000000-0000-4000-8000-000000000001';
describe('Alias confirmados', () => {
  it('normaliza sin acentos ni espacios', () =>
    expect(normalizeAlias(' ÁLVARO. PÉREZ ')).toBe('alvaro.perez'));
  it('usa segundo apellido, nunca segundo nombre', () =>
    expect(suggestAlias('Álvaro', 'Pérez', 'Gómez', ['alvaro.perez']).alias).toBe(
      'alvaro.perez.g',
    ));
  it('detiene tercera colisión', () =>
    expect(
      suggestAlias('Álvaro', 'Pérez', 'Gómez', ['alvaro.perez', 'alvaro.perez.g']).alias,
    ).toBeNull());
  it('requiere validación con nombres compuestos', () =>
    expect(suggestAlias('Juan José', 'Pérez', 'Gómez', []).alias).toBeNull());
  it('no inventa inicial sin segundo apellido', () =>
    expect(suggestAlias('Ana', 'Sol', '', ['ana.sol']).alias).toBeNull());
});
describe('Evidencia obligatoria', () => {
  for (const rating of ['regular', 'bad']) {
    it(`${rating}: rechaza ausencia de foto`, () =>
      expect(
        answerSchema.safeParse({ item_id: 'a', rating, observation: 'Falla visible', photos: [] })
          .success,
      ).toBe(false));
    it(`${rating}: rechaza ausencia de observación`, () =>
      expect(
        answerSchema.safeParse({ item_id: 'a', rating, observation: ' ', photos: [id] }).success,
      ).toBe(false));
    it(`${rating}: acepta ambas evidencias`, () =>
      expect(
        answerSchema.safeParse({ item_id: 'a', rating, observation: 'Falla visible', photos: [id] })
          .success,
      ).toBe(true));
  }
  it('incidencia exige descripción y foto', () => {
    expect(incidentSchema.safeParse({ shift_id: id, description: '', photos: [id] }).success).toBe(
      false,
    );
    expect(
      incidentSchema.safeParse({ shift_id: id, description: 'Novedad', photos: [] }).success,
    ).toBe(false);
    expect(
      incidentSchema.safeParse({ shift_id: id, description: 'Novedad', photos: [id] }).success,
    ).toBe(true);
  });
  it('rechaza tipos, tamaño y archivos vacíos', () => {
    expect(photoError({ type: 'image/svg+xml', size: 100 })).toBeTruthy();
    expect(photoError({ type: 'image/jpeg', size: 9 * 1024 * 1024 })).toBeTruthy();
    expect(photoError({ type: 'image/png', size: 0 })).toBeTruthy();
    expect(photoError({ type: 'image/png', size: 100 })).toBeNull();
  });
});
describe('Catálogo trazable', () => {
  it('conserva seis preguntas sin reglas médicas', () => {
    expect(catalog.fatigue).toHaveLength(6);
    expect(catalog.status).toBe('demo_only');
  });
  it('cada control tiene fuente válida e ID único', () => {
    const refs = new Set(sourceCatalog.sources.map((s) => s.id));
    expect(new Set(catalog.inspection.map((i) => i.id)).size).toBe(catalog.inspection.length);
    for (const item of catalog.inspection)
      for (const source of item.sources) expect(refs.has(source)).toBe(true);
  });
  it('no promueve controles periódicos exclusivos a diarios', () =>
    expect(catalog.inspection.some((i) => i.id.startsWith('F17-'))).toBe(false));
  it('reduce la inspección a 25 controles livianos y 29 pesados', () => {
    const count = (vehicleType: 'light' | 'heavy') =>
      catalog.inspection.filter(
        (item) => item.vehicleType === 'both' || item.vehicleType === vehicleType,
      ).length;
    expect(count('light')).toBe(25);
    expect(count('heavy')).toBe(29);
  });
});
describe('Indicadores y exportación', () => {
  it('neutraliza fórmulas CSV y escapa comillas', () => {
    expect(csvCell('=HYPERLINK("x")')).toBe('"\'=HYPERLINK(""x"")"');
    expect(csvCell('a;b')).toBe('"a;b"');
  });
  it('suma segmentos y conserva retenciones de regularización', () => {
    const data = {
      fields: [{ id: 'f', name: 'Ficticio' }],
      vehicles: [{ id: 'v', field_id: 'f' }],
      shifts: [
        { id: 's', field_id: 'f', status: 'regularized', created_at: '2026-10-10T10:00:00Z' },
      ],
      usages: [
        { shift_id: 's', vehicle_id: 'v', start_km: 10, end_km: 20, delivered_at: '2026-10-10' },
        { shift_id: 's', vehicle_id: 'v', start_km: 20, end_km: null, delivered_at: null },
      ],
      incidents: [{ shift_id: 's', status: 'pending' }],
      restrictions: [],
      vehicleStates: [{ vehicle_id: 'v', in_use: true, eligible: false }],
    } as unknown as Snapshot;
    const m = metrics(data, 'f', '2026-10-01', '2026-10-31');
    expect(m.kilometers).toBe(10);
    expect(m.inUse).toBe(1);
    expect(m.pending).toBe(1);
    expect(m.active).toBe(0);
    expect(m.trend).toEqual([{ month: '2026-10', turnos: 1 }]);
    expect(shiftsCsv(data, 'f', '2026-10-01', '2026-10-31').split('\r\n')[1]).toBe(
      '"s";"Ficticio";"Regularizado";"";"";"10"',
    );
    expect(shiftsCsv(data, 'f', '2026-10-11').split('\r\n')).toHaveLength(1);
  });
});
