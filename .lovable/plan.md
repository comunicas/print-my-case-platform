# Logo PrintMyCase como padrão do DS

## Objetivo
Adotar o logo enviado como o logo oficial da aplicação, em formato SVG vetorial, e expor via componente padronizado no Design System.

## Etapas

### 1. Vetorizar o PNG → SVG
- Copiar `user-uploads://logo.png` para `/tmp/logo.png`
- Vetorizar com `vtracer` (color tracing) gerando `src/assets/logo-printmycase.svg`
- Otimizar paths e ajustar `viewBox` para preservar proporção (~800×440)
- Gerar também `public/logo-printmycase.svg` para uso em `<img src>` (Auth/PublicStock que estão fora do bundling React)

### 2. Componente padrão `<Logo />`
Criar `src/components/ui/Logo.tsx`:
- Props: `variant: "full" | "icon"`, `size?: number`, `className?: string`, `mono?: boolean`
- `full` → renderiza o SVG colorido (roxo + branco)
- `icon` → mantém `/icon-printmycase.png` (decisão do usuário)
- `mono` → aplica `filter: brightness(0) invert(1)` para uso em fundos escuros (sidebar roxa)
- Exportar do barrel `src/components/ui/index.ts` se existir

### 3. Substituir todas as referências
Trocar `<img src="/a33970fb-...png">` por `<Logo variant="full" />` (ou `mono`) em:
- `src/pages/Auth.tsx` (2 ocorrências — painel esquerdo e mobile)
- `src/components/layout/AppSidebar.tsx` (linha 190 — sidebar expandida)
- `src/components/layout/MobileSidebar.tsx` (linha 107)
- `src/pages/PublicStock.tsx` (linha 147 — header público)

`AppSidebar` colapsada (linha 182) e `AppHeader` (linha 62) continuam usando `/icon-printmycase.png` via `<Logo variant="icon" />`.

### 4. Favicon
- Gerar `public/favicon.png` 256×256 a partir do logo (ImageMagick — fundo transparente, padding leve)
- Apagar `public/favicon.ico` (browser usa /favicon.ico por padrão e sobrescreve)
- Atualizar `index.html`: `<link rel="icon" href="/favicon.png" type="image/png">`

### 5. Documentar no Design System (`/ds`)
Adicionar nova seção "Brand — Logo" em `src/pages/DesignSystem.tsx` (antes da nova seção "DS Novo — Tokens de Cor"):
- Preview do `<Logo variant="full" />` em fundo claro
- Preview do `<Logo variant="full" mono />` em fundo roxo (sidebar context)
- Preview do `<Logo variant="icon" />` 
- Bloco de código com import e uso
- Bloco com regras de uso: clear-space mínimo, tamanho mínimo, fundo permitido

### 6. Limpeza
- Remover `public/a33970fb-78ec-4651-a5e5-98cb6db17573.png` (PNG temporário do turno anterior)

## Detalhes técnicos
- `vtracer` instalado via `nix run nixpkgs#vtracer`
- SVG final será limpo com `svgo` se necessário para reduzir bytes
- Componente `<Logo />` aceita `aria-label` por padrão "PrintMyCase"
- Toda lógica visual existente (filtros `brightness(0) invert(1)` na sidebar) é encapsulada na prop `mono`

## Resultado
Logo oficial em SVG nativo (escalável, leve, monocromável), componente único `<Logo />` reutilizável, favicon atualizado, e documentação visual completa no `/ds`.
