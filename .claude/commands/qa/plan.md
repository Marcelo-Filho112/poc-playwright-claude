---
description: Explora um URL e gera plano de testes versionado em specs/<slug>/plan.md
argument-hint: <url> [--public]
allowed-tools: Bash(npm run explore:*), Read, Write, Edit, Glob, Grep, Task
---

# Gerar plano de testes para: $ARGUMENTS

Siga as fases EM ORDEM. O URL alvo e `$1`. A flag opcional `--public` força o alvo
como site publico (sem login).

## Fase 1 — Explorar

1. Rode `npm run explore -- $1`. O stdout traz a linha `slug      : <slug>` — anote o
   **slug**; ele identifica todos os artefatos deste alvo.
2. Leia `output/explore_<slug>.json` (inventario completo da pagina).
3. Leia `output/explore_<slug>.aria.yaml` apenas se for pequeno (< ~50KB); se for grande,
   leia so as primeiras ~200 linhas para entender a estrutura.

## Fase 2 — Versionar artefatos e criar o seed

4. Copie (via Read + Write) os artefatos canonicos para o diretorio versionado:
   - `output/explore_<slug>.json` → `specs/<slug>/exploration.json`
   - `output/explore_<slug>.aria.yaml` → `specs/<slug>/aria.yaml`
5. Decida o TESTDIR:
   - Flag `--public` presente, OU host do URL diferente de localhost/`BASE_URL` (.env)
     → **publico**: `TESTDIR = tests/public/<slug>` (projeto `public`).
   - Caso contrario → **autenticado**: `TESTDIR = tests/<slug>` (projeto `chromium`,
     herda `.auth/user.json`).
   - Em duvida real (ex.: URL local mas pagina parece nao exigir login), pergunte ao
     usuario antes de continuar.
6. Crie `TESTDIR/seed.spec.ts` — estado inicial de TODOS os cenarios deste alvo:

   ```ts
   // seed para specs/<slug>/plan.md — estado inicial dos cenarios deste alvo
   import { test } from '@playwright/test';

   test('seed', async ({ page }) => {
     await page.goto('$1');
   });
   ```

## Fase 3 — Planner (subagente)

7. Invoque a Task com `subagent_type: playwright-test-planner`. O prompt DEVE conter:
   - O URL alvo e o seed file `TESTDIR/seed.spec.ts` (para usar no `planner_setup_page`).
   - O **inventario JSON inline** (e pequeno) e a nota de que `specs/<slug>/aria.yaml`
     contem a arvore ARIA completa (o agente pode ler com Read).
   - Instrucao: cobrir SOMENTE as categorias realmente presentes no inventario, conforme
     a tabela do CLAUDE.md (textos/titulos, botoes, links, tabelas, graficos,
     entradas→respostas), incluindo a regra de ouro: **toda entrada deve ter assercao do
     efeito** (URL muda, resultado aparece, mensagem de validacao), nao so o preenchimento.
   - Formato do plano: cada grupo de cenarios com linha `**Seed:** TESTDIR/seed.spec.ts`;
     cada cenario com `**File:** TESTDIR/<kebab-case-do-cenario>.spec.ts`, steps numerados
     e bullets `- expect:` com o resultado esperado.
   - Salvar o plano via `planner_save_plan`.

## Fase 4 — Pos-processamento (planner_save_plan grava em caminho proprio)

8. Localize o plano recem-salvo: Glob `specs/**/*.md` e identifique o arquivo modificado
   agora (tipicamente `specs/plan.md` ou similar — NAO confunda com `specs/README.md`
   nem com planos de outros slugs).
9. Normalize para `specs/<slug>/plan.md`:
   - Mova o conteudo para `specs/<slug>/plan.md` (Write) e delete/esvazie o arquivo
     generico orfao se o planner salvou fora do lugar.
   - Corrija toda linha `**Seed:**` e `**File:**` que nao aponte para TESTDIR.
   - Garanta um cabecalho com: URL alvo, slug, data, projeto (`chromium`|`public`).

## Relatorio final

10. Reporte ao usuario: slug, projeto escolhido, nº de grupos e cenarios do plano,
    arquivos criados (`specs/<slug>/...`, `TESTDIR/seed.spec.ts`) e o proximo passo:
    `/qa:generate <slug>`.
