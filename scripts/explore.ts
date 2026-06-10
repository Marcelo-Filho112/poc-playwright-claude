import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';

/**
 * Explorador de pagina para geracao de testes (workflow do video, adaptado ao container).
 *
 * O agente (Claude Code) dispara este script apontando para uma URL. Ele:
 *   1. abre a pagina,
 *   2. captura a ARIA snapshot (arvore de roles + nomes — base dos locators getByRole),
 *   3. lista os elementos interativos (links, botoes, campos),
 *   4. tira um screenshot,
 *   5. salva tudo em output/ e screenshots/.
 *
 * O agente le esses arquivos e escreve os tests/*.spec.ts grounded no que existe de fato.
 *
 * Uso:
 *   docker compose run --rm pw npm run explore -- https://www.amazon.com.br/
 *   (ou .\pw.ps1 npm run explore -- https://www.amazon.com.br/)
 */
const url = process.argv[2] ?? process.env.EXPLORE_URL ?? process.env.BASE_URL ?? 'http://localhost:3000';
const slug = url.replace(/^https?:\/\//, '').replace(/[^a-z0-9]+/gi, '_').replace(/_+$/g, '').slice(0, 60);

async function main() {
  const browser = await chromium.launch();
  // Contexto "realista" reduz bloqueios de anti-bot em sites publicos.
  const context = await browser.newContext({
    locale: 'pt-BR',
    viewport: { width: 1366, height: 900 },
    userAgent:
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  });
  const page = await context.newPage();

  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45_000 });
  await page.waitForLoadState('networkidle', { timeout: 15_000 }).catch(() => {});

  const title = await page.title();
  const finalUrl = page.url();

  // ARIA snapshot: arvore concisa de role+name, ideal para escolher locators getByRole.
  const aria = await page.locator('body').ariaSnapshot();

  // Inventario de elementos interativos com seus nomes acessiveis.
  async function listByRole(role: 'link' | 'button' | 'textbox' | 'searchbox' | 'combobox') {
    const items = await page.getByRole(role).all();
    const out: string[] = [];
    for (const el of items.slice(0, 40)) {
      const name = (await el.getAttribute('aria-label')) ?? (await el.textContent()) ?? '';
      const clean = name.replace(/\s+/g, ' ').trim();
      if (clean) out.push(clean);
    }
    return [...new Set(out)];
  }

  const interactive = {
    searchboxes: await listByRole('searchbox'),
    textboxes: await listByRole('textbox'),
    comboboxes: await listByRole('combobox'),
    buttons: await listByRole('button'),
    links: await listByRole('link'),
  };

  const outDir = path.join(process.cwd(), 'output');
  const shotDir = path.join(process.cwd(), 'screenshots');
  await mkdir(outDir, { recursive: true });
  await mkdir(shotDir, { recursive: true });

  const shot = path.join(shotDir, `explore_${slug}.png`);
  await page.screenshot({ path: shot, fullPage: false });

  const report = { url, finalUrl, title, exploredAt: new Date().toISOString(), interactive };
  await writeFile(path.join(outDir, `explore_${slug}.json`), JSON.stringify(report, null, 2), 'utf-8');
  await writeFile(path.join(outDir, `explore_${slug}.aria.yaml`), aria, 'utf-8');

  console.log('=== EXPLORACAO ===');
  console.log('title      :', title);
  console.log('finalUrl   :', finalUrl);
  console.log('searchboxes:', interactive.searchboxes.slice(0, 5));
  console.log('buttons    :', interactive.buttons.slice(0, 10));
  console.log('links      :', interactive.links.slice(0, 10));
  console.log('relatorio  : output/explore_' + slug + '.json');
  console.log('aria tree  : output/explore_' + slug + '.aria.yaml');
  console.log('screenshot : screenshots/explore_' + slug + '.png');

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
