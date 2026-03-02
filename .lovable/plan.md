

# Auditoria completa: Super Admin sem restrições

## Problema

O super_admin deve ter acesso irrestrito a todas as operações em todas as tabelas. A revisão das políticas RLS revela que **diversas tabelas** não incluem o bypass `is_super_admin()`, causando bloqueios como o erro de upload reportado.

## Tabelas com políticas que precisam de correção

### 1. uploads (causa do erro atual)

| Operação | Status | Problema |
|----------|--------|----------|
| SELECT | OK | usa `user_can_access_pdv` que inclui super_admin |
| INSERT | BLOQUEADO | exige `uploaded_by = auth.uid()` + PDV da própria org |
| UPDATE | BLOQUEADO | exige `uploaded_by = auth.uid()` + PDV da própria org |
| DELETE | BLOQUEADO | exige `is_admin` + PDV da própria org |

### 2. sales_records

| Operação | Status | Problema |
|----------|--------|----------|
| SELECT | OK | `user_can_access_pdv` inclui super_admin |
| INSERT | BLOQUEADO | exige PDV da própria org |
| UPDATE | BLOQUEADO | `is_admin` + própria org |
| DELETE | BLOQUEADO | `is_admin` + própria org |

### 3. stock_records

| Operação | Status | Problema |
|----------|--------|----------|
| SELECT | OK | `user_can_access_pdv` inclui super_admin |
| INSERT | BLOQUEADO | exige PDV da própria org |
| UPDATE | BLOQUEADO | `is_admin` + própria org |
| DELETE | BLOQUEADO | `is_admin` + própria org |

### 4. stock_history

| Operação | Status | Problema |
|----------|--------|----------|
| SELECT | OK | inclui `is_super_admin` |
| INSERT | BLOQUEADO | exige PDV da própria org |
| UPDATE | BLOQUEADO | exige PDV da própria org |
| DELETE | BLOQUEADO | `is_admin` + própria org |

### 5. upload_anomalies

| Operação | Status | Problema |
|----------|--------|----------|
| SELECT | OK | via `user_can_access_pdv` |
| INSERT | BLOQUEADO | exige upload da própria org |
| DELETE | BLOQUEADO | `is_admin` + própria org |

### 6. financial_entries

| Operação | Status | Problema |
|----------|--------|----------|
| SELECT | OK | inclui `is_super_admin` |
| INSERT | BLOQUEADO | `is_admin` + própria org |
| UPDATE | BLOQUEADO | `is_admin` + própria org |
| DELETE | BLOQUEADO | `is_admin` + própria org |

### 7. products

| Operação | Status | Problema |
|----------|--------|----------|
| SELECT | OK | inclui `user_has_org_access` |
| ALL (manage) | BLOQUEADO | `is_admin` + própria org, sem super_admin |

### 8. product_requests

| Operação | Status | Problema |
|----------|--------|----------|
| SELECT | BLOQUEADO | `is_admin` + própria org |
| INSERT | OK | público |
| UPDATE | BLOQUEADO | `is_admin` + própria org |
| DELETE | BLOQUEADO | `is_admin` + própria org |

### 9. notifications

| Operação | Status | Problema |
|----------|--------|----------|
| SELECT | PARCIAL | baseado em org, sem super_admin explícito |
| INSERT | BLOQUEADO | `is_admin` + própria org |
| UPDATE | BLOQUEADO | baseado em org |
| DELETE | BLOQUEADO | `is_admin` + própria org |

### 10. user_pdvs

| Operação | Status | Problema |
|----------|--------|----------|
| SELECT (próprio) | OK | |
| ALL (manage) | BLOQUEADO | `is_admin` + PDV da própria org |

### 11. catalog_leads

| Operação | Status | Problema |
|----------|--------|----------|
| SELECT | OK | tem policy separada para super_admin |
| DELETE | BLOQUEADO | `is_admin` + própria org |

## Tabelas já corretas (não precisam de alteração)

- **organizations**: SELECT, INSERT, UPDATE, DELETE -- todas com super_admin
- **pdvs**: INSERT, UPDATE, DELETE, SELECT -- todas com super_admin
- **api_keys**: todas as operações com super_admin
- **pdv_catalog_settings**: ALL com super_admin
- **pdv_marketing_media**: ALL com super_admin
- **catalog_short_links**: ALL com super_admin
- **profiles**: SELECT, UPDATE, DELETE com super_admin
- **user_roles**: usa `is_admin` que inclui super_admin
- **audit_logs**: INSERT por actor, SELECT por super_admin
- **user_org_access**: ALL por super_admin

## Solução

Uma única migration SQL que atualiza todas as políticas listadas acima, adicionando `OR is_super_admin(auth.uid())` em cada uma. O padrão será:

```text
DROP POLICY "nome_antigo" ON tabela;
CREATE POLICY "nome_antigo" ON tabela
  FOR operacao TO authenticated
  USING/WITH CHECK (
    is_super_admin(auth.uid())
    OR (regra_original)
  );
```

### Resumo da migration

- **11 tabelas** afetadas
- **~30 políticas** a serem atualizadas
- **Risco**: Baixo -- apenas adiciona permissão que já deveria existir
- **Impacto**: Super admin poderá operar sem restrição em qualquer organização, incluindo uploads, vendas, estoque, financeiro e notificações

