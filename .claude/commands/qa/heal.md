---
description: Roda os testes de um alvo e conserta ate verde (Loop de QA)
argument-hint: <slug>
allowed-tools: Bash(npx playwright test:*), Bash(npm run explore:*), Read, Glob, Grep, Task
---

# Healing dos testes do alvo $1

Siga o Loop de QA do CLAUDE.md: rodar → investigar a causa real → corrigir → re-rodar.

1. Determine TESTDIR: `tests/$1` (projeto `chromium`) ou `tests/public/$1` (projeto
   `public`) — use Glob para ver qual existe. Se nenhum existir, oriente a rodar
   `/qa:generate $1` primeiro e pare.
2. Rode `npx playwright test TESTDIR --project=<p> --reporter=list`.
3. **Tudo verde?** Reporte e encerre, sugerindo `/qa:curate $1`.
4. **Ha falhas?** Invoque a Task `subagent_type: playwright-test-healer` com:
   - a lista dos testes falhos (`arquivo:linha` + mensagem de erro resumida);
   - ESCOPO restrito: instrua a filtrar `test_run`/`test_debug` para TESTDIR apenas
     (nao tocar em testes de outros alvos);
   - ground truth para consulta via Read: `specs/$1/plan.md` (intencao do teste),
     `specs/$1/exploration.json` (inventario) e `specs/$1/aria.yaml` (locators reais);
   - regras do CLAUDE.md: investigar a causa real (snapshot/trace), NUNCA inventar
     locator, `test.fixme()` apenas em ultimo caso com comentario explicando o que foi
     observado em vez do esperado.
5. Quando o healer terminar, re-rode o passo 2 para confirmar de forma independente.
   Repita 4–5 ate ficar verde ou restarem apenas fixmes justificados.
6. Se a pagina parecer ter mudado em relacao ao inventario (muitos locators
   desatualizados), rode `npm run explore -- <url do plano>` e repasse o novo
   inventario ao healer — ou recomende re-rodar `/qa:plan`.

## Relatorio final

7. Reporte: o que foi corrigido em cada teste (e o porque), fixmes restantes com a
   justificativa, e se `specs/$1/plan.md` ficou desatualizado em relacao ao app
   (sugerindo a edicao correspondente no plano).
