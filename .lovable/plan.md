

## Header Responsivo Completo — Revisão Final

### Problemas Atuais

1. **Logo placeholder**: Usa `/placeholder.svg` (quadrado cinza) em vez de `/icon-printmycase.png`
2. **OrgSwitcher no mobile**: Largura `w-[160px]` ainda pode comprimir — nomes longos de organização são cortados sem `truncate` no texto do SelectItem
3. **SelectContent no mobile**: O dropdown da lista de organizações não tem largura máxima controlada — nomes longos podem estourar a tela
4. **Texto do perfil sem proteção**: `max-w-[100px]` no nome pode cortar em tablets; email sem truncate pode estourar
5. **Fontes não responsivas**: Nome da organização (single org) usa `text-sm md:text-base` mas o OrgSwitcher usa `text-sm` fixo do Select — inconsistência
6. **Dropdown do perfil**: Largura fixa `w-48` pode ser estreito para emails longos

### Mudanças

**`src/components/layout/AppHeader.tsx`**
- Trocar `/placeholder.svg` por `/icon-printmycase.png` — logo real da marca
- Nome do perfil: ajustar `max-w-[100px]` para `max-w-[120px] lg:max-w-[180px]` com `truncate` 
- Email do perfil: adicionar `truncate max-w-[120px] lg:max-w-[180px]`
- Botão do perfil mobile: padronizar touch target `min-w-[44px] min-h-[44px]`
- Dropdown do perfil: `w-48` → `w-56` para acomodar textos

**`src/components/layout/OrgSwitcher.tsx`**
- SelectTrigger: adicionar `text-sm` explícito e `truncate` via `[&>span]:truncate`
- SelectContent: adicionar `max-w-[280px] sm:max-w-none` para não estourar no mobile
- SelectItem: envolver nome da org em `<span className="truncate">` para nomes longos
- Texto "Leitura" no item: `text-[10px]` → `text-xs` para legibilidade

**`src/components/layout/NotificationsPopover.tsx`**
- PopoverContent: ajustar `w-80 md:w-96` → `w-[calc(100vw-24px)] sm:w-80 md:w-96` para não estourar no mobile estreito (320px)

### Resultado
- Logo real visível no desktop
- Todos os textos com truncate e max-width por breakpoint — zero overflow
- Select dropdown não estoura a tela em 320px-390px
- Touch targets de 44px consistentes em todos os botões
- Tipografia consistente entre OrgSwitcher e org single

