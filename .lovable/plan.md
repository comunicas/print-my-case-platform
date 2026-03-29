

## Validação de device_id vs machine_id do PDV na Edge Function

### Ideia

Cada PDV tem um `machine_id` fixo (ex: `1001013` para Boulevard). As planilhas de vendas contêm um campo `device_id` (ID do Dispositivo) em cada linha. Se o `device_id` da planilha **não bater** com o `machine_id` do PDV selecionado, o upload deve ser **rejeitado** antes de inserir qualquer registro — prevenindo 100% das duplicatas cross-PDV na origem.

### Alteração

**`supabase/functions/process-spreadsheet/index.ts`** — Adicionar validação pós-parse, antes da inserção:

1. Após parsear as linhas da planilha, extrair todos os `device_id` únicos encontrados
2. Buscar o `machine_id` do PDV selecionado na tabela `pdvs`
3. Comparar:
   - Se **todos** os `device_id` da planilha batem com o `machine_id` do PDV → prosseguir normalmente
   - Se **nenhum** bate → rejeitar o upload com erro claro: _"O ID do dispositivo na planilha (X) não corresponde ao PDV selecionado (Y). Selecione o PDV correto."_
   - Se **alguns** batem e outros não → filtrar apenas os registros com device_id correto, logar warning sobre os descartados

4. Posição no fluxo: após a etapa de parse XLSX (linha ~596) e antes da deduplicação (linha ~702)

### Resultado

- Upload da planilha do Boulevard selecionando Tietê → **erro imediato**, nenhum registro inserido
- Upload da planilha do Boulevard selecionando Boulevard → funciona normalmente
- A deduplicação cross-PDV existente continua como segunda camada de proteção

