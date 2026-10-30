'use client';
import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import type { Answer, InspectionInput, Vehicle, InspectionItem } from '@/lib/types';
import { Button } from './ui/button';
import { EvidenceInput } from './evidence-input';
export function applicableItems(vehicle: Vehicle, allItems: InspectionItem[]) {
  return allItems.filter((i) => i.vehicleType === 'both' || i.vehicleType === vehicle.vehicle_type);
}
export function initialInspection(vehicle: Vehicle, templateId: string): InspectionInput {
  return { template_id: templateId, odometer: vehicle.odometer, answers: [] };
}
export function InspectionForm({
  vehicle,
  shiftId,
  value,
  onChange,
  allItems,
  version,
}: {
  allItems: InspectionItem[];
  version: string;
  vehicle: Vehicle;
  shiftId: string;
  value: InspectionInput;
  onChange: (v: InspectionInput) => void;
}) {
  const items = applicableItems(vehicle, allItems);
  const categories = [...new Set(items.map((i) => i.category))];
  const [category, setCategory] = useState(0);
  const current = categories[category];
  function update(id: string, patch: Partial<Answer>) {
    const existing = value.answers.find((a) => a.item_id === id);
    const answer = { item_id: id, observation: '', photos: [], ...existing, ...patch } as Answer;
    onChange({ ...value, answers: [...value.answers.filter((a) => a.item_id !== id), answer] });
  }
  return (
    <div className="stack">
      <div className="rounded-xl bg-slate-50 p-4">
        <p className="mb-2 font-semibold">
          {vehicle.plate} · {vehicle.description}
        </p>
        <span className="text-xs text-slate-500">
          {vehicle.vehicle_type === 'light' ? 'Liviano' : 'Pesado'} · Catálogo de demostración{' '}
          {version}
        </span>
      </div>
      <label>
        Odómetro (km)
        <input
          type="number"
          min="0"
          step="0.1"
          value={value.odometer}
          onChange={(e) => onChange({ ...value, odometer: Number(e.target.value) })}
          required
        />
      </label>
      {value.odometer < vehicle.odometer && (
        <p className="info-box">
          Esta lectura es menor que la última registrada. Verifica el dato; se conservará una alerta
          auditada sin alterar tu lectura.
        </p>
      )}
      <div>
        <div className="mb-2 flex justify-between text-xs text-slate-500">
          <span>
            {value.answers.length} de {items.length} controles respondidos
          </span>
          <span>{Math.round((value.answers.length / items.length) * 100)}%</span>
        </div>
        <progress
          max={items.length}
          value={value.answers.length}
          className="h-2 w-full accent-blue-600"
        />
      </div>
      <label>
        Categoría
        <select value={category} onChange={(e) => setCategory(Number(e.target.value))}>
          {categories.map((c, i) => (
            <option key={c} value={i}>
              {i + 1}. {c} (
              {
                value.answers.filter((a) =>
                  items.some((it) => it.id === a.item_id && it.category === c),
                ).length
              }
              /{items.filter((it) => it.category === c).length})
            </option>
          ))}
        </select>
      </label>
      {items
        .filter((i) => i.category === current)
        .map((item) => {
          const a = value.answers.find((x) => x.item_id === item.id);
          return (
            <fieldset key={item.id} className="rounded-xl border border-slate-200 p-4">
              <legend className="px-1 text-sm font-semibold">{item.label}</legend>
              <div className="inspection-choices">
                {[
                  { v: 'good', l: 'Bueno' },
                  { v: 'regular', l: 'Regular' },
                  { v: 'bad', l: 'Malo' },
                  { v: 'na', l: 'No aplica' },
                ].map((r) => (
                  <label key={r.v}>
                    <input
                      type="radio"
                      name={shiftId + item.id}
                      value={r.v}
                      checked={a?.rating === r.v}
                      onChange={() => update(item.id, { rating: r.v as Answer['rating'] })}
                    />
                    {r.l}
                  </label>
                ))}
              </div>
              {a && ['regular', 'bad'].includes(a.rating) && (
                <div className="mt-4">
                  <label>
                    Observación obligatoria
                    <textarea
                      maxLength={2000}
                      value={a.observation}
                      onChange={(e) => update(item.id, { observation: e.target.value })}
                      rows={2}
                    />
                  </label>
                  <EvidenceInput
                    shiftId={shiftId}
                    value={a.photos}
                    onChange={(photos) => update(item.id, { photos })}
                  />
                </div>
              )}
              <details className="mt-3 text-[11px] text-slate-400">
                <summary>Referencia del control</summary>
                {item.sources.join(' · ')}
              </details>
            </fieldset>
          );
        })}
      <div className="flex items-center justify-between gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={category === 0}
          onClick={() => setCategory(category - 1)}
        >
          <ChevronLeft size={16} />
          Categoría anterior
        </Button>
        <Button
          type="button"
          variant="secondary"
          disabled={category === categories.length - 1}
          onClick={() => setCategory(category + 1)}
        >
          Siguiente categoría
          <ChevronRight size={16} />
        </Button>
      </div>
      {value.answers.length === items.length && (
        <p className="badge">
          <Check size={16} />
          Todas las preguntas tienen respuesta; se validarán las evidencias al confirmar.
        </p>
      )}
    </div>
  );
}
