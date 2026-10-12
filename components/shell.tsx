'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Truck,
  Users,
  MapPin,
  Clock3,
  TriangleAlert,
  ShieldCheck,
  LogOut,
  ChevronRight,
  UserRound,
  Wifi,
} from 'lucide-react';
import type { Profile } from '@/lib/types';
import { roleLabels } from '@/lib/types';
import { logout } from '@/features/auth/actions';
import { Button } from './ui/button';
const links = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/vehiculos', label: 'Vehículos', icon: Truck },
  { href: '/conductores', label: 'Conductores', icon: Users },
  { href: '/turnos', label: 'Turnos', icon: Clock3 },
  { href: '/incidencias', label: 'Incidencias', icon: TriangleAlert },
  { href: '/campos', label: 'Campos', icon: MapPin },
];
export function Shell({ profile, children }: { profile: Profile; children: React.ReactNode }) {
  const path = usePathname();
  const driver = profile.role === 'driver';
  const menu = driver
    ? [
        { href: '/', label: 'Inicio', icon: LayoutDashboard },
        { href: '/turno', label: 'Mi turno', icon: Clock3 },
        { href: '/incidencias', label: 'Incidencias', icon: TriangleAlert },
        { href: '/turnos', label: 'Historial', icon: ClipboardHistory },
        { href: '/perfil', label: 'Perfil', icon: UserRound },
      ]
    : [
        ...links,
        ...(profile.role === 'it_superadmin'
          ? [{ href: '/auditoria', label: 'Auditoría', icon: ShieldCheck }]
          : []),
      ];
  return (
    <>
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:fixed focus:z-50 focus:bg-white focus:p-4"
      >
        Saltar al contenido
      </a>
      <aside className="sidebar">
        <Link href="/" className="logo px-2 text-white">
          aplicativo<span>Vehiculos</span>
        </Link>
        <p className="mt-2 px-2 text-[10px] tracking-[.2em] text-blue-200/50">
          GESTIÓN INTEGRAL DE FLOTA
        </p>
        <div className="my-8 border-t border-white/10" />
        <p className="mb-3 px-4 text-[10px] tracking-[.18em] text-blue-200/40">OPERACIÓN</p>
        <nav className="grid gap-1" aria-label="Navegación principal">
          {menu.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className={`nav-link ${path === l.href ? 'active' : ''}`}
            >
              <l.icon size={19} />
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="mt-auto pt-8">
          <div className="mb-5 rounded-xl border border-white/10 bg-white/5 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs text-sky-300">
              <ShieldCheck size={16} /> Demostración
            </div>
            <p className="mb-0 text-xs leading-5 text-slate-400">
              Datos ficticios. Validación PESV pendiente para operación real.
            </p>
          </div>
          <form action={logout}>
            <button className="nav-link w-full">
              <LogOut size={18} />
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>
      <div className="app-area">
        <header className="topbar">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <span className="desktop-only">Petrocasinos</span>
            <ChevronRight size={15} className="desktop-only" />
            <span className="font-medium text-slate-600">
              {menu.find((l) => l.href === path)?.label ?? 'Detalle de operación'}
            </span>
          </div>
          <div className="flex items-center gap-4">
            <span className="desktop-only flex items-center gap-2 text-xs text-slate-500">
              <Wifi size={15} className="text-emerald-600" /> Operación en línea
            </span>
            <div className="h-7 w-px bg-slate-200" />
            <Link href="/perfil" className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                {profile.full_name
                  .split(' ')
                  .map((s) => s[0])
                  .slice(0, 2)
                  .join('')}
              </div>
              <div className="desktop-only">
                <p className="mb-1 text-sm font-semibold">{profile.full_name}</p>
                <p className="mb-0 text-[11px] text-slate-500">{roleLabels[profile.role]}</p>
              </div>
            </Link>
          </div>
        </header>
        <main id="contenido" className="page-content">
          {children}
        </main>
      </div>
      <nav className="mobile-nav" aria-label="Navegación móvil">
        {menu.slice(0, 5).map((l) => (
          <Link className={path === l.href ? 'active' : ''} key={l.href} href={l.href}>
            <l.icon size={21} />
            {l.label}
          </Link>
        ))}
        {!driver && (
          <Link href="/campos">
            <MapPin size={21} />
            Campos
          </Link>
        )}
      </nav>
    </>
  );
}
function ClipboardHistory(props: React.ComponentProps<typeof Clock3>) {
  return <Clock3 {...props} />;
}
export function SignOutButton() {
  return (
    <form action={logout}>
      <Button variant="outline">
        <LogOut size={16} />
        Cerrar sesión
      </Button>
    </form>
  );
}
