# Sincronização de estoque via Kexiaozhan

## Princípio
Buscar **apenas** o que `stock_records` precisa (`pdv_id, device_id, slot_number, product_name, quantity, is_active`) reaproveitando 100% do padrão de `ingest-revenue`. Slots desativados são preservados com `is_active=false` (podem ser reativados em sync futura).

## Endpoints utilizados
| Etapa | Método | Path |
|---|---|---|
| Login | POST | `/user/login` |
| Estoque | GET | `/v1/machine-channels?machineId=X&page=N&size=20` (paginar) |
| Produtos (condicional) | GET | `/v1/machine-goods-briefs?machineId=X` (1× por PDV, em cache, só se `productName` faltar) |

Dispensados: `/v1/machine-ids` e `/v1/machines` (já temos `pdvs.machine_id` e `pdvs.name`).

## Fluxo da Edge Function `sync-stock`
```text
1. Auth JWT → resolve org → bloqueia viewer
2. kxzLogin() (helper reusado de ingest-revenue)
3. Para cada pdv_id selecionado:
   3.1 Carrega pdv (machine_id) via service role + valida org
   3.2 Cria card em `uploads` (type='stock', source='api',
       file_name='api-stock-YYYY-MM-DD-HHmm')
   3.3 Pagina /v1/machine-channels?machineId={machine_id}
   3.4 Se algum canal vier sem productName → 1× /v1/machine-goods-briefs
   3.5 Mapeia para registro canônico:
        slot_number  = canal padStart(2,'0')
        product_name = nome do produto (channel ou brief)
        quantity     = stock atual do canal
        is_active    = status do canal (ativo/desativado)
        device_id    = pdv.machine_id
   3.6 Lê snapshot anterior (pdv_id+device_id) para deduzir pre_stock
   3.7 DELETE FROM stock_records WHERE pdv_id+device_id (snapshot total)
   3.8 INSERT em chunks de 500 (inclui slots inativos)
   3.9 Recalcula stock_history do dia, agregando por brand em 1 passada
   3.10 Deduz pre_stock por (qty_nova_total − qty_antiga_total) por product_name
        apenas quando aumentou
   3.11 buildStockVerification() → resumo
   3.12 Atualiza upload (records_count, sync_summary, status='ready')
4. Retorna resumo agregado
```

## Verificação pós-sync (por PDV)
- `total_slots`, `total_quantity`, `active_slots` (Gateway × Banco)
- `by_brand`: { brand → { qty, slots, Δ } }
- `missing_product_names`: canais sem produto resolvido
- `duplicates`: combinações `device+slot` repetidas no gateway
- `ok`: flag global

## Mudanças no código
1. **Nova** `supabase/functions/sync-stock/index.ts` (não toca em `ingest-stock`, que segue 503).
2. **Helpers reaproveitados** copiados de `ingest-revenue`: `serializeError`, `kxzLogin`, `kxzFetch`, sanitizers, `extractBrand`.
3. **Novo** `src/components/upload/ApiStockSyncDialog.tsx` (cópia adaptada de `ApiSyncDialog`):
   - Sem seletor de mês.
   - Checkbox de PDVs ativos com `machine_id`.
   - Bloco de verificação por PDV (Gateway × Banco, divergências em âmbar).
4. **Página Uploads**: botão "Sincronizar Estoque (API)" ao lado do botão de receita.

## Secrets
Reaproveita `KXZ_API_BASE`, `KXZ_USER`, `KXZ_PASS`. Nada novo.

## Pontos de atenção
- **Slots desativados**: persistidos com `is_active=false` — reativação futura sobrescreve para `true` automaticamente.
- **Snapshot total por device**: garante reflexo fiel da máquina; canais removidos fisicamente saem do banco.
- **Brand recalc em batch**: agrupa por brand depois do insert (evita N queries do `ingest-stock` antigo).
- **Validação de campos JSON**: nomes de campo de `/v1/machine-channels` confirmados no primeiro teste com `curl_edge_functions`; parser ajustado conforme retorno real.

## Entregáveis
- `supabase/functions/sync-stock/index.ts`
- `src/components/upload/ApiStockSyncDialog.tsx`
- Botão na página Uploads
- Deploy automático
