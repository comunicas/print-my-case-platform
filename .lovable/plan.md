
Objetivo: corrigir de forma definitiva o desalinhamento do menu lateral colapsado e limpar código legado que está mantendo comportamento inconsistente.

Diagnóstico (com base no código atual)
1) O problema visual ainda existe no modo colapsado por um detalhe de layout:
- Em `AppSidebar.tsx`, os itens de navegação “simples” (Dashboard, Uploads, Organizações) continuam renderizando um `<span>` de label mesmo quando colapsados (`opacity-0 w-0`), mantendo também `gap-3`.
- Isso cria um deslocamento horizontal do ícone (ele não fica exatamente no centro), enquanto itens como Estoque/Marketing (quando colapsados) ficam centralizados corretamente.
- Resultado: sensação de menu “torto/desalinhado”, principalmente quando se compara ícones entre si.

2) Há legado real em preferências da sidebar:
- `useSidebarPreferences.ts` usa `sidebar_reports_expanded` para o submenu de Estoque e também para Marketing.
- Ou seja, Marketing está gravando no mesmo campo legado de “reports”, o que mistura estados e gera inconsistência.
- Além disso, o estado de Marketing não é sincronizado corretamente do backend na inicialização (só do localStorage).

3) Existe duplicação de estrutura entre `AppSidebar.tsx` e `MobileSidebar.tsx`, o que aumenta chance de drift visual/funcional.

Plano de implementação
Fase 1 — Correção visual do menu colapsado (prioridade alta)
- Ajustar `renderNavItem` em `AppSidebar.tsx` para ter renderização realmente “icon-only” quando `collapsed=true`:
  - Não renderizar `<span>` no colapsado.
  - Não usar `gap-*` no colapsado.
  - Garantir classes de alinhamento consistentes (`justify-center`, largura/altura estáveis).
- Ajustar também o botão “Recolher” no rodapé no colapsado (mesma lógica icon-only sem span oculto), para alinhar com os demais.
- Manter tooltip e acessibilidade (`aria-label`) nos botões icon-only.

Fase 2 — Limpeza de legado de preferências (prioridade alta)
- Criar migração de banco para separar estados:
  - `sidebar_stock_expanded` (boolean, default false)
  - `sidebar_marketing_expanded` (boolean, default false)
- Backfill seguro:
  - Inicializar `sidebar_stock_expanded` com valor atual de `sidebar_reports_expanded`.
  - Inicializar `sidebar_marketing_expanded` com `false` (ou valor atual de localStorage no cliente na primeira sincronização).
- Atualizar `usePreferences.ts` e `useSidebarPreferences.ts` para ler/gravar os novos campos.
- Manter fallback temporário do campo legado para compatibilidade de transição.
- Parar de usar `sidebar_reports_expanded` para Marketing.
- Não remover a coluna legada imediatamente (deprecar primeiro); remoção pode ser feita em uma migração posterior após validação em produção.

Fase 3 — Redução de dívida técnica (prioridade média)
- Extrair configuração de navegação (itens, labels, rotas, permissões) para estrutura compartilhada entre desktop e mobile.
- Reduzir duplicação de lógica de submenu (Estoque/Marketing), mantendo paridade visual e funcional.

Validação (aceite)
1) Desktop colapsado:
- Todos os ícones (Dashboard, Estoque, Uploads, Marketing, Organizações, Configurações, Recolher) na mesma linha central vertical.
- Sem variação de “offset” entre ícones de seções diferentes.
2) Dark mode:
- Conferir que a correção anterior de bordas permaneceu intacta.
3) Persistência:
- Expandido/recolhido de Estoque e Marketing funcionando de forma independente após refresh.
- Sem “efeito colateral” entre os dois menus.
4) Responsividade:
- Tablet (auto-collapse) sem desalinhamento.
- Mobile drawer sem regressão funcional.

Arquivos impactados (planejados)
- `src/components/layout/AppSidebar.tsx`
- `src/hooks/useSidebarPreferences.ts`
- `src/hooks/usePreferences.ts`
- `src/components/layout/MobileSidebar.tsx` (refino/paridade)
- `supabase/migrations/*` (nova migração para campos de preferência separados)

Riscos e mitigação
- Risco: transição de campo legado quebrar preferências existentes.
  - Mitigação: migração com backfill + fallback temporário no frontend.
- Risco: inconsistência de tipos gerados.
  - Mitigação: não editar arquivos gerados manualmente; usar fluxo normal de atualização automática após migração.

Resultado esperado
- Menu colapsado visualmente alinhado de forma consistente.
- Remoção prática do comportamento legado que mistura preferências de submenus.
- Base mais limpa para evitar regressões futuras de navegação.
