import { test, expect, type Page } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
const configured = Boolean(process.env.SUPABASE_SECRET_KEY && process.env.TEST_PASSWORD);
const png = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==',
  'base64',
);
async function inspection(page: Page, km: number) {
  await page.getByLabel('Odómetro (km)', { exact: true }).fill(String(km));
  const categories = page.getByRole('combobox', { name: 'Categoría', exact: true });
  const count = await categories.locator('option').count();
  for (let i = 0; i < count; i++) {
    await categories.selectOption(String(i));
    for (const radio of await page.getByRole('radio', { name: 'Bueno', exact: true }).all())
      await radio.check();
  }
}
test('recorrido real: alias, cambio inicial, apertura, foto, firma, incidencia y cierre', async ({
  page,
}, testInfo) => {
  test.skip(!configured, 'Requiere servicios locales y .env.local con TEST_PASSWORD.');
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  expect(['127.0.0.1', 'localhost']).toContain(new URL(url).hostname);
  const service = createClient(url, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
  const letters = randomUUID().replace(/[^a-f]/g, '');
  const alias = 'interfaz.' + letters;
  const email = alias + '@example.com';
  const password = process.env.DEMO_PASSWORD!;
  const { data: user, error } = await service.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  expect(error).toBeNull();
  const field = '20000000-0000-4000-8000-000000000001';
  expect(
    (
      await service.from('profiles').insert({
        id: user.user!.id,
        alias,
        email,
        full_name: 'Conductor Ficticio Interfaz',
        phone: '0000000000',
        role: 'driver',
        field_id: field,
      })
    ).error,
  ).toBeNull();
  const plate = 'UI' + randomUUID().replaceAll('-', '').slice(0, 7).toUpperCase();
  expect(
    (
      await service.from('vehicles').insert({
        plate,
        description: 'Vehículo ficticio interfaz',
        vehicle_type: 'light',
        field_id: field,
        odometer: 100,
      })
    ).error,
  ).toBeNull();
  await page.goto('/login');
  await page.getByLabel('Usuario', { exact: true }).fill(alias);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/change-password$/);
  await page.getByLabel('Nueva contraseña', { exact: true }).fill(process.env.TEST_PASSWORD!);
  await page.getByLabel('Confirmar contraseña', { exact: true }).fill(process.env.TEST_PASSWORD!);
  await page.getByRole('button', { name: 'Guardar contraseña', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Hola, Conductor', exact: true })).toBeVisible();
  await page.goto('/turno');
  await page.getByRole('button', { name: 'Iniciar turno', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Apertura de turno', exact: true })).toBeVisible();
  await page.getByRole('radio', { name: new RegExp(plate) }).check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  for (const radio of await page.getByRole('radio', { name: 'No', exact: true }).all())
    await radio.check();
  await page.getByRole('button', { name: 'Continuar', exact: true }).click();
  await inspection(page, 100);
  await page.getByRole('combobox', { name: 'Categoría', exact: true }).selectOption('0');
  await page.getByRole('radio', { name: 'Regular', exact: true }).first().check();
  await page
    .getByLabel('Observación obligatoria')
    .fill('Observación ficticia de prueba de interfaz');
  await page
    .locator('input[type=file]')
    .first()
    .setInputFiles({ name: 'evidencia.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByText('1 foto(s) guardada(s)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Guardar borrador', exact: true }).click();
  await expect(page.getByText('Borrador guardado en el servidor.', { exact: false })).toBeVisible();
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Apertura de turno', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar a firma', exact: true }).click();
  const canvas = page.getByLabel('Recuadro para dibujar la firma con el dedo o el ratón');
  const box = (await canvas.boundingBox())!;
  await page.mouse.move(box.x + 20, box.y + 90);
  await page.mouse.down();
  await page.mouse.move(box.x + 55, box.y + 35, { steps: 8 });
  await page.mouse.move(box.x + 90, box.y + 110, { steps: 8 });
  await page.mouse.move(box.x + 145, box.y + 55, { steps: 8 });
  await page.mouse.up();
  await page.getByRole('button', { name: 'Guardar firma', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Firma guardada', exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar apertura', exact: true }).click();
  await expect(page).toHaveURL(/\/turnos\/[0-9a-f-]+$/);
  const shiftId = page.url().split('/').pop()!;
  await page.goto('/incidencias?new=1');
  await page
    .getByLabel('Descripción obligatoria')
    .fill('Incidencia ficticia para verificar cierre con pendiente');
  await page
    .locator('input[type=file]')
    .setInputFiles({ name: 'incidencia.png', mimeType: 'image/png', buffer: png });
  await expect(page.getByText('1 foto(s) guardada(s)', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Confirmar incidencia', exact: true }).click();
  await expect(
    page.getByText('Incidencia ficticia para verificar cierre con pendiente', { exact: true }),
  ).toBeVisible();
  await page.goto('/turno');
  await page.getByRole('button', { name: 'Iniciar cierre', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Cierre de turno', exact: true })).toBeVisible();
  await inspection(page, 110);
  await page.getByRole('button', { name: 'Finalizar turno', exact: true }).click();
  await expect(page).toHaveURL(new RegExp('/turnos/' + shiftId + '$'));
  await expect(page.getByText('Cerrado', { exact: true })).toBeVisible();
  expect(
    (await service.from('incidents').select('status').eq('shift_id', shiftId).single()).data
      ?.status,
  ).toBe('pending');
  expect(
    (await service.from('inspections').select('id').eq('shift_id', shiftId)).data,
  ).toHaveLength(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Hola, Conductor', exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: '.local/screenshots/conductor-' + testInfo.project.name + '.png',
    fullPage: true,
  });
});
