'use client';
import { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
export function PasswordInput({
  name = 'password',
  label = 'Contraseña',
  autoComplete = 'current-password',
}: {
  name?: string;
  label?: string;
  autoComplete?: string;
}) {
  const [visible, setVisible] = useState(false);
  const id = useId();
  return (
    <div>
      <label htmlFor={id}>{label}</label>
      <div className="relative mt-2">
        <input
          id={id}
          style={{ marginTop: 0, paddingRight: 50 }}
          name={name}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          required
          maxLength={128}
        />
        <button
          type="button"
          aria-label={visible ? 'Ocultar ' + label.toLowerCase() : 'Mostrar ' + label.toLowerCase()}
          aria-pressed={visible}
          onClick={() => setVisible(!visible)}
          className="absolute right-0 top-0 flex h-full w-12 items-center justify-center text-slate-500"
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </div>
    </div>
  );
}
