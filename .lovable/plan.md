

## Refinamento da Experiencia de Busca e Autocomplete

### Problemas Atuais

1. **Padrao combobox-button no Estoque**: O `ProductSearchAutocomplete` usa um botao que precisa ser clicado para abrir o dropdown — no mobile exige 2 toques (abrir + digitar). O `PublicStockSearch` ja usa input direto, que e superior.
2. **Sem debounce no Estoque**: Cada tecla digitada dispara `onChange` imediatamente, causando re-filtragem e re-render da tabela/grid a cada caractere.
3. **Sem destaque visual do termo buscado**: As sugestoes mostram o nome do modelo mas nao destacam a parte que corresponde ao que foi digitado.
4. **Touch targets pequenos nas sugestoes**: Os itens do dropdown tem `py-2` — abaixo do minimo de 44px recomendado para mobile.
5. **Sem feedback de "digitando..."**: Quando o debounce esta ativo, o usuario nao sabe se a busca esta processando.

### Mudancas Planejadas

#### 1. Substituir combobox-button por input direto
**Arquivo:** `src/components/stock/ProductSearchAutocomplete.tsx`

- Remover o `<Button>` trigger e usar `<Input>` direto com icone de busca (como o `PublicStockSearch`)
- Dropdown abre automaticamente ao digitar (sem clique extra)
- No focus sem texto: mostrar top 5 produtos mais vendidos como sugestoes rapidas
- Botao X para limpar quando ha texto

#### 2. Adicionar debounce na propagacao do filtro
**Arquivo:** `src/components/stock/ProductSearchAutocomplete.tsx`

- Manter `inputValue` local para UI responsiva (dropdown filtra instantaneamente)
- Propagar para `onChange` (que dispara a filtragem pesada da tabela/grid) apenas apos 300ms de debounce usando `useDebounce`
- Isso separa: digitacao rapida no dropdown vs. re-render da tabela

#### 3. Highlight do termo buscado nas sugestoes
**Arquivo:** `src/components/stock/ProductSearchAutocomplete.tsx`

- Criar funcao utilitaria `highlightMatch(text, term)` que retorna fragmentos com `<mark>` para a parte correspondente
- Aplicar no nome do modelo dentro de cada `CommandItem`

#### 4. Touch targets maiores e feedback visual
**Arquivo:** `src/components/stock/ProductSearchAutocomplete.tsx`

- Aumentar padding dos itens de sugestao: `py-2` → `py-3` no mobile
- Adicionar indicador sutil de loading (spinner pequeno no input) enquanto debounce esta pendente

#### 5. Limpar busca com botao X
**Arquivo:** `src/components/stock/ProductSearchAutocomplete.tsx`

- Quando `inputValue` nao esta vazio, mostrar icone X clicavel no lado direito do input
- Ao clicar, limpa o input e o filtro imediatamente

### Arquivos Impactados

| Arquivo | Mudanca |
|---------|---------|
| `src/components/stock/ProductSearchAutocomplete.tsx` | Reescrever: input direto, debounce, highlight, clear button, touch targets |

### Resultado Esperado

- **1 toque** para comecar a buscar (vs. 2 antes)
- **Filtragem suave** sem jank durante digitacao rapida
- **Feedback visual** claro do que esta sendo buscado
- **Touch-friendly** com alvos de toque adequados

