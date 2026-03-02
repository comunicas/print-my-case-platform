

# Mostrar botao "Copiar despesas" sempre abaixo da lista

## Problema
O card "Copiar despesas do mes anterior" so aparece quando nao ha despesas no mes (`entries.length === 0`). O usuario quer que o botao esteja sempre visivel abaixo da lista, permitindo copiar as despesas fixas e deducoes do mes anterior independentemente de ja existirem entradas.

## Alteracao

| Arquivo | Mudanca |
|---------|---------|
| `src/pages/Financeiro.tsx` | Remover a condicao `entries.length === 0` da linha 156, mantendo apenas `isAdmin && !entriesLoading`. Ajustar o texto do card para funcionar nos dois cenarios (com e sem despesas existentes). |

### Detalhes tecnicos

Linha 156 atual:
```typescript
{isAdmin && !entriesLoading && entries.length === 0 && (
```

Sera alterada para:
```typescript
{isAdmin && !entriesLoading && (
```

O texto sera ajustado para:
- Titulo: "Copiar do mes anterior"
- Descricao: "Copiar despesas fixas e deducoes do mes anterior para este mes"

A logica de validacao (impedir duplicatas) ja existe no hook `copyFromPreviousMonth` -- ele verifica se ja existem entradas de categorias `fixas`/`deducoes` antes de inserir e exibe erro caso ja existam.

