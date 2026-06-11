---
description: Pipeline completo de QA para um URL (explore → plan → generate → heal → curate)
argument-hint: <url> [--public]
allowed-tools: SlashCommand, Read, Glob
---

# Pipeline QA end-to-end para: $ARGUMENTS

Execute as quatro fases EM ORDEM via SlashCommand. Pare e reporte se uma fase falhar
de forma irrecuperavel; testes com `fixme` no heal NAO bloqueiam a curadoria.

1. `/qa:plan $ARGUMENTS` — anote o **slug** reportado ao final.
2. `/qa:generate <slug> all`
3. `/qa:heal <slug>`
4. `/qa:curate <slug>`

(Se a tool SlashCommand nao estiver disponivel, leia cada
`.claude/commands/qa/<fase>.md` e execute os passos descritos nele diretamente.)

## Relatorio final

- Arvore dos artefatos criados/atualizados: `specs/<slug>/{exploration.json, aria.yaml,
  plan.md, curation.md}` e `TESTDIR/{seed.spec.ts, *.spec.ts}`.
- Resultado dos testes (verdes / fixmes justificados).
- Resumo da curadoria (cobertura, violacoes, pendencias).
- Comandos para re-execucao parcial: `/qa:generate <slug> <cenario>`, `/qa:heal <slug>`,
  `/qa:curate <slug>`.
