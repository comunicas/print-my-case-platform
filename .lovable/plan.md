

# Captura de Lead (WhatsApp) no Modal de Cupom

## Conceito de UX

O modal atual mostra o codigo do cupom e QR code imediatamente ao clicar no produto. A ideia e adicionar uma **etapa intermediaria** antes de revelar o cupom: o usuario precisa informar seu WhatsApp para "desbloquear" o desconto.

### Fluxo proposto (2 etapas no mesmo modal):

```text
+----------------------------------+         +----------------------------------+
|  Etapa 1: Captura do Lead        |         |  Etapa 2: Cupom Revelado         |
|                                  |         |                                  |
|  "Presente para voce:            |         |  "Presente para voce:            |
|   R$ 10 OFF na proxima compra!"  |         |   R$ 10 OFF na proxima compra!"  |
|                                  |         |                                  |
|  [QR Code borrado/desfocado]     |   -->   |  [QR Code nitido]                |
|                                  |         |                                  |
|  "Informe seu WhatsApp           |         |  [CUPOM2025]  [Copiar]           |
|   para liberar seu cupom"        |         |                                  |
|                                  |         |  Modelo: Galaxy S24              |
|  [(00) 00000-0000           ]    |         |                                  |
|                                  |         |  "Enviamos o cupom para           |
|  [    Liberar meu cupom     ]    |         |   seu WhatsApp tambem!"          |
|                                  |         |                                  |
|  "Nao se preocupe, nao vamos     |         +----------------------------------+
|   enviar spam"                   |
+----------------------------------+
```

### Por que esse UX funciona:

1. **QR Code borrado** cria curiosidade e urgencia visual (o usuario ve que existe algo valioso ali)
2. **Campo unico** (so WhatsApp) minimiza friccao - nao pede nome, email, etc.
3. **Mascara de telefone** ja existe no projeto (`PhoneInput`)
4. **Texto de confianca** ("nao vamos enviar spam") reduz resistencia
5. **Transicao suave** do blur para nitido com animacao ao desbloquear

---

## Implementacao Tecnica

### 1. Nova tabela `catalog_leads`

Armazena os leads capturados com contexto do PDV e produto selecionado:

- `id` (uuid, PK)
- `organization_id` (uuid, FK organizations)
- `pdv_id` (uuid, nullable, FK pdvs)
- `phone` (text, WhatsApp formatado)
- `product_name` (text, modelo que o usuario clicou)
- `catalog_slug` (text, slug do catalogo de origem)
- `created_at` (timestamptz)

RLS: INSERT para `anon` (pagina publica), SELECT para `authenticated` (admin ve os leads).

### 2. Modificar `ProductCodeModal`

Adicionar estado de 2 etapas:
- **Etapa 1**: Mostra QR com `filter: blur(8px)`, campo `PhoneInput` e botao "Liberar meu cupom"
- **Etapa 2**: Remove blur, mostra codigo e botao copiar (comportamento atual)

Ao submeter o WhatsApp:
1. Insere na tabela `catalog_leads`
2. Transiciona para etapa 2 com animacao

### 3. Props adicionais no `ProductCodeModal`

Novas props para enviar contexto:
- `organizationId: string`
- `pdvId: string | null`
- `catalogSlug: string`

### 4. Validacao

- Usar `PhoneInput` existente com mascara brasileira
- Validar minimo 10 digitos (fixo) ou 11 (celular) antes de habilitar o botao
- Usar `unformatPhoneNumber()` para salvar apenas numeros no banco

### 5. Visualizacao de leads (admin)

Nesta primeira versao, os leads ficam acessiveis apenas via banco. Uma tela de visualizacao pode ser adicionada depois como melhoria.

---

## Arquivos Modificados

| Arquivo | Mudanca |
|---------|---------|
| **Nova migration SQL** | Criar tabela `catalog_leads` com RLS |
| `src/components/public/ProductCodeModal.tsx` | Adicionar fluxo de 2 etapas com captura de WhatsApp |
| `src/pages/PublicStock.tsx` | Passar `organizationId`, `pdvId` e `catalogSlug` ao modal |

## Riscos

- **NENHUM** para funcionalidade existente - o modal so ganha uma etapa antes
- Se `catalog_code_enabled` estiver desativado, o modal nem aparece (sem impacto)
- A mascara de telefone e o componente `PhoneInput` ja existem e estao testados

