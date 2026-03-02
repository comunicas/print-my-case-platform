
# Adicionar tooltips explicativos nos indicadores de margem

## Verificacao do teste

As margens estao funcionando corretamente:
- Margem Bruta: 74.6% (verde) -- calculo correto (9932 / 13321)
- Margem Operacional: 44.5% (verde) -- calculo correto (5932 / 13321)
- Cores verde para positivo funcionando
- Divisao por zero mostra "--" quando receita e zero

## Alteracao proposta

Adicionar um tooltip em cada label de margem explicando a formula do calculo.

### Arquivo: `src/components/financeiro/DRETable.tsx`

1. Importar `Tooltip`, `TooltipTrigger`, `TooltipContent`, `TooltipProvider` de `@/components/ui/tooltip`
2. No componente `MarginRow`, adicionar uma prop `tooltip` (string)
3. Envolver o label da margem com um Tooltip que exibe a explicacao ao passar o mouse
4. Passar os textos explicativos nas chamadas:
   - Margem Bruta: "Lucro Bruto / Receita Liquida x 100"
   - Margem Operacional: "Resultado Operacional / Receita Liquida x 100"

O label tera um icone sutil de info ou underline pontilhado para indicar que ha tooltip disponivel.

Apenas 1 arquivo modificado, sem migrations.
