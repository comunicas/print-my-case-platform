

# Fix: Links Encurtados para Catálogos Existentes

## Problemas Encontrados no Teste

### 1. Links curtos nao criados para PDVs ja configurados
Os PDVs "Tiete Plaza Shopping" e "Shopping Metro Boulevard Tatuape" ja estavam configurados com slugs antes da feature de links curtos ser adicionada. A tabela `catalog_short_links` esta vazia. O link curto so e gerado ao clicar "Salvar", mas como nao ha mudancas pendentes, o botao nao aparece.

### 2. Secao "Catalogos Publicos" dificil de visualizar
A secao existe no DOM entre o formulario da organizacao e "Plano e Faturamento", mas nao aparece claramente na tela — pode estar sendo sobreposta por outros cards.

### 3. Edge function funcionando
A edge function `redirect-short-link` esta deployada e respondendo corretamente (404 para codigos inexistentes, como esperado).

---

## Correcoes Necessarias

### 1. Auto-criar links curtos para PDVs existentes

No hook `usePDVCatalogSettings`, apos carregar os dados, verificar se algum PDV tem `is_public_enabled = true` e `public_slug` definido mas nao tem `short_link`. Se sim, criar o short link automaticamente.

**Arquivo:** `src/hooks/usePDVCatalogSettings.ts`

- Adicionar um `useEffect` que, apos o carregamento dos dados, verifica PDVs sem short link
- Para cada PDV sem short link (mas com catalogo ativo), gerar e inserir automaticamente no banco
- Invalidar a query apos a criacao para atualizar a UI

### 2. Garantir visibilidade da secao de Catalogos

**Arquivo:** `src/components/settings/OrganizationSettings.tsx`

- Verificar se o Card de "Catalogos Publicos" esta sendo renderizado com estilo correto
- Adicionar uma `Separator` ou espacamento adequado entre as secoes

### 3. Testar o fluxo completo apos as correcoes

1. Acessar `/settings?tab=organization`
2. Verificar que os links curtos foram criados automaticamente
3. Copiar um link curto
4. Acessar o link curto no navegador
5. Verificar redirect para o catalogo
6. Verificar que o contador de cliques foi incrementado

---

## Detalhes Tecnicos

### Hook - Auto-create missing short links

```text
// No usePDVCatalogSettings, adicionar useEffect:
useEffect(() => {
  if (pdvsWithSettings.length === 0) return;
  
  const pdvsNeedingShortLink = pdvsWithSettings.filter(
    pdv => pdv.catalog_settings?.is_public_enabled 
        && pdv.catalog_settings?.public_slug 
        && !pdv.short_link
  );
  
  if (pdvsNeedingShortLink.length === 0) return;
  
  // Para cada PDV sem short link, criar um
  Promise.all(pdvsNeedingShortLink.map(async (pdv) => {
    const targetUrl = `https://printmycase.comunicas.com.br/catalogo/${pdv.catalog_settings.public_slug}`;
    const shortCode = generateShortCode();
    await supabase.from("catalog_short_links").insert({
      pdv_id: pdv.id,
      short_code: shortCode,
      target_url: targetUrl,
    });
  })).then(() => {
    queryClient.invalidateQueries({ queryKey: ["pdv-catalog-settings"] });
  });
}, [pdvsWithSettings]);
```

### Arquivos Modificados
- `src/hooks/usePDVCatalogSettings.ts` — adicionar auto-criacao de short links
- `src/components/settings/OrganizationSettings.tsx` — ajustar layout/espacamento da secao de catalogos (se necessario)

