'use client';
import Link from 'next/link';
import { useState } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  Truck,
  Clock3,
  TriangleAlert,
  ShieldAlert,
  ArrowUpRight,
  ArrowRight,
  MapPin,
  Download,
  Plus,
  ClipboardCheck,
} from 'lucide-react';
import type { Snapshot } from '@/lib/types';
import { statusLabels } from '@/lib/types';
import { dateLabel } from '@/lib/utils';
import { metrics } from '@/features/analytics/metrics';
import { Button } from './ui/button';
export function Dashboard({ data }: { data: Snapshot }) {
  const [field, setField] = useState('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const m = metrics(data, field, from, to);
  const driver = data.profile.role === 'driver';
  const current = data.shifts.find((s) => ['opening', 'active', 'closing'].includes(s.status));
  const currentUsage = data.usages.find((u) => u.shift_id === current?.id && !u.delivered_at);
  const donut = [
    { name: 'En uso', value: m.inUse },
    { name: 'Fuera de uso', value: Math.max(0, m.vehicles.length - m.inUse) },
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <p className="eyebrow mb-2">
            {driver ? 'TU DÍA EN MOVIMIENTO' : 'PANORAMA DE LA OPERACIÓN'}
          </p>
          <h1 className="mb-2">
            {driver ? `Hola, ${data.profile.full_name.split(' ')[0]}` : 'Dashboard de flota'}
          </h1>
          <p className="muted">
            {driver
              ? 'Todo lo que necesitas para un turno seguro.'
              : 'Consulta tus vehículos, turnos y novedades en un solo lugar.'}
          </p>
        </div>
        <span className="badge badge-warning">Demostración · Datos ficticios</span>
      </div>
      {driver ? (
        <section className="hero-surface mb-6 flex items-center justify-between gap-5 p-7">
          <div className="relative z-10">
            <p className="mb-3 text-xs font-semibold tracking-widest text-blue-200">MI TURNO</p>
            <h2 className="mb-2 text-2xl">
              {current ? statusLabels[current.status] : 'Listo para comenzar'}
            </h2>
            <p className="mb-5 text-sm text-blue-100">
              {currentUsage
                ? `Vehículo ${currentUsage.plate_snapshot}`
                : data.fields.find((f) => f.id === data.profile.field_id)?.name}
            </p>
            <Button asChild className="bg-white text-blue-800 hover:bg-blue-50">
              <Link href="/turno">
                {current ? 'Continuar mi turno' : 'Iniciar turno'}
                <ArrowRight size={18} />
              </Link>
            </Button>
          </div>
          <Truck className="mr-4 h-28 w-28 text-white/30" strokeWidth={1.2} />
        </section>
      ) : (
        <section className="mb-6 flex flex-wrap items-end gap-3">
          <label className="min-w-44 flex-1">
            Campo
            <select value={field} onChange={(e) => setField(e.target.value)}>
              <option value="">Todos los campos</option>
              {data.fields.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            Desde
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} />
          </label>
          <label>
            Hasta
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} />
          </label>
          <Button asChild variant="outline">
            <a href={`/api/export?field=${field}&from=${from}&to=${to}`}>
              <Download size={17} />
              Exportar CSV
            </a>
          </Button>
        </section>
      )}
      <div className="mb-6 grid grid-cols-2 gap-3 xl:grid-cols-4">
        {[
          {
            label: 'Turnos activos',
            value: m.active,
            icon: Clock3,
            href: '/turnos',
            caption: 'Activos y en cierre',
            color: 'blue',
          },
          {
            label: 'Vehículos en uso',
            value: m.inUse,
            icon: Truck,
            href: '/vehiculos',
            caption: `de ${m.vehicles.length} vehículos`,
            color: 'green',
          },
          {
            label: 'Incidencias pendientes',
            value: m.pending,
            icon: TriangleAlert,
            href: '/incidencias',
            caption: 'Requieren seguimiento',
            color: 'red',
          },
          {
            label: 'Vehículos restringidos',
            value: m.restricted,
            icon: ShieldAlert,
            href: '/vehiculos',
            caption: 'Restricción preventiva',
            color: 'amber',
          },
        ].map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="panel group flex flex-col justify-between gap-4 !p-5"
          >
            <div className="flex items-center justify-between">
              <div
                className="stat-icon"
                style={
                  k.color === 'red'
                    ? { background: '#fff0f0', color: '#e95060' }
                    : k.color === 'green'
                      ? { background: '#e7f8ef', color: '#12a673' }
                      : k.color === 'amber'
                        ? { background: '#fff5e4', color: '#e39b26' }
                        : {}
                }
              >
                <k.icon size={23} />
              </div>
              <ArrowUpRight size={16} className="text-slate-300 group-hover:text-blue-600" />
            </div>
            <div>
              <p className="mb-1 text-3xl font-bold tracking-tight">{k.value}</p>
              <p className="mb-2 text-sm font-semibold">{k.label}</p>
              <p className="mb-0 text-xs text-slate-400">{k.caption}</p>
            </div>
          </Link>
        ))}
      </div>
      {!driver ? (
        <div className="mb-6 grid gap-5 xl:grid-cols-[1.5fr_1fr]">
          <section className="panel min-w-0">
            <div className="mb-6 flex justify-between">
              <div>
                <h2 className="mb-1">Operación por campo</h2>
                <p className="muted text-xs">Turnos del período y flota actual</p>
              </div>
              <span className="badge badge-blue">
                <MapPin size={12} />
                {m.byField.length} campos
              </span>
            </div>
            {m.byField.length ? (
              <ResponsiveContainer width="100%" height={235}>
                <BarChart data={m.byField} margin={{ left: -25, right: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#edf1f5" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis
                    allowDecimals={false}
                    tick={{ fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip />
                  <Bar
                    isAnimationActive={false}
                    name="Turnos"
                    dataKey="turnos"
                    fill="#2674e8"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={35}
                  />
                  <Bar
                    isAnimationActive={false}
                    name="Vehículos"
                    dataKey="vehiculos"
                    fill="#b7d7ff"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={35}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="empty">No hay registros para este filtro.</p>
            )}
          </section>
          <section className="panel">
            <h2 className="mb-1">Utilización de la flota</h2>
            <p className="muted text-xs">Situación actual de los vehículos</p>
            {m.vehicles.length ? (
              <div className="relative">
                <ResponsiveContainer width="100%" height={190}>
                  <PieChart>
                    <Pie
                      isAnimationActive={false}
                      data={donut}
                      dataKey="value"
                      innerRadius={61}
                      outerRadius={82}
                      paddingAngle={3}
                    >
                      {donut.map((d, i) => (
                        <Cell key={d.name} fill={['#2479ed', '#dfeaff'][i]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <strong className="text-3xl">
                    {Math.round((m.inUse / m.vehicles.length) * 100)}%
                  </strong>
                  <span className="text-xs text-slate-500">en uso</span>
                </div>
              </div>
            ) : (
              <p className="empty">Aún no hay vehículos.</p>
            )}
            <div className="flex justify-center gap-5 text-xs text-slate-500">
              <span>🔵 En uso · {m.inUse}</span>
              <span>Fuera de uso · {m.vehicles.length - m.inUse}</span>
            </div>
          </section>
        </div>
      ) : (
        <section className="mb-6">
          <h2>Accesos rápidos</h2>
          <div className="grid grid-cols-3 gap-3">
            {[
              { href: '/turno', label: 'Mi turno', icon: Clock3 },
              { href: '/incidencias', label: 'Incidencias', icon: TriangleAlert },
              { href: '/turnos', label: 'Historial', icon: ClipboardCheck },
            ].map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="panel flex flex-col items-center gap-3 text-sm font-semibold"
              >
                <l.icon className="text-blue-600" />
                {l.label}
              </Link>
            ))}
          </div>
        </section>
      )}
      {!driver && (
        <section className="panel mb-6">
          <h2 className="mb-1">Evolución de turnos</h2>
          <p className="muted text-xs">
            Turnos registrados por mes · Período y campo seleccionados
          </p>
          {m.trend.length ? (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={m.trend} margin={{ left: -20, right: 20, top: 15 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Line
                  isAnimationActive={false}
                  name="Turnos"
                  type="linear"
                  dataKey="turnos"
                  stroke="#2479ed"
                  strokeWidth={3}
                  dot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="empty">Aún no hay turnos para comparar.</p>
          )}
          <Link href="/turnos" className="text-xs font-semibold text-blue-600">
            Consultar registros que sustentan el indicador →
          </Link>
        </section>
      )}
      <section className="panel">
        <div className="mb-5 flex items-center justify-between">
          <div>
            <h2 className="mb-1">Actividad reciente</h2>
            <p className="muted mb-0 text-xs">Registros confirmados en el servidor</p>
          </div>
          <Link href="/turnos" className="text-xs font-semibold text-blue-600">
            Ver turnos <ArrowRight className="inline" size={14} />
          </Link>
        </div>
        {driver && m.shifts.length ? (
          <div className="stack">
            {[...m.shifts]
              .sort((a, b) => b.created_at.localeCompare(a.created_at))
              .slice(0, 5)
              .map((s) => (
                <Link
                  href={`/turnos/${s.id}`}
                  key={s.id}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-100 p-4"
                >
                  <div>
                    <p className="mb-1 text-sm font-semibold">{dateLabel(s.created_at)}</p>
                    <p className="mb-0 text-xs text-slate-500">
                      {data.fields.find((f) => f.id === s.field_id)?.name}
                    </p>
                  </div>
                  <span className="badge badge-blue">{statusLabels[s.status]}</span>
                </Link>
              ))}
          </div>
        ) : m.shifts.length ? (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Campo</th>
                  <th>Estado</th>
                  <th>Detalle</th>
                </tr>
              </thead>
              <tbody>
                {[...m.shifts]
                  .sort((a, b) => b.created_at.localeCompare(a.created_at))
                  .slice(0, 5)
                  .map((s) => (
                    <tr key={s.id}>
                      <td>{dateLabel(s.created_at)}</td>
                      <td>{data.fields.find((f) => f.id === s.field_id)?.name}</td>
                      <td>
                        <span className="badge badge-blue">{statusLabels[s.status]}</span>
                      </td>
                      <td>
                        <Link href={`/turnos/${s.id}`} className="font-medium text-blue-600">
                          Consultar
                        </Link>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="empty">
            <ClipboardCheck className="mx-auto mb-3 text-slate-300" size={35} />
            <p>Aún no hay turnos registrados.</p>
            {driver && (
              <Button asChild variant="secondary">
                <Link href="/turno">
                  <Plus size={16} />
                  Iniciar mi primer turno
                </Link>
              </Button>
            )}
          </div>
        )}
      </section>
      <p className="mt-5 text-xs leading-5 text-slate-400">
        La utilización y las restricciones muestran la situación actual; los turnos e incidencias
        respetan el período seleccionado. Catálogo de demostración pendiente de validación PESV.
      </p>
    </>
  );
}
