

# Corrigir Slots do Andar 1 Nao Aparecendo no Mapa de Estoque

## Problema Raiz

Os slots 1-4 (andar 1) estao armazenados no banco como `"1"`, `"2"`, `"3"`, `"4"` (sem zero a esquerda), mas o layout do grid (`GRID_LAYOUT`) espera `"01"`, `"02"`, `"03"`, `"04"`. Quando o `slotMap.get("01")` e chamado, retorna `undefined` porque a chave real e `"1"`.

Todos os outros slots (11-99) nao tem esse problema porque ja sao naturalmente 2 digitos.

## Solucao

Normalizar os numeros de slot para sempre ter 2 digitos (zero-padded) no ponto de entrada dos dados no frontend.

## Alteracoes

### 1. `src/hooks/useSlotsData.ts`
- Na transformacao dos registros (`map`), aplicar `padStart(2, '0')` ao `slot_number` antes de atribuir a `slot`
- Isso garante que `"1"` vira `"01"`, `"2"` vira `"02"`, etc.
- Slots que ja tem 2+ digitos nao sao afetados

```text
Antes:  slot: record.slot_number        → "1", "2", "3", "4"
Depois: slot: record.slot_number.padStart(2, '0') → "01", "02", "03", "04"
```

### Impacto

- Corrige a renderizacao do andar 1 no mapa de estoque
- A tabela de produtos e KPIs ja funcionam corretamente (agrupam por `product_name`, nao por `slot_number`)
- Navegacao por teclado e modal de detalhe do slot passam a funcionar para slots 01-04
- Nenhuma alteracao no banco de dados necessaria

### Por que normalizar no frontend e nao no banco

O dado ja esta persistido como `"1"`-`"4"` em registros existentes. Alterar no banco exigiria migrar dados antigos. A normalizacao no `useSlotsData` e o ponto unico de entrada para o frontend, garantindo consistencia sem risco de quebrar integracao com a API ou planilha.

