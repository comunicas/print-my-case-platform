## Objetivo
Voltar a renderizar o logo corretamente usando `<img>` direto (caminho C), aproveitando que os SVGs enviados já têm o desenho **branco sobre transparente** quando renderizados normalmente.

## Plano

### 1. Reverter `<Logo />` para `<img>` simples
`src/components/ui/Logo.tsx`:
- Remover `mask-image` / `backgroundColor` / `aspect-ratio` inline
- Voltar a usar `<img src={...} alt={...} />`
- Manter as 2 props essenciais:
  - `variant: "full" | "icon"` (default `full`)
  - `tone: "brand" | "light"` (default `brand`)
- Como o SVG é **branco nativo**:
  - `tone="light"` → renderiza o `<img>` puro (já é branco — perfeito para sidebar/auth escuro)
  - `tone="brand"` → aplica filtro CSS para colorir em roxo:
    ```
    filter: brightness(0) saturate(100%) invert(20%) sepia(96%) saturate(3461%) hue-rotate(289deg) brightness(91%) contrast(101%);
    ```
    (filtro calibrado para `#9F229A`)
- Sem prop `dark` (não usado em lugar nenhum)

### 2. Não alterar nenhum call-site
Todas as chamadas atuais já usam `tone="light"` (sidebar, auth esquerdo, mobile sidebar, public stock) ou `tone="brand"` default (auth mobile, header mobile, /ds). Continuam funcionando.

### 3. Manter favicon como está
`public/favicon.png` já foi gerado em roxo a partir do SVG via imagemagick — funciona em browser tab sem depender do CSS mask.

### 4. QA visual
Confirmar no preview:
- `/` (sidebar expandida + colapsada): logo branco nítido
- `/auth`: painel esquerdo branco, mobile roxo
- `/ds` seção "Brand — Logo": ambos previews corretos

## Trade-off aceito
Logo só pode ser **branco** (cor nativa do SVG) ou **roxo da marca** (via filtro). Se no futuro precisar de outras cores arbitrárias, será necessário voltar para a abordagem A (SVG vetorial puro) ou B (rasterizar).
