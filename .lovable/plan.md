

# Adicionar indicadores de Margem Bruta e Margem Operacional abaixo do DRE

## O que sera feito

Adicionar um card compacto logo abaixo da tabela DRE com dois indicadores de margem percentual:

- **Margem Bruta (%)** = Lucro Bruto / Receita Liquida x 100
- **Margem Operacional (%)** = Resultado Operacional / Receita Liquida x 100

Os indicadores serao exibidos como badges coloridos (verde se positivo, vermelho se negativo), com o valor absoluto ao lado para contexto.

## Alteracoes

### 1. `src/components/financeiro/DRETable.tsx`

Adicionar uma secao de margens ao final do componente DRETable (dentro do mesmo card, abaixo do "Resultado do Mes"), contendo:

- Separador visual
- Duas linhas de margem com layout similar ao DRERow, mas exibindo percentual formatado em vez de moeda
- Margem Bruta: `(lucroBruto / receitaLiquida * 100).toFixed(1)%` -- cor verde/vermelha conforme sinal
- Margem Operacional: `(resultadoOperacional / receitaLiquida * 100).toFixed(1)%` -- cor verde/vermelha conforme sinal
- Quando `receitaLiquida === 0`, exibir "—" para evitar divisao por zero

Nenhum outro arquivo precisa ser alterado. Os dados necessarios (`lucroBruto`, `resultadoOperacional`, `receitaLiquida`) ja estao disponiveis no objeto `dre` passado como prop.

