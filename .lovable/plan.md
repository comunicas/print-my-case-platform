

## Revisão de Responsividade do Header

### Análise das Imagens

- **image-163** (desktop ~1462px): OrgSwitcher à esquerda, ícones (tema, notificações) e perfil completo (avatar + nome + email) à direita. Layout ok.
- **image-164** (mobile ~390px): Hamburger + OrgSwitcher à esquerda, ícones (tema, notificações, avatar) à direita. Funcional mas apertado.
- **image-165** (desktop largo): Logo PrintMyCase visível no header ao lado do OrgSwitcher. Atualmente o logo só aparece no sidebar, não no header.

### Problemas Identificados

1. **OrgSwitcher no mobile ocupa espaço excessivo** — largura fixa `sm:w-[200px]` com `w-full` no mobile comprime os ícones à direita
2. **Sem logo no header** — no desktop largo (image-165) há espaço para o logo, mas não é exibido. No sidebar colapsado, o logo fica pequeno demais
3. **Touch targets apertados** — gap de `1` entre ícones no mobile (`gap-1 md:gap-3`)
4. **Badge de notificação** — posicionamento ok, mas pode sobrepor em telas pequenas
5. **Perfil no mobile** — esconde nome/email corretamente, mas o avatar poderia ter tamanho consistente

### Mudanças

**`src/components/layout/AppHeader.tsx`**
- Adicionar logo PrintMyCase no header desktop (visível apenas `hidden md:block`, ao lado do OrgSwitcher)
- Aumentar gap entre ícones de ação no mobile de `gap-1` para `gap-1.5`
- Padronizar touch targets dos botões de ação para `min-w-[44px] min-h-[44px]` no mobile
- Adicionar `h-9 w-9` nos botões de ícone mobile para área de toque adequada

**`src/components/layout/OrgSwitcher.tsx`**
- Ajustar largura do SelectTrigger: `w-[160px] sm:w-[200px]` para não comprimir demais no mobile
- Esconder badge "Somente leitura" / "Compartilhada" no mobile (`hidden sm:inline-flex`)

**`src/components/layout/NotificationsPopover.tsx`**
- Padronizar tamanho do botão trigger para consistência com os demais ícones

### Resultado Esperado
- Header com logo visível em desktop, economizando espaço no mobile
- Touch targets de 44px em todos os ícones de ação
- OrgSwitcher com largura adequada por breakpoint
- Badges de acesso visíveis apenas quando há espaço (tablet+)

