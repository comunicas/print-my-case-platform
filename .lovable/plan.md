

# Correcao dos Warnings de forwardRef

## Diagnostico Real

Apos analise detalhada dos logs do console, identifiquei que os warnings **nao sao** especificos do `CollapsibleNavMenu` ou `StockHistoryChart`. O problema e sistemico e afeta **todos os componentes da aplicacao**.

### Causa Raiz

O projeto usa `react-router-dom ^7.12.0` com `React ^18.3.1`. Essa combinacao gera os warnings porque:

- **React Router v7** foi projetado para **React 19**, onde `forwardRef` nao e mais necessario (refs sao aceitas como props normais)
- **React 18.3** adicionou warnings quando bibliotecas tentam passar refs para function components sem `forwardRef`
- O React Router v7 passa refs internamente via `RenderedRoute`, e isso **cascateia** para todos os componentes filhos na arvore

### Evidencia dos Logs

Todos os 36+ warnings seguem o mesmo padrao:

```text
Warning: Function components cannot be given refs.
Check the render method of `App`.
```

Os componentes afetados incluem: `App`, `ThemeProvider`, `TooltipProvider`, `Sonner`, `BrowserRouter`, `Routes`, `AuthProvider`, `ProfileProvider`, `ActiveOrgProvider`, `ProductModalProvider` — ou seja, **toda a arvore de componentes**, nao apenas CollapsibleNavMenu ou StockHistoryChart.

## Solucao Proposta

### Downgrade do react-router-dom para v6

Trocar `react-router-dom` de `^7.12.0` para `^6.28.0` (ultima versao da linha v6), que e totalmente compativel com React 18 e nao gera esses warnings.

**Impacto na migracao:** Minimo. O projeto usa apenas APIs basicas do React Router (`BrowserRouter`, `Routes`, `Route`, `Navigate`, `useNavigate`, `useParams`, `useSearchParams`, `useLocation`) que sao identicas entre v6 e v7. Nao ha uso de APIs exclusivas do v7 (como `createBrowserRouter`, `loaders`, `actions`).

### Arquivo a editar

| Arquivo | Mudanca |
|---------|---------|
| `package.json` | Trocar versao do `react-router-dom` de `^7.12.0` para `^6.28.0` |

### Alternativa considerada e descartada

Envolver cada componente com `React.forwardRef` seria necessario em 20+ arquivos e adicionaria complexidade sem beneficio real — os warnings sao cosmeticos e nao causam bugs funcionais. O downgrade e mais limpo.

### Resultado esperado

- Eliminacao de **todos os 36+ warnings** de forwardRef no console
- Zero impacto funcional na aplicacao
- Compatibilidade total com React 18.3

