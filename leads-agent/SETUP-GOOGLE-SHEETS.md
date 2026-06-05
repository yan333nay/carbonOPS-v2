# Setup Google Sheets — Leads Agent

Para o agente escrever automaticamente na planilha, você precisa criar uma
Service Account no Google Cloud. Siga os passos abaixo uma única vez.

---

## Passo 1 — Criar projeto no Google Cloud

1. Acesse https://console.cloud.google.com/
2. Clique em "Selecionar projeto" → "Novo projeto"
3. Nome: `carbon-films-leads`
4. Clique em "Criar"

---

## Passo 2 — Ativar a API do Google Sheets

1. No menu lateral: **APIs e serviços** → **Biblioteca**
2. Busque: `Google Sheets API`
3. Clique em "Ativar"

---

## Passo 3 — Criar Service Account

1. Menu lateral: **APIs e serviços** → **Credenciais**
2. Clique em **"+ Criar credenciais"** → **"Conta de serviço"**
3. Nome: `leads-agent`
4. Clique em **"Concluído"** (sem precisar definir permissões extras)

---

## Passo 4 — Baixar a chave JSON

1. Na lista de contas de serviço, clique na que você criou
2. Aba **"Chaves"** → **"Adicionar chave"** → **"Criar nova chave"**
3. Tipo: **JSON** → Clique em **"Criar"**
4. O arquivo será baixado automaticamente
5. **Renomeie para `google-credentials.json`**
6. Faça upload para a VPS: `/root/leads-agent/google-credentials.json`

---

## Passo 5 — Compartilhar a planilha com a Service Account

1. Abra o arquivo JSON baixado e copie o campo `"client_email"`:
   - Formato: `leads-agent@carbon-films-leads.iam.gserviceaccount.com`
2. Abra a planilha:
   https://docs.google.com/spreadsheets/d/1bl5vWhAvYrRwu2Rufjw9uXEykXNCQCw-rsHLOKK-EFE/edit
3. Clique em **"Compartilhar"** (canto superior direito)
4. Cole o email da service account
5. Permissão: **Editor**
6. Clique em **"Enviar"** (sem notificar)

---

## Passo 6 — Testar

No VPS, rode:
```bash
cd /root/leads-agent
node index.js --dry-run
```

Se não houver erro de autenticação, rode sem dry-run:
```bash
node index.js
```

Os leads aparecerão na planilha automaticamente.

---

## Troubleshooting

**Erro: "google-credentials.json não encontrado"**
→ Certifique-se de que o arquivo está em `/root/leads-agent/google-credentials.json`

**Erro: "The caller does not have permission"**
→ A service account não tem acesso à planilha. Refaça o Passo 5.

**Erro: "API not enabled"**
→ Refaça o Passo 2 no projeto correto.

---

Enquanto o `google-credentials.json` não existir, os leads são salvos em:
`/root/leads-agent/data/leads-backup.csv`
