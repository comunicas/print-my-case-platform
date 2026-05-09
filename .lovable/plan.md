# Plano para corrigir a sincronização via API

## O que aconteceu
A falha de gravação por conflito já foi resolvida, mas o problema atual é **de mapeamento dos campos vindos da API**.

### Evidências já confirmadas
- O upload `42227c4f-be87-4b1b-82b1-5cfa7195947d` foi marcado como **ready**.
- O card mostra **126 transações** e no banco existem **126 linhas** ligadas a esse upload.
- O total gravado bate com o card: **R$ 5.692,40** e **3 reembolsos**.
- Porém os dados detalhados vieram parcialmente errados:
  - **126/126** registros com `payment_method = "Não informado"`
  - **126/126** com `status` fora do padrão canônico (`3`, `4`, `5` em vez de `Concluído`, `Cancelado`, etc.)
  - **126/126** sem `order_completion_time`
  - amostra mostra `payment_date` muito próximo do horário da sincronização, indicando fallback para `new Date()` em vez da data real da venda
  - **50** registros com `amount = 0`

## Causa provável
A API Kexiaozhan está retornando os pedidos em um formato diferente do mapeamento atual da função `ingest-revenue`.
Hoje a função tenta ler campos como `payType`, `paymentTime`, `status`, `refundAmount`, mas o payload real parece usar outras chaves e/ou valores numéricos.

Na prática:
- a sincronização **não quebrou**
- ela **salvou registros**, mas vários campos foram interpretados de forma errada
- por isso o resumo do card pode parecer correto, enquanto a grade detalhada fica inconsistente

## O que vou corrigir
### 1. Ajustar o parser da API
Atualizar o mapeamento da `ingest-revenue` para suportar o payload real da Kexiaozhan:
- aliases adicionais de campos de valor, forma de pagamento, status e datas
- tradução de códigos numéricos de status para os status canônicos do sistema
- tradução de códigos numéricos/textuais de pagamento para os métodos canônicos
- parse robusto de datas sem cair automaticamente no horário atual quando o campo real existir em outro formato

### 2. Adicionar diagnóstico seguro da resposta
Melhorar a instrumentação para detectar payload incompatível sem perder privacidade:
- salvar no resumo de sincronização contagens de campos não reconhecidos
- registrar amostra sanitizada das chaves recebidas quando houver mismatch forte
- destacar quando a sincronização terminou “ready”, mas com sinais de mapeamento suspeito

### 3. Proteger contra “sucesso enganoso”
Se a API responder com dados estruturalmente válidos porém semanticamente errados, a função não deve apenas marcar como `ready` silenciosamente.
Vou adicionar validações de consistência, por exemplo:
- percentual alto demais de `payment_method = Não informado`
- percentual alto demais de status não mapeado
- datas todas caindo no fallback

Quando isso acontecer, a sincronização deve registrar aviso claro no resumo e no erro exibido ao usuário.

### 4. Corrigir a visualização de status
A tela de detalhes ainda colore status com base em `Pago` / `Completed`, mas o sistema usa canônico em PT-BR.
Vou alinhar a UI para refletir corretamente os valores canônicos após o ajuste do parser.

### 5. Reprocessar os uploads afetados
Depois da correção, reexecutar a sincronização dos PDVs/períodos afetados para substituir os registros API incorretos pelos valores corretos.

## Próximos passos práticos
1. Revisar e ampliar o mapeamento da `ingest-revenue` para o payload real.
2. Adicionar validações e resumo diagnóstico da sincronização.
3. Ajustar a tela de detalhes para os status canônicos.
4. Re-sincronizar os uploads API já afetados, começando pelo período **2026-05**.
5. Validar amostras no banco e na tela antes de considerar a correção concluída.

## Impacto esperado
- O card continuará mostrando a contagem correta.
- A tabela passará a exibir **valor, pagamento, status e datas reais**.
- Os uploads API antigos com dados inconsistentes poderão ser normalizados por re-sincronização.

## Detalhes técnicos
- Arquivos principais: `supabase/functions/ingest-revenue/index.ts`, `src/pages/UploadDetails.tsx`
- Sem troca de arquitetura: a RPC de upsert pode permanecer.
- O foco agora é **compatibilidade com o payload real da API** e **reconciliação dos dados já gravados**.