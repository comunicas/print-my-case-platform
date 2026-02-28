
# Mover API Key para HB Soluções Digitais

## O que sera feito

Atualizar o `organization_id` da API Key **n8n-hbdigital-hostinger** de **RB Digital Tech** para **HB Soluções Digitais** diretamente no banco de dados.

## Comando

```sql
UPDATE api_keys 
SET organization_id = '56bf08d1-6843-43ef-a880-776acafe8609'
WHERE id = '8b5b35d8-3355-4a5a-8f3d-c259ce8099a8';
```

## Impacto

- O sistema externo (n8n/Hostinger) continuara usando a mesma chave, sem necessidade de reconfiguracao
- As Edge Functions `ingest-revenue` e `ingest-stock` passarao a associar os dados recebidos com essa chave aos PDVs da organizacao HB Soluções Digitais
- O PDV BOULEVARD TATUAPE voltara a receber dados via API normalmente
- A organizacao RB Digital Tech ficara sem API Key (precisara criar uma nova se necessario)

## Verificacao pos-mudanca

Apos a atualizacao, um teste manual sera feito chamando a Edge Function `ingest-stock` com a chave existente para confirmar que ela agora e reconhecida como pertencente a HB.
