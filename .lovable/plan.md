## Diagnóstico

O logo aparece **100% branco** porque o componente `<Logo />` aplica `filter: brightness(0) invert(1)` (prop `mono`) em todos os lugares com fundo escuro (sidebar, auth, mobile). Isso "queima" o SVG inteiro em branco — funcionava como workaround pq o SVG vetorizado pelo `vtracer` tinha o roxo `#9F229A` + branco misturados, e em fundo roxo o roxo desaparecia.

Você enviou agora os **SVGs oficiais** (`logo-printmycase.svg` e `icon_printmycase.svg`) — neles o desenho **já é branco sobre transparente**, então não precisa de filtro nenhum em fundo escuro, e em fundo claro precisa ser renderizado em roxo.

## Plano

### 1. Substituir os arquivos SVG pelos oficiais
- `code--copy user-uploads://logo-printmycase.svg` → `src/assets/logo-printmycase.svg` (overwrite)
- `code--copy user-uploads://logo-printmycase.svg` → `public/logo-printmycase.svg` (overwrite)
- `code--copy user-uploads://icon_printmycase.svg` → `src/assets/icon-printmycase.svg` (novo)
- `code--copy user-uploads://icon_printmycase.svg` → `public/icon-printmycase.svg` (novo)
- Remover `public/icon-printmycase.png` legacy

### 2. Refatorar `<Logo />` (`src/components/ui/Logo.tsx`)
Os SVGs oficiais são **brancos sobre transparente**. Nova lógica:

- `variant="full" | "icon"` continua existindo
- Nova prop `tone: "brand" | "light" | "dark"` (default `"brand"`):
  - `brand` → roxo `#9F229A` (aplicado via `filter` CSS — `invert(...) sepia(...) hue-rotate(...)` calibrado, OU mais simples: usar `<img>` + `mask-image` com `bg-[hsl(var(--primary))]` para colorir)
  - `light` → branco puro (sem filtro — SVG já é branco)
  - `dark` → preto (filtro `brightness(0)`)
- Remover prop `mono` (substituída por `tone`)

Implementação preferida — usar **CSS mask** para colorização limpa:
```tsx
<span
  role="img"
  aria-label={alt}
  className={cn("inline-block", className)}
  style={{
    backgroundColor: tone === "brand" ? "hsl(var(--primary))" 
                    : tone === "dark" ? "#000" 
                    : "#fff",
    WebkitMaskImage: `url(${src})`,
    maskImage: `url(${src})`,
    WebkitMaskRepeat: "no-repeat",
    maskRepeat: "no-repeat",
    WebkitMaskSize: "contain",
    maskSize: "contain",
    WebkitMaskPosition: "center",
    maskPosition: "center",
  }}
/>
```
Isso resolve definitivamente — qualquer cor com 1 linha.

### 3. Atualizar todas as call-sites
- `Auth.tsx` painel esquerdo (fundo roxo escuro) → `<Logo tone="light" />`
- `Auth.tsx` mobile (fundo branco) → `<Logo tone="brand" />`
- `AppSidebar.tsx` colapsada (fundo roxo) → `<Logo variant="icon" tone="light" />`
- `AppSidebar.tsx` expandida (fundo roxo) → `<Logo variant="full" tone="light" />`
- `MobileSidebar.tsx` (fundo roxo) → `<Logo tone="light" />`
- `AppHeader.tsx` mobile (fundo claro) → `<Logo variant="icon" tone="brand" />`
- `PublicStock.tsx` header (gradiente roxo) → `<Logo tone="light" />`

### 4. Favicon
Regerar `public/favicon.png` 256×256 a partir do **icon SVG oficial** (cor roxa `#9F229A` sobre transparente) usando `imagemagick` com `-background none` + recolor.

### 5. Atualizar Design System (`/ds`)
Na seção "Brand — Logo" trocar os 3 previews para refletir as 3 tones × 2 variants:
- `<Logo variant="full" tone="brand" />` em fundo claro
- `<Logo variant="full" tone="light" />` em fundo roxo
- `<Logo variant="icon" tone="brand" />` em fundo claro
- `<Logo variant="icon" tone="light" />` em fundo roxo

Atualizar bloco de código + regras de uso (incluir `tone`).

### 6. QA visual
Após mudanças, abrir `/auth`, `/`, `/ds` no preview e confirmar que:
- Sidebar mostra o logo branco legível (não 100% branco-borrado)
- Auth direito mostra logo roxo nítido
- DS mostra todas as 4 combinações renderizando corretamente
