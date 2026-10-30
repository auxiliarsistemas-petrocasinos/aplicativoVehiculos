import { test, expect } from '@playwright/test';
test('login accesible, contraseña oculta/visible y diseño sin desborde', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: 'Inicia sesión' })).toBeVisible();
  const password = page.getByLabel('Contraseña', { exact: true });
  await password.fill('Clave-ficticia-de-prueba');
  await expect(password).toHaveAttribute('type', 'password');
  await page.getByRole('button', { name: 'Mostrar contraseña', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'text');
  await page.getByRole('button', { name: 'Ocultar contraseña', exact: true }).click();
  await expect(password).toHaveAttribute('type', 'password');
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true,
  );
  await expect(
    page.getByText('Demostración · Solo datos ficticios.', { exact: false }),
  ).toBeVisible();
});
test('rutas privadas exigen sesión', async ({ page }) => {
  await page.goto('/turno');
  await expect(page).toHaveURL(/\/login$/);
  const response = await page.request.get('/api/export');
  expect(response.status()).toBe(403);
});
