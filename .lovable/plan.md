# Correção da rolagem horizontal no mobile (Home)

## Diagnóstico

Inspecionei o DOM no preview mobile e encontrei elementos que excedem a largura do viewport (390px), forçando a rolagem horizontal do `<main>`. As causas, em ordem de impacto:

### 1. Header (`AppHeader.tsx`) — causa principal
Soma das larguras mínimas em 390px:
- Esquerda: `px-3` (12) + hamburger `min-w-[44px]` + gap + logo 32px + gap + `OrgSwitcher` `w-[160px]` ≈ **252px**
- Direita: tema `min-w-[44px]` + gap + notificações `min-w-[44px]` + gap + avatar `min-w-[44px]` ≈ **144px**
- Total ≈ **420px > 390px** → estoura o viewport.

Os botões usam `min-w-[44px] min-h-[44px]` (touch target). Esses `min-w` impedem que o flexbox encolha e empurram o conteúdo para fora.

### 2. `OrgSwitcher` com `w-[160px]`
A largura fixa não encolhe quando o espaço aperta.

### 3. `<main>` em `AppLayout.tsx`
Usa `overflow-auto`, que permite tanto scroll vertical quanto horizontal. Sem `overflow-x-hidden` qualquer overflow pontual de filho vira barra horizontal de página.

### 4. Linha "período" em `DateRangeFilter.tsx` (secundário)
`<div className="flex items-center gap-2 ...">` com data + "(N dias)" + botão reset não tem `flex-wrap`, podendo estourar em períodos com texto longo (ex.: anos diferentes).

## Mudanças propostas

**`src/components/layout/AppLayout.tsx`**
- Trocar `overflow-auto` do `<main>` por `overflow-y-auto overflow-x-hidden` para nunca permitir scroll horizontal de página (defesa em profundidade).

**`src/components/layout/AppHeader.tsx`**
- Remover `min-w-[44px]` dos botões (manter `h-9 w-9` que já dá ~36px clicável; ou usar `min-w-9` em vez de 44 para não estourar). Manter `min-h-[44px]` apenas no hamburger se necessário; nos demais aplicar `h-9 w-9` puro no mobile e elevar para 44 só em `md:`.
- Adicionar `min-w-0 flex-1` no contêiner esquerdo (`<div className="flex items-center gap-2 ... min-w-0">`) para permitir que o `OrgSwitcher` encolha.
- Adicionar `flex-shrink-0` no contêiner direito.
- Reduzir `gap-1.5` para `gap-1` em mobile entre os botões da direita.

**`src/components/layout/OrgSwitcher.tsx`**
- Trocar `w-[160px]` por `max-w-[160px] w-full min-w-0` (ou `flex-1`) para permitir encolher.

**`src/components/dashboard/DateRangeFilter.tsx`** (correção pequena)
- Adicionar `flex-wrap` na linha "Período Info" para evitar estouro quando texto for longo: `flex flex-wrap items-center gap-2`.

## Verificação

1. Abrir preview em 375px e 390px.
2. Confirmar ausência de barra horizontal no `<main>`.
3. Validar que: hamburger continua clicável (≥36px), `OrgSwitcher` encolhe sem cortar conteúdo importante, ícones de tema/notificações/avatar permanecem acessíveis.
4. Inspecionar via DevTools: nenhum elemento com `right > document.documentElement.clientWidth`.

## Fora do escopo

- Não alterar lógica de negócio nem queries.
- Não mudar layout desktop/tablet (mudanças usam variantes `md:`).
