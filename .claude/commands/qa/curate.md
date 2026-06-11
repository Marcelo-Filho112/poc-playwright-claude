---
description: Gera/atualiza specs/<slug>/curation.md (matriz de cobertura, convencoes, status)
argument-hint: <slug>
allowed-tools: Read, Glob, Task
---

# Curadoria do alvo $1

1. Determine TESTDIR (`tests/$1` ou `tests/public/$1` — Glob para ver qual existe) e o
   projeto correspondente (`chromium` | `public`).
2. Verifique pre-requisitos: `specs/$1/exploration.json` e `specs/$1/plan.md` devem
   existir (senao, oriente a rodar `/qa:plan <url>` primeiro e pare). TESTDIR pode
   estar vazio — a curadoria entao reporta tudo como "Nao coberto".
3. Invoque a Task `subagent_type: playwright-test-curator` passando no prompt:
   - slug = `$1`, TESTDIR e projeto;
   - paths dos artefatos: `specs/$1/exploration.json`, `specs/$1/plan.md`,
     `specs/$1/aria.yaml`;
   - destino do relatorio: `specs/$1/curation.md` (sobrescrever por completo).
4. Quando o agente terminar, leia `specs/$1/curation.md` e apresente ao usuario um
   resumo: cobertura por categoria, nº de violacoes de convencao, top 3 pendencias —
   e o comando para re-rodar (`/qa:curate $1`).
