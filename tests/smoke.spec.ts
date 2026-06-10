import { test, expect } from '@playwright/test';

/**
 * Teste smoke (molde de formato esperado para testes gerados).
 *
 * Convencoes:
 *  - Locators por role/text/label (getByRole, getByText, getByLabel) — evite CSS fragil.
 *  - Asserts web-first (expect(locator).toBeVisible()) que ja esperam o elemento.
 *
 * Este projeto herda a sessao autenticada (storageState). Se o teste nao precisa
 * de login, ele simplesmente ignora a sessao.
 */
test('home carrega e exibe conteudo principal', async ({ page }) => {
  await page.goto('/');

  // Ajuste para um elemento estavel da sua home.
  await expect(page).toHaveTitle(/.+/);
  await expect(page.getByRole('main').or(page.locator('body'))).toBeVisible();
});

test('navegacao principal esta acessivel', async ({ page }) => {
  await page.goto('/');

  // Exemplo: confirma que existe pelo menos um link de navegacao.
  const nav = page.getByRole('navigation').first();
  await expect(nav.or(page.getByRole('link').first())).toBeVisible();
});
