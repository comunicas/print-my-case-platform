

## Implementar Facebook Pixel para rastreamento do catálogo público

### Contexto
O pixel do Facebook (ID: `772617998947470`) será usado para rastrear visitantes que acessam o catálogo público e resgatam QR codes, permitindo otimizar as campanhas de publicidade.

### Mudanças

**1. `index.html` — Script base do pixel**
- Adicionar o script padrão do Facebook Pixel no `<head>`
- Adicionar o `<noscript><img>` fallback no `<body>` (não pode ficar no `<head>` por restrição HTML5)
- O `PageView` padrão será disparado em todas as páginas

**2. `src/pages/PublicStock.tsx` — Eventos customizados**
- Disparar `fbq('track', 'ViewContent')` quando o usuário abre o catálogo público
- Disparar `fbq('track', 'Lead')` quando o usuário resgata o cupom (modal de código revelado)

**3. `src/components/public/ProductCodeModal.tsx` — Evento de conversão**
- Disparar `fbq('track', 'CompleteRegistration')` quando o OTP é verificado e o cupom é liberado (step = "revealed")
- Isso permite rastrear a conversão completa do funil: visualização → resgate

### Eventos rastreados
- **PageView** — automático em todas as páginas
- **ViewContent** — ao abrir catálogo público (`/catalogo/:slug`)
- **Lead** — ao iniciar processo de resgate (abrir modal do código)
- **CompleteRegistration** — ao verificar telefone e liberar o cupom

### Arquivos afetados
- `index.html` — script do pixel + noscript fallback
- `src/pages/PublicStock.tsx` — evento ViewContent
- `src/components/public/ProductCodeModal.tsx` — eventos Lead e CompleteRegistration

