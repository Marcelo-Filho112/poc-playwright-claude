---
description: Gera os specs Playwright a partir de specs/<slug>/plan.md
argument-hint: <slug> [cenario|grupo|all]
allowed-tools: Read, Glob, Grep, Task, Bash(npx playwright test:*)
---

# Gerar testes do plano specs/$1/plan.md (alvo: $2 — default "all")

## Preparacao

1. Leia `specs/$1/plan.md`. Se nao existir, oriente a rodar `/qa:plan <url>` primeiro e pare.
2. Extraia do plano: TESTDIR (das linhas `**Seed:**`/`**File:**`) e o projeto
   correspondente (`public` se TESTDIR esta em `tests/public/`, senao `chromium`).
3. Liste os cenarios alvo:
   - `$2` vazio ou `all` → todos os cenarios do plano que ainda nao tem spec gerado
     (confira com Glob quais `TESTDIR/*.spec.ts` ja existem).
   - `$2` = id de grupo (ex.: `1`) → todos os cenarios do grupo.
   - `$2` = id de cenario (ex.: `1.2`) → so esse.

## Geracao (SEQUENCIAL — nunca em paralelo)

A sessao de browser do MCP playwright-test e UNICA: invoque um generator por vez e
aguarde terminar antes do proximo.

4. Para CADA cenario, invoque a Task `subagent_type: playwright-test-generator` com o
   prompt no formato que o agente espera:

   ```
   <test-suite>nome do grupo, sem o ordinal</test-suite>
   <test-name>nome do cenario, sem o ordinal</test-name>
   <test-file>TESTDIR/<kebab-case-do-cenario>.spec.ts</test-file>
   <seed-file>TESTDIR/seed.spec.ts</seed-file>
   <body>steps e expects copiados VERBATIM do plano</body>
   ```

5. Apos cada cenario, verifique com Read que o arquivo foi criado e confira as
   convencoes do CLAUDE.md:
   - locators `getByRole`/`getByText`/`getByLabel` (nada de CSS/classe fragil);
   - comentario `// N. <step>` antes de cada acao;
   - toda entrada (fill/check/selectOption) seguida de `expect` do **efeito**.
   Anote violacoes — NAO corrija aqui (isso e papel do `/qa:heal` e da curadoria).

## Verificacao

6. Ao final, rode uma unica vez:
   `npx playwright test TESTDIR --project=<chromium|public> --reporter=list`
7. Reporte: specs gerados (arquivo → cenario), resultado por teste (pass/fail),
   violacoes anotadas, e recomende `/qa:heal $1` se houver vermelho — senao
   `/qa:curate $1`.
