

# Corrigir Calendario de Periodo + Novos Presets

## Problema 1: Calendario fecha ao primeiro clique
Quando o popover abre, `calendarSelected` tem `from` e `to` preenchidos (o periodo atual). O react-day-picker v8 interpreta cliques sobre um range existente de formas inesperadas: pode enviar `{from: X, to: X}` (mesmo dia) no primeiro clique, e o codigo atual trata isso como selecao completa e fecha o popover.

## Problema 2: Presets incorretos
- **Atual**: Hoje, 7d, 30d, 90d, Este mes, Mes passado
- **Desejado**: Hoje, Ontem, Este mes, Mes anterior, Total

## Solucao

### Correcao do calendario (`DateRangeFilter.tsx`)

1. **Logica de selecao em dois cliques**: Mudar `handleCalendarSelect` para:
   - Primeiro clique: SEMPRE setar `pendingFrom` e aguardar segundo clique. Ignorar o `to` que o react-day-picker envia.
   - Segundo clique (quando `pendingFrom` ja existe): calcular from/to com `min/max` entre `pendingFrom` e o dia clicado, aplicar e fechar.
   - Trocar `Calendar mode="range"` para usar `onDayClick` manual em vez de `onSelect`, garantindo controle total sobre a logica de dois cliques.

2. **Visual de selecao pendente**: Enquanto o usuario clicou apenas a primeira data, destacar o dia selecionado no calendario usando `modifiers` + estilos customizados, e mostrar o range parcial nos inputs.

3. **Manter inputs manuais**: Os campos DD/MM/AAAA continuam funcionando, com a mesma logica de mascara e validacao.

### Novos presets

Substituir os 6 presets atuais por 5 novos:

| Antes          | Depois         |
|----------------|----------------|
| Hoje           | Hoje           |
| 7d             | Ontem          |
| 30d            | Este mes       |
| 90d            | Mes anterior   |
| Este mes       | Total          |
| Mes passado    | *(removido)*   |

O preset **Total** usa a prop `dataRange` (min/max dos dados) para mostrar todo o periodo disponivel. Se `dataRange` nao estiver disponivel, o botao fica desabilitado.

### Mudancas tecnicas detalhadas

**`src/components/dashboard/DateRangeFilter.tsx`**:

1. Substituir array `PRESETS` pelos novos 4 presets fixos (Hoje, Ontem, Este mes, Mes anterior) + botao Total separado (depende de `dataRange` prop)

2. Reescrever `handleCalendarSelect` / trocar para `onDayClick`:
   - Sem `pendingFrom`: setar `pendingFrom = day`, atualizar `fromInput`
   - Com `pendingFrom`: calcular `from = min(pendingFrom, day)`, `to = max(pendingFrom, day)`, aplicar `onDateRangeChange`, limpar `pendingFrom`, fechar popover

3. Ajustar `calendarSelected` para usar `modifiers` quando em modo de selecao pendente (destacar dia selecionado sem renderizar range)

4. Remover o botao "Ver tudo" da area de info (ja estara como preset "Total")

5. Manter: inputs manuais, navegacao mes/ano, hint "Selecione a data final", display de periodo com dias

**`src/lib/utils/date-presets.ts`**: Atualizar `datePresets` array para refletir os novos presets (usado em outras partes da aplicacao se referenciado)

### Arquivos alterados
| Arquivo | Acao |
|---------|------|
| `src/components/dashboard/DateRangeFilter.tsx` | Editar (presets + logica calendario) |
| `src/lib/utils/date-presets.ts` | Editar (atualizar presets) |

### Sem alteracao em
- `Index.tsx`, `MarketingAnalytics.tsx`, `CatalogLeadsSettings.tsx` — consomem `DateRangeFilter` sem mudanca de API
- `Calendar.tsx` — componente base nao precisa mudar

