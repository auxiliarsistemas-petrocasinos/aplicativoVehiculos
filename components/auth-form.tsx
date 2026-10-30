'use client';
import { useState, useTransition } from 'react';
import { ArrowRight, LockKeyhole } from 'lucide-react';
import { login, changePassword } from '@/features/auth/actions';
import { PasswordInput } from './password-input';
import { Button } from './ui/button';
export function AuthForm({
  change = false,
  configured = true,
}: {
  change?: boolean;
  configured?: boolean;
}) {
  const [error, setError] = useState('');
  const [pending, start] = useTransition();
  return (
    <form
      className="stack"
      action={(form) =>
        start(async () => {
          setError('');
          const result = await (change ? changePassword : login)(form);
          if (result?.error) setError(result.error);
        })
      }
    >
      {!change && (
        <label>
          Usuario
          <input
            name="alias"
            placeholder="nombre.apellido"
            autoCapitalize="none"
            autoCorrect="off"
            autoComplete="username"
            required
            maxLength={100}
          />
        </label>
      )}
      <PasswordInput
        label={change ? 'Nueva contraseña' : 'Contraseña'}
        autoComplete={change ? 'new-password' : 'current-password'}
      />
      {change && (
        <>
          <PasswordInput name="confirm" label="Confirmar contraseña" autoComplete="new-password" />
          <p className="muted text-sm">
            Elige una contraseña distinta de la temporal, de al menos 12 caracteres.
          </p>
        </>
      )}
      {error && (
        <p role="alert" className="error-box">
          {error}
        </p>
      )}
      {!configured && (
        <p className="info-box">
          Supabase todavía no está configurado. Consulta las instrucciones de instalación del
          proyecto.
        </p>
      )}
      <Button disabled={pending || !configured} type="submit" className="w-full">
        {pending ? 'Verificando…' : change ? 'Guardar contraseña' : 'Iniciar sesión'}
        <ArrowRight size={18} />
      </Button>
      {!change && (
        <p className="muted text-center text-sm leading-6">
          ¿Necesitas restablecer tu contraseña?
          <br />
          Solicítalo a tu administrador por el canal externo habitual.
        </p>
      )}
      <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
        <LockKeyhole size={14} /> Acceso personal y seguro
      </div>
    </form>
  );
}
