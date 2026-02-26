

# Correção: Sidebar Desalinhada e Bordas Visíveis no Dark Mode

## Problemas Identificados

### 1. Sidebar desalinhada (modo colapsado)
Na imagem enviada, os ícones da sidebar colapsada aparecem desalinhados verticalmente. O problema está no logo section do `AppSidebar.tsx`: quando colapsada, o logo usa posicionamento `absolute` que pode causar deslocamento visual. Adicionalmente, o padding e espaçamento dos itens de navegação podem estar inconsistentes entre o estado expandido e colapsado.

### 2. Bordas brancas nos blocos (dark mode)
O componente `Card` (usado em KPIs, gráficos, Análise de Perdas, etc.) aplica `border` por padrão via classe `rounded-lg border bg-card`. No CSS global (`index.css`), existe a regra `* { @apply border-border }` que define a cor de todas as bordas. No dark mode, a variável `--border` está definida como `270 15% 20%` (lightness 20%), que contra o background `270 20% 8%` (lightness 8%) cria contraste visível, gerando essas "bordas brancas".

## Solução

### Arquivo: `src/index.css`
- Ajustar `--border` no dark mode para um valor com menor lightness (ex: `270 15% 15%`), tornando as bordas mais sutis e menos visíveis
- Ajustar `--sidebar-border` da mesma forma para consistência

### Arquivo: `src/components/layout/AppSidebar.tsx`
- Corrigir o alinhamento do logo section quando colapsada, removendo `absolute` e simplificando a lógica de exibição condicional
- Garantir que o `px` (padding horizontal) do container do logo seja consistente com os itens de navegação (`px-2` quando colapsado)
- Alinhar verticalmente o ícone do logo com os ícones de navegação

## Detalhes Tecnico

### Mudanca 1: Dark mode borders (`src/index.css`)
```css
/* Antes */
--border: 270 15% 20%;
--input: 270 15% 20%;
--sidebar-border: 270 15% 18%;

/* Depois */
--border: 270 15% 14%;
--input: 270 15% 14%;
--sidebar-border: 270 15% 13%;
```

### Mudanca 2: Logo alignment (`AppSidebar.tsx`, linhas 302-319)
Simplificar a section do logo para renderizar condicionalmente apenas um dos dois logos (ícone vs. logo completo), sem usar `absolute`, e centralizando corretamente com `justify-center`.

```tsx
<div className="h-16 flex items-center justify-center border-b border-sidebar-border px-2">
  {collapsed ? (
    <img src="/icon-printmycase.png" alt="Print My Case" className="h-8 w-8 object-contain" />
  ) : (
    <img src="/logo-printmycase.png" alt="Print My Case" className="h-10 object-contain" />
  )}
</div>
```

Isso remove a animacao de transicao entre logos mas garante alinhamento correto. Se a transicao for importante, podemos manter mas com posicoes relativas em vez de absolutas.

