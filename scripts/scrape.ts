import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import 'dotenv/config';

/**
 * Exemplo de scraping / automacao de browser (molde).
 *
 * Navega ate BASE_URL, extrai uma lista de itens (titulo + URL) e grava em
 * output/items.json. Reutilize/adapte via prompt (veja docs/prompts.md).
 *
 * Rodar:  npm run scrape
 *
 * Equivalente em Playwright CLI (abordagem do video):
 *   playwright-cli goto $BASE_URL
 *   playwright-cli snapshot
 */
const baseURL = process.env.BASE_URL ?? 'http://localhost:3000';
const MAX_ITEMS = 10;

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage();

  await page.goto(baseURL, { waitUntil: 'domcontentloaded' });

  // Extrai os primeiros links com texto como exemplo generico.
  // Ajuste o seletor para o conteudo real que voce quer raspar.
  const items = await page
    .getByRole('link')
    .evaluateAll((nodes, max) => {
      return nodes
        .map((el) => {
          const a = el as HTMLAnchorElement;
          return { title: a.textContent?.trim() ?? '', url: a.href };
        })
        .filter((item) => item.title.length > 0)
        .slice(0, max);
    }, MAX_ITEMS);

  const outDir = path.join(process.cwd(), 'output');
  await mkdir(outDir, { recursive: true });
  const outFile = path.join(outDir, 'items.json');
  await writeFile(outFile, JSON.stringify(items, null, 2), 'utf-8');

  console.log(`Extraidos ${items.length} itens de ${baseURL} -> ${outFile}`);

  await browser.close();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
