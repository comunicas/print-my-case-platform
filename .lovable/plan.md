

# Fase 10: Deduplicacao do MobileSidebar usando CollapsibleNavMenu

## Problema

O `MobileSidebar.tsx` ainda contem as funcoes duplicadas `renderStockMenu` e `renderMarketingMenu` (~110 linhas combinadas, linhas 104-213). Esse e exatamente o mesmo problema que foi resolvido no `AppSidebar` na Fase 9 com o componente `CollapsibleNavMenu`.

O componente `CollapsibleNavMenu` ja suporta o caso nao-colapsado (que e o unico caso do mobile), entao a reutilizacao e direta.

## Mudancas

### Arquivo: `src/components/layout/MobileSidebar.tsx`

1. Importar `CollapsibleNavMenu` de `./CollapsibleNavMenu`
2. Remover as funcoes `renderStockMenu` e `renderMarketingMenu` (linhas 104-213, ~110 linhas)
3. Substituir por chamadas declarativas ao componente:

```text
<CollapsibleNavMenu
  icon={Package}
  label="Estoque"
  href="/estoque"
  subItems={stockSubItems}
  collapsed={false}           // mobile nunca colapsa
  isActive={isStockActive}
  expanded={stockExpanded}
  onExpandedChange={onStockExpandedChange}
  onNavigate={handleNavClick}  // usa handleNavClick que fecha o sheet
  activeItem={activeItem}
  defaultSubTab="tabela"
/>
```

4. Ajuste menor: o `handleNavClick` do mobile chama `onOpenChange(false)` apos navegar (fecha o sheet). O `CollapsibleNavMenu` recebe `onNavigate`, entao basta passar `handleNavClick` em vez de `onNavigate` direto.

5. Diferenca de estilo: o mobile usa `py-3` nos botoes vs `py-2.5` no desktop. Essa diferenca e minima e sera padronizada para `py-2.5` (consistencia visual). Se preferir manter, pode-se adicionar uma prop `size` ao `CollapsibleNavMenu`, mas nao vale a complexidade extra.

## Arquivos impactados

| Arquivo | Acao |
|---------|------|
| `src/components/layout/MobileSidebar.tsx` | Refatorar - substituir 2 funcoes duplicadas por CollapsibleNavMenu, reduzir ~80 linhas |

## Beneficios
- Elimina a ultima duplicacao de menus collapsiveis na codebase
- Garante consistencia visual e funcional entre desktop e mobile
- Qualquer mudanca futura no comportamento dos menus aplica-se automaticamente aos dois contextos
- Nenhuma mudanca funcional

