# API para Atualizar Stock Records

## Objetivo

Criar uma edge function `ingest-stock` que recebe registros de estoque via API (autenticada por API key), deleta os registros antigos do PDV e insere os novos -- seguindo o mesmo padrao atomico que ja existe no `process-spreadsheet`.

## Arquitetura

A function seguira o mesmo padrao do `ingest-revenue`:

1. Autenticacao via API key (Bearer token)
2. Resolucao do PDV via `device_id` 
3. Delecao dos `stock_records` antigos do PDV, usando a chave device_id + slot_number
4. Insercao dos novos registros em batch
5. Geracao do snapshot `stock_history`

## Contrato da API

**Endpoint:** `POST /ingest-stock`  
**Auth:** `Authorization: Bearer <api_key>`

**Body (JSON):**

```json
{
  "device_id": "ABC123",
  "records": [
    {
      "slot_number": "1",
      "product_name": "APPLE iPhone 15",
      "quantity": 5,
      "is_active": true
    },
    {
      "slot_number": "2",
      "product_name": "SAMSUNG Galaxy S24",
      "quantity": 3,
      "is_active": true
    }
  ]
}
```

**Response (201):**

```json
{
  "success": true,
  "pdv_id": "uuid",
  "records_inserted": 10,
  "records_deleted": 8
}
```

## Detalhes Tecnicos

### 1. Criar `supabase/functions/ingest-stock/index.ts`

- Reutilizar helpers de sanitizacao do `ingest-revenue` (inline, pois edge functions nao compartilham codigo)
- Fluxo:
  1. Validar API key via hash lookup em `api_keys`
  2. Validar `device_id` e resolver PDV
  3. Validar array `records` (campos obrigatorios: `slot_number`, `product_name`, `quantity`)
  4. Deletar todos `stock_records` do PDV (`WHERE pdv_id = ?`)
  5. Inserir novos registros em chunks de 500
  6. Gerar snapshot `stock_history` (upsert por `pdv_id + snapshot_date + brand`)
  7. Atualizar `last_used_at` da API key

### 2. Configurar `supabase/config.toml`

```toml
[functions.ingest-stock]
verify_jwt = false
```

JWT desabilitado pois a autenticacao e feita via API key (mesmo padrao do `ingest-revenue`).

### 3. Seguranca

- Usa `SUPABASE_SERVICE_ROLE_KEY` para operacoes de banco (bypass RLS), mesmo padrao do `ingest-revenue`
- API key hashada com SHA-256 antes de lookup
- Sanitizacao de todos os campos de entrada (previne injection)
- Validacao de limites de tamanho dos campos
- Limite maximo de registros por request (ex: 1000) para evitar abuse

### 4. Logica de Substituicao Atomica

A delecao + insercao acontece no mesmo request. Diferente do `process-spreadsheet` que deleta por `upload_id`, aqui deletamos por `machine_id` diretamente, ja que nao ha upload associado (source = "api").

```text
[Request] --> [Validate API Key] --> [Resolve PDV]
    --> [DELETE stock_records WHERE machine_id = X AND slot_number = Y]
    --> [INSERT new records]
    --> [UPSERT stock_history]
    --> [Response 201]
```

### 5. Nenhuma mudanca no banco necessaria

As tabelas `stock_records`, `stock_history`, e `api_keys` ja existem com as colunas necessarias. As RLS policies existentes permitem operacoes via service role key.