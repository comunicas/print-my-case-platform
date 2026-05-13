## Objetivo
Permitir que **Flávio Horita** (`57c25bda-444f-4a12-b404-b9bb9395ec9e`, viewer, sem organização) veja apenas o PDV **BOULEVARD TATUAPE** (`72811872-2b5d-4db6-afba-46a5e0d55d9a`, org `a1b2c3d4-e5f6-7890-abcd-ef1234567890`).

## Passos
1. Atualizar `profiles.organization_id` do usuário para `a1b2c3d4-e5f6-7890-abcd-ef1234567890`.
2. Inserir em `user_pdvs` o vínculo `(user_id, pdv_id)` apenas para BOULEVARD TATUAPE.

## Por que isso restringe o acesso só a esse PDV
A função `user_can_access_pdv` retorna `true` quando há entrada em `user_pdvs` para o PDV E o usuário pertence à mesma org. O fallback "vê tudo da org" só dispara quando o usuário **não** tem nenhuma linha em `user_pdvs` — como criamos uma linha, esse fallback não se aplica e ele verá somente Boulevard Tatuapé.

## SQL
```sql
UPDATE profiles
SET organization_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
WHERE id = '57c25bda-444f-4a12-b404-b9bb9395ec9e';

INSERT INTO user_pdvs (user_id, pdv_id)
VALUES ('57c25bda-444f-4a12-b404-b9bb9395ec9e',
        '72811872-2b5d-4db6-afba-46a5e0d55d9a')
ON CONFLICT (user_id, pdv_id) DO NOTHING;
```

Sem mudanças de código ou schema.