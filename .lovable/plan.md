
# Plano: API de Ingestao de Revenue com API Key

## Resumo

Criar uma Edge Function `ingest-revenue` que recebe registros individuais de venda via JSON, autenticada por API Key fixa por organizacao. Inclui tabela `api_keys` no banco, UI de gerenciamento de chaves na aba Integracoes, e ajuste na tabela `sales_records` para aceitar registros sem upload.

---

## 1. Migracao de Banco de Dados

### Nova tabela: `api_keys`

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| id | uuid | PK |
| organization_id | uuid | FK para organizations |
| key_hash | text | Hash SHA-256 da chave |
| key_prefix | text | Primeiros 8 chars (para exibicao) |
| name | text | Nome descritivo |
| is_active | boolean | Default true |
| last_used_at | timestamptz | Ultimo uso |
| created_by | uuid | Usuario que criou |
| created_at | timestamptz | Default now() |

RLS: Admins podem SELECT/INSERT/UPDATE/DELETE dentro da sua organizacao.

### Alterar `sales_records`

- Tornar `upload_id` **nullable** (para registros via API que nao tem upload associado)
- Adicionar coluna `source` (text, default `'spreadsheet'`) para diferenciar origem dos dados

---

## 2. Nova Edge Function: `ingest-revenue`

**Arquivo:** `supabase/functions/ingest-revenue/index.ts`
**Config:** `verify_jwt = false` (autenticacao por API Key propria)

### Fluxo

```text
POST /ingest-revenue
  |
  +-> Extrair API Key do header Authorization: Bearer <key>
  +-> Calcular SHA-256 do key
  +-> Buscar na api_keys pelo hash (is_active = true)
  +-> Obter organization_id
  +-> Resolver pdv_id a partir de device_id + organization_id
  +-> Validar campos obrigatorios
  +-> Sanitizar valores (reusar funcoes do process-spreadsheet)
  +-> Inserir em sales_records com upload_id = null, source = 'api'
  +-> Atualizar last_used_at da API key
  +-> Retornar 201 com record_id
```

### Body esperado

```json
{
  "device_id": "ABC123",
  "order_number": "ORD-001",
  "product_name": "APPLE iPhone 15 Pro Max",
  "payment_date": "2025-01-15T14:30:00",
  "amount": 69.90,
  "payment_method": "PIX",
  "status": "Aprovado",
  "refund_amount": 0,
  "transaction_number": "TXN-123",
  "merchant_id": "MERCHANT-01"
}
```

**Campos obrigatorios:** `device_id`, `order_number`, `product_name`, `payment_date`, `amount`

### Respostas

| Status | Descricao |
|--------|-----------|
| 201 | Registro inserido com sucesso |
| 400 | Campos obrigatorios faltando |
| 401 | API key ausente ou invalida |
| 404 | PDV nao encontrado para device_id |
| 500 | Erro interno |

### Seguranca

- Chaves armazenadas apenas como hash SHA-256 (nunca em texto)
- Edge Function usa service role key para inserir (bypass RLS) somente apos validar API key
- Reutiliza funcoes de sanitizacao do `process-spreadsheet` (sanitizeString, parseAmount, parsePaymentDate, etc.) copiadas inline

---

## 3. UI de Gerenciamento de API Keys

### Novo hook: `src/hooks/useApiKeys.ts`

- Listar API keys da organizacao (SELECT)
- Criar nova key (gera 32 bytes aleatorios, salva hash, retorna key completa uma unica vez)
- Desativar/excluir key

### Atualizar: `src/components/settings/IntegrationsSettings.tsx`

- Substituir o card "API" com badge "Em breve" por uma secao funcional:
  - Lista de keys existentes (mostrando `key_prefix...`, nome, ultimo uso)
  - Botao "Gerar Nova API Key" com dialog para nome
  - Modal mostrando a key completa uma unica vez apos criacao
  - Botao de revogar/excluir key
  - Documentacao inline do endpoint e formato do body

---

## 4. Arquivos a Criar/Modificar

| Arquivo | Acao |
|---------|------|
| Migracao SQL | Criar tabela `api_keys`, alterar `sales_records` |
| `supabase/functions/ingest-revenue/index.ts` | Nova edge function |
| `supabase/config.toml` | Adicionar `[functions.ingest-revenue]` com `verify_jwt = false` |
| `src/hooks/useApiKeys.ts` | Novo hook CRUD |
| `src/components/settings/IntegrationsSettings.tsx` | UI funcional de API keys |

---

## Detalhes Tecnicos

### Geracao de API Key (no hook, client-side)

1. Gerar 32 bytes com `crypto.getRandomValues(new Uint8Array(32))`
2. Codificar em hex
3. Calcular SHA-256 via `crypto.subtle.digest`
4. Salvar `key_hash` e `key_prefix` (primeiros 8 chars) no banco
5. Exibir chave completa ao usuario uma unica vez

### Edge Function - Validacao de API Key

1. Extrair token do header `Authorization: Bearer <token>`
2. Calcular SHA-256 com `crypto.subtle.digest`
3. Buscar em `api_keys` onde `key_hash = hash AND is_active = true`
4. Obter `organization_id` associada
5. Buscar PDV em `pdvs` onde `machine_id = device_id AND organization_id = org_id`

### Compatibilidade

- Registros existentes via planilha continuam funcionando normalmente (upload_id preenchido, source = 'spreadsheet')
- Dashboard e graficos ja consomem `sales_records` sem filtrar por source, entao dados da API aparecem automaticamente
