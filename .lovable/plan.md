

## Adicionar Upload de Planilha na Aba Vendas

### Resumo

Adicionar um botão "Importar Planilha" na aba Vendas que abre o `UploadDialog` pré-configurado para tipo "sales", permitindo enviar planilhas de vendas diretamente sem sair da aba.

### Alterações

**1. `src/components/upload/SalesRecordsTab.tsx`**
- Adicionar props: `onUploadClick` (callback para abrir o dialog)
- Adicionar botão "Importar Planilha" ao lado do botão "Nova Venda" (visível para quem pode fazer upload — `canUpload`)
- Ícone `FileSpreadsheet` + texto

**2. `src/pages/Uploads.tsx`**
- Criar estado `uploadFromVendas` para controlar abertura do dialog a partir da aba Vendas
- Passar `onUploadClick` para `SalesRecordsTab` que seta `isUploadDialogOpen(true)` 
- O `UploadDialog` já existente será reutilizado (mesmo que está na aba Uploads)
- Passar prop `canUpload` para o SalesRecordsTab controlar visibilidade do botão

### Resultado

Na aba Vendas, ao lado de "Nova Venda", aparece o botão "Importar Planilha". Ao clicar, abre o mesmo dialog de upload já existente. Após o upload ser processado, os novos registros aparecem na tabela de vendas.

