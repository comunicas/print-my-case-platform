

# Corrigir icone duplicado no OrgSwitcher

## Problema

Quando "Todas as organizacoes" esta selecionado, dois icones de globo aparecem no trigger do Select:
1. O icone fixo no `SelectTrigger` (linha condicional `isAllOrgs`)
2. O icone dentro do `SelectItem value="all"` que e renderizado pelo `SelectValue`

## Solucao

Remover o icone de dentro do `SelectItem value="all"`, mantendo apenas o icone fixo no `SelectTrigger`. O texto "Todas as organizacoes" continua aparecendo via `SelectValue`.

### Arquivo: `src/components/layout/OrgSwitcher.tsx`

Alterar o `SelectItem value="all"` de:
```tsx
<SelectItem value="all">
  <span className="flex items-center gap-2 font-medium">
    <Globe className="h-3 w-3 text-primary flex-shrink-0" />
    Todas as organizações
  </span>
</SelectItem>
```

Para:
```tsx
<SelectItem value="all">
  <span className="font-medium">
    Todas as organizações
  </span>
</SelectItem>
```

O mesmo padrao ja funciona para os demais items: o icone fixo no trigger (`Building2`) cobre o caso normal, e o icone do `SelectItem` aparece apenas no dropdown aberto. Porem, para manter o icone visivel no dropdown, uma alternativa e remover o icone condicional do `SelectTrigger` e deixar o icone apenas nos items. Ambas as abordagens resolvem a duplicacao.

A abordagem recomendada: remover os icones condicionais do `SelectTrigger` (tanto Globe quanto Building2), pois o `SelectValue` ja renderiza o conteudo do item selecionado com seu respectivo icone. Isso simplifica o codigo e elimina a duplicacao.

