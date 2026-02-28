

# Adicionar Error Boundaries nas Paginas Principais

## Contexto

Atualmente o projeto nao possui nenhum Error Boundary. Se qualquer componente lanca um erro de renderizacao (ex: dado inesperado do backend, bug em um grafico), toda a aplicacao quebra e o usuario ve uma tela branca.

## Solucao

Criar um componente `ErrorBoundary` reutilizavel (class component, unico jeito suportado pelo React 18) e aplica-lo em dois niveis:

### Nivel 1 — Error Boundary Global (App.tsx)

Envolver toda a arvore de rotas com um ErrorBoundary que mostra uma tela de fallback amigavel com botao "Recarregar pagina". Isso garante que nenhum erro nao tratado resulte em tela branca.

### Nivel 2 — Error Boundary por Pagina (AppLayout)

Envolver o `children` dentro do `AppLayout` com um ErrorBoundary de pagina. Assim, se um componente dentro de uma pagina crashar, o sidebar e header continuam funcionando — apenas o conteudo principal mostra a mensagem de erro com opcao de voltar ao Dashboard.

## Arquivos

| Arquivo | Acao |
|---------|------|
| `src/components/ui/ErrorBoundary.tsx` | **Criar** — Class component com dois modos de fallback (full-page e inline) |
| `src/App.tsx` | Envolver a arvore de rotas com `<ErrorBoundary>` global |
| `src/components/layout/AppLayout.tsx` | Envolver `{children}` com `<ErrorBoundary>` inline |

## Detalhes Tecnicos

### ErrorBoundary.tsx

- Class component com `componentDidCatch` para log de erros no console
- Props: `fallback?: ReactNode` e `onReset?: () => void`
- Estado: `hasError`, `error`
- Fallback padrao: Card centralizado com icone `AlertTriangle`, mensagem do erro, e botao "Tentar novamente" que chama `setState({ hasError: false })` + `onReset`
- Exportar tambem um `PageErrorFallback` (componente funcional) para uso inline que mostra o erro com botao de voltar ao Dashboard

### App.tsx

```text
<ErrorBoundary>
  <BrowserRouter>
    ...
  </BrowserRouter>
</ErrorBoundary>
```

### AppLayout.tsx

```text
<main>
  <ErrorBoundary fallback={<PageErrorFallback />}>
    {children}
  </ErrorBoundary>
</main>
```

Assim, um crash no Dashboard nao derruba o sidebar, e o usuario pode navegar para outra pagina sem recarregar.

