import { redirect } from 'next/navigation';
import { AuthForm } from '@/components/auth-form';
import { session } from '@/features/auth/session';
export default async function ChangePassword() {
  try {
    await session(true);
  } catch {
    redirect('/login');
  }
  return (
    <main className="flex min-h-screen items-center justify-center p-5">
      <div className="panel w-full max-w-md">
        <div className="logo mb-9">
          aplicativo<span>Vehiculos</span>
        </div>
        <h1>Protege tu cuenta</h1>
        <p className="muted mb-7">Cambia tu contraseña temporal antes de acceder a la operación.</p>
        <AuthForm change />
      </div>
    </main>
  );
}
