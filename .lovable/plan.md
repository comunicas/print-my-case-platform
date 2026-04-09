

## Revisão Completa: Legados, Erros e Documentação

### Problemas Encontrados

1. **CI workflow corrompido** — `.github/workflows/ci.yml` tem marcadores de merge conflict (`codex/create-technical-backlog-with-eslint-rules`, `main`) e YAML inválido (job `lint` sem steps completos, job `lint-legacy` com `continue-on-error` que o backlog diz para remover)

2. **Linha em branco espúria** — `MobileSidebar.tsx` linha 131: linha vazia entre `<CollapsibleNavMenu` e `icon={Megaphone}`

3. **`bottomNavItems` desnecessário** — Array constante com 1 item condicional (`Organizações`). Pode ser inline direto no JSX

4. **`.lovable/plan.md` desatualizado** — Contém o plano antigo "Remover Configurações Duplicado" já implementado

5. **`docs/eslint-technical-backlog.md`** — Épico 4 diz "repositório ainda não possui `.github/workflows/ci.yml`" mas o arquivo existe

6. **`docs/operations/feature-status.md`** — Data "2026-04-07", não reflete mudanças recentes (busca unificada, header responsivo, remoção de Configurações do sidebar)

### Mudanças

**`.github/workflows/ci.yml`** — Reescrever YAML limpo:
- Job `lint-changed` (blocking): checkout com depth 0, setup node, install, `npm run lint:changed`
- Job `lint` (blocking): checkout, setup node, install, `npm run lint`
- Remover `lint-legacy` e `continue-on-error`
- Remover marcadores de merge conflict

**`src/components/layout/MobileSidebar.tsx`**
- Remover linha em branco 131
- Eliminar array `bottomNavItems` — inline o item `Organizações` direto no JSX condicional `{isSuperAdmin && (...)}`

**`.lovable/plan.md`**
- Limpar conteúdo — arquivo vazio ou com nota "Sem planos pendentes"

**`docs/eslint-technical-backlog.md`**
- Épico 4: atualizar observação — CI existe, precisa apenas promover lint para blocking (o que será feito nesta mesma mudança)

**`docs/operations/feature-status.md`**
- Atualizar data para 2026-04-09
- Adicionar linhas: Busca unificada com autocomplete (Ativa), Header responsivo (Ativa), Configurações centralizado no header (Ativa)

### Resultado
- CI funcional e blocking
- Zero código legado ou linhas espúrias nos componentes de layout
- Documentação refletindo o estado real do projeto

