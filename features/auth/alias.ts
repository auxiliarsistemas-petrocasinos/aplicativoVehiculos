export function normalizeAlias(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '');
}
export function isValidAlias(value: string) {
  return /^[a-z]+\.[a-z]+(?:\.[a-z]+)?$/.test(value);
}
export function suggestAlias(
  firstName: string,
  firstSurname: string,
  secondSurname: string,
  existing: string[],
) {
  const parts = [firstName, firstSurname];
  if (parts.some((p) => !p.trim() || /\s/.test(p.trim())))
    return {
      alias: null,
      reason: 'Nombre o apellido compuesto/incompleto: requiere alias administrativo validado.',
    };
  const base = normalizeAlias(`${firstName}.${firstSurname}`);
  const taken = new Set(existing.map(normalizeAlias));
  if (!isValidAlias(base)) return { alias: null, reason: 'Revisar los nombres y el alias.' };
  if (!taken.has(base)) return { alias: base, reason: null };
  if (!secondSurname.trim() || /\s/.test(secondSurname.trim()))
    return { alias: null, reason: 'Se requiere validar el segundo apellido.' };
  const variant = base + '.' + normalizeAlias(secondSurname)[0];
  return taken.has(variant)
    ? {
        alias: null,
        reason: 'Colisión adicional: indique un alias único validado; regla pendiente.',
      }
    : { alias: variant, reason: null };
}
