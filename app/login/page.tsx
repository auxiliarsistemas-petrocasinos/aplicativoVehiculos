import { AuthForm } from '@/components/auth-form';
import { configured } from '@/lib/supabase/server';
import { Truck, ShieldCheck, ClipboardCheck, ChartNoAxesCombined } from 'lucide-react';
export default function LoginPage() {
  return (
    <main className="grid min-h-screen lg:grid-cols-[1.1fr_1fr]">
      <section className="relative flex flex-col justify-between overflow-hidden bg-[#102b50] p-10 text-white lg:p-16">
        <div className="logo text-2xl">
          aplicativo<span>Vehiculos</span>
        </div>
        <div className="relative z-10 py-12">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-blue-300/20 bg-blue-400/10 px-4 py-2 text-xs text-blue-200">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> GESTIÓN INTEGRAL DE FLOTA
          </div>
          <h1 className="max-w-lg text-4xl leading-tight lg:text-5xl">
            Tu operación,
            <br />
            <span className="text-sky-400">siempre en movimiento.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-8 text-blue-100/70">
            Cada turno, cada vehículo y cada novedad. Toda la información que necesitas, en un solo
            lugar.
          </p>
          <div className="mt-10 grid gap-5 text-sm text-blue-100">
            <div className="flex items-center gap-3">
              <ClipboardCheck className="text-sky-400" /> Inspecciones y turnos trazables
            </div>
            <div className="flex items-center gap-3">
              <ShieldCheck className="text-sky-400" /> Evidencias y acceso por roles
            </div>
            <div className="flex items-center gap-3">
              <ChartNoAxesCombined className="text-sky-400" /> Información para tomar decisiones
            </div>
          </div>
        </div>
        <Truck
          aria-hidden
          className="absolute -right-10 bottom-2 h-72 w-72 rotate-[-8deg] text-blue-300/5"
          strokeWidth={1}
        />
        <p className="relative text-xs text-blue-200/50">Petrocasinos · Gestión de vehículos</p>
      </section>
      <section className="flex items-center justify-center bg-white p-7 lg:p-16">
        <div className="w-full max-w-sm">
          <p className="eyebrow mb-3">BIENVENIDO A TU OPERACIÓN</p>
          <h1 className="mb-3 text-3xl">Inicia sesión</h1>
          <p className="muted mb-9 leading-6">
            Ingresa con tu usuario y contraseña para continuar.
          </p>
          <AuthForm configured={configured()} />
          <p className="mt-10 rounded-lg bg-amber-50 p-3 text-center text-xs leading-5 text-amber-800">
            Entorno de demostración · Solo datos ficticios.
            <br />
            Catálogo pendiente de validación PESV.
          </p>
        </div>
      </section>
    </main>
  );
}
