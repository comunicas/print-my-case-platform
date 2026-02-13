

# Code Review - Plano Revisado com Analise de Risco

## Analise de Seguranca por Etapa

### Etapa 1: Remover campos legados da interface Organization - SEGURO

**Risco avaliado: NENHUM**

A pagina publica (`PublicStock.tsx`) usa `organization.catalog_code_enabled`, `catalog_code`, etc. mas esses dados vem da interface `PublicOrganization` definida em `usePublicStock.ts`, que e completamente separada. A interface `Organization` de `useOrganization.ts` nao e usada em nenhum lugar para acessar esses campos de catalogo.

Verificacao feita: busquei `organization.catalog_code` em todo o `src/` e so encontrei em `PublicStock.tsx`, que importa de `usePublicStock`, nao de `useOrganization`.

**Acao**: Remover os 7 campos de catalogo da interface `Organization` em `useOrganization.ts`. A query `.select("*")` continua trazendo os dados do banco, apenas nao serao mais tipados no frontend (o que e correto, pois nao sao usados).

---

### Etapa 2: Consolidar organizationFormSchema - SEGURO

**Risco avaliado: NENHUM**

Existem 2 schemas identicos:
- `src/lib/schemas/settings.ts` - usado em `OrganizationSettings.tsx`
- `src/lib/schemas/organization.ts` - usado em `Organizations.tsx` (super admin)

Ambos validam os mesmos campos (name, email, phone, address). A diferenca e que `organization.ts` aceita `nullable()` em mais campos, o que e mais correto. Vamos manter `organization.ts` e fazer `OrganizationSettings.tsx` importar dele.

**Acao**: Remover `organizationFormSchema` e `OrganizationFormData` de `settings.ts`. Atualizar import em `OrganizationSettings.tsx`.

**Atencao**: O schema de `organization.ts` tem `email` como `.optional().nullable().or(z.literal(""))`, enquanto `settings.ts` tem `email` como `.email("Email invalido")`. Precisamos ajustar para que o schema unificado valide email corretamente no contexto de settings (email obrigatorio). Solucao: manter a validacao de email no schema unificado como obrigatoria (o campo e obrigatorio para orgs com admin).

---

### Etapa 3: Remover `: any` em useDashboard.ts - SEGURO

**Risco avaliado: NENHUM**

Apenas troca `: any` por tipos concretos que ja existem (`SaleRecord`, `CancellationRecord`). Os campos mapeados sao exatamente os mesmos. Zero impacto funcional.

---

### Etapa 4: Remover console.error do NotFound.tsx - SEGURO

**Risco avaliado: NENHUM**

Remove apenas um `console.error` no useEffect da pagina 404. Nenhum impacto funcional.

---

### Etapa 5: Centralizar CUSTOM_DOMAIN - SEGURO

**Risco avaliado: BAIXO**

Move a string `https://printmycase.comunicas.com.br` para `src/lib/constants.ts`. Os 3 locais que usam passam a importar de la. Risco unico: erro de digitacao na constante, mas vou copiar exatamente o valor existente.

---

### Etapa 6: Prefetch Marketing no Sidebar - SEGURO

**Risco avaliado: NENHUM**

Adiciona `onMouseEnter` nos botoes de Marketing no sidebar. Se falhar, o pior que acontece e nao fazer prefetch (comportamento atual).

---

### Etapa 7 e 8: Apenas documentacao - SEM ALTERACAO DE CODIGO

---

### Etapa 9: Remover imports nao utilizados - SEGURO

**Risco avaliado: NENHUM**

Remove apenas imports que nao sao referenciados. O build ja alertaria sobre isso.

---

## Ordem de Execucao (mais seguro primeiro)

1. **Etapa 4** - Remover console.error do NotFound (trivial)
2. **Etapa 9** - Limpar imports nao utilizados (trivial)
3. **Etapa 3** - Tipar `any` em useDashboard (tipagem apenas)
4. **Etapa 5** - Centralizar CUSTOM_DOMAIN (refactor simples)
5. **Etapa 6** - Prefetch Marketing (aditivio, sem quebra)
6. **Etapa 1** - Limpar interface Organization (seguro, verificado)
7. **Etapa 2** - Consolidar schema (requer cuidado no email)

## Detalhes Tecnicos

### Etapa 2 - Cuidado com validacao de email

O schema em `settings.ts` exige email valido:
```text
email: z.string().email("Email invalido")
```

O schema em `organization.ts` permite vazio:
```text
email: z.string().email("Email invalido").optional().nullable().or(z.literal(""))
```

Para unificar, o schema em `organization.ts` sera ajustado para ter uma versao que valida email como obrigatorio (para uso em OrganizationSettings) e outra mais permissiva (para uso em Organizations.tsx do super admin). Alternativa mais simples: manter o schema de `organization.ts` como esta e adicionar `.refine()` no componente que precisa de email obrigatorio.

### Arquivos modificados por etapa

| Etapa | Arquivo | Tipo de mudanca |
|-------|---------|----------------|
| 1 | `src/hooks/useOrganization.ts` | Remover 7 linhas da interface |
| 2 | `src/lib/schemas/settings.ts` | Remover schema duplicado |
| 2 | `src/components/settings/OrganizationSettings.tsx` | Atualizar import |
| 3 | `src/hooks/useDashboard.ts` | Trocar `any` por tipo correto |
| 4 | `src/pages/NotFound.tsx` | Remover useEffect |
| 5 | `src/lib/constants.ts` | Adicionar CUSTOM_DOMAIN |
| 5 | `src/components/settings/PDVCatalogList.tsx` | Importar constante |
| 5 | `src/hooks/usePDVCatalogSettings.ts` | Importar constante |
| 6 | `src/components/layout/AppSidebar.tsx` | Adicionar onMouseEnter |
| 9 | `src/pages/Settings.tsx` | Remover import nao usado |

Nenhuma mudanca afeta funcionalidade existente. Todas sao refatoracoes de tipagem, limpeza e organizacao.
