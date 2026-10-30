import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import { randomUUID } from 'node:crypto';
test('administración: alta de conductor y Gerencia consulta/exporta sin modificar', async ({
  page,
}, testInfo) => {
  test.skip(
    !process.env.SUPABASE_SECRET_KEY || !process.env.TEST_PASSWORD,
    'Requiere servicios locales de integración.',
  );
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  expect(['127.0.0.1', 'localhost']).toContain(new URL(url).hostname);
  const service = createClient(url, process.env.SUPABASE_SECRET_KEY!, {
    auth: { persistSession: false },
  });
  const suffix = randomUUID().replace(/[^a-f]/g, '');
  const field = '20000000-0000-4000-8000-000000000001';
  for (const role of ['fleet_admin', 'management']) {
    const alias = (role === 'fleet_admin' ? 'admin' : 'gerencia') + '.' + suffix;
    const email = alias + '@example.com';
    const { data, error } = await service.auth.admin.createUser({
      email,
      password: process.env.TEST_PASSWORD!,
      email_confirm: true,
    });
    expect(error).toBeNull();
    expect(
      (
        await service.from('profiles').insert({
          id: data.user!.id,
          alias,
          email,
          full_name: 'Cuenta Ficticia ' + role,
          role,
          field_id: field,
          must_change_password: false,
        })
      ).error,
    ).toBeNull();
  }
  async function login(alias: string) {
    await page.goto('/login');
    await page.getByLabel('Usuario', { exact: true }).fill(alias);
    await page.getByLabel('Contraseña', { exact: true }).fill(process.env.TEST_PASSWORD!);
    await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
    await expect(
      page.getByRole('heading', { name: 'Dashboard de flota', exact: true }),
    ).toBeVisible({ timeout: 10_000 });
  }
  await login('admin.' + suffix);
  await page.screenshot({
    path: '.local/screenshots/administracion-' + testInfo.project.name + '.png',
    fullPage: true,
  });
  await page.goto('/conductores');
  for (const aliasSuffix of ['', '.p']) {
    await page.getByRole('button', { name: 'Nuevo conductor', exact: true }).click();
    await page.getByLabel('Primer nombre', { exact: true }).fill('Eva' + suffix);
    await page.getByLabel('Primer apellido', { exact: true }).fill('Ficticia');
    await page.getByLabel('Segundo apellido', { exact: true }).fill('Prueba');
    await page.getByRole('button', { name: 'Sugerir alias según los apellidos' }).click();
    const driverAlias = 'eva' + suffix + '.ficticia' + aliasSuffix;
    await expect(page.getByLabel('Usuario', { exact: true })).toHaveValue(driverAlias);
    await page.getByLabel('Correo', { exact: true }).fill(driverAlias + '@example.com');
    await page.getByLabel('Teléfono', { exact: true }).fill('0000000000');
    await expect(
      page.getByRole('combobox', { name: 'Rol', exact: true }).locator('option'),
    ).toHaveCount(1);
    await page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Alta de cuenta', exact: true }) })
      .getByLabel('Contraseña temporal', { exact: true })
      .fill(process.env.DEMO_PASSWORD!);
    await page.getByRole('button', { name: 'Crear cuenta', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Alta de cuenta', exact: true })).toHaveCount(0);
    const { data: created } = await service
      .from('profiles')
      .select('role,must_change_password')
      .eq('alias', driverAlias)
      .single();
    expect(created?.role).toBe('driver');
    expect(created?.must_change_password).toBe(true);
  }
  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).last().click();
  await login('gerencia.' + suffix);
  const exported = await page.request.get('/api/export');
  expect(exported.status()).toBe(200);
  expect(exported.headers()['content-type']).toContain('text/csv');
  expect(await exported.text()).toContain('Kilómetros');
  await page.goto('/vehiculos');
  await expect(page.getByRole('heading', { name: 'Vehículos', exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Nuevo vehículo', exact: true })).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.goto('/perfil');
  await page.getByRole('button', { name: 'Cerrar sesión', exact: true }).last().click();
  await page.goto('/login');
  await page.getByLabel('Usuario', { exact: true }).fill('eva' + suffix + '.ficticia.p');
  await page.getByLabel('Contraseña', { exact: true }).fill(process.env.DEMO_PASSWORD!);
  await page.getByRole('button', { name: 'Iniciar sesión', exact: true }).click();
  await expect(page).toHaveURL(/change-password$/);
  await expect(page.getByLabel('Nueva contraseña', { exact: true })).toBeVisible();
});
