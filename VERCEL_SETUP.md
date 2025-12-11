# 🚀 Guia Passo a Passo: Deploy no Vercel

## ⚡ Quick Start (5 Passos)

### Passo 1: Preparar o Repositório Git

```bash
# 1.1 Inicializar git (se ainda não estiver)
cd /home/ubuntu/minhas-financas
git init

# 1.2 Adicionar todos os arquivos
git add .

# 1.3 Fazer commit inicial
git commit -m "Initial commit: Minhas Finanças app"

# 1.4 Criar repositório no GitHub
# - Vá para https://github.com/new
# - Nome: minhas-financas
# - Descrição: App de gestão de despesas pessoais
# - Clique em "Create repository"

# 1.5 Adicionar remote e fazer push
git remote add origin https://github.com/SEU_USUARIO/minhas-financas.git
git branch -M main
git push -u origin main
```

---

### Passo 2: Criar Conta no Vercel

1. **Acesse** https://vercel.com
2. **Clique** em "Sign Up"
3. **Escolha** "Continue with GitHub"
4. **Autorize** a conexão com GitHub
5. **Pronto!** Conta criada

---

### Passo 3: Importar Projeto no Vercel

1. **Na página inicial do Vercel**, clique em **"Add New"** → **"Project"**
2. **Procure** por "minhas-financas" na lista de repositórios
3. **Clique** em "Import"
4. **Deixe as configurações padrão** e clique em "Deploy"

**Aguarde 2-3 minutos enquanto o Vercel faz o build...**

---

### Passo 4: Configurar Banco de Dados

#### Opção A: PlanetScale (Recomendado - Mais Fácil)

1. **Acesse** https://planetscale.com
2. **Clique** em "Sign Up"
3. **Escolha** "Sign up with GitHub"
4. **Autorize** a conexão
5. **Clique** em "Create a new database"
6. **Preencha:**
   - Name: `minhas-financas`
   - Region: Escolha a mais próxima
   - Clique em "Create database"
7. **Aguarde** a criação (2-3 minutos)
8. **Clique** em "Connect"
9. **Escolha** "Node.js"
10. **Copie** a connection string (começa com `mysql://`)

#### Opção B: Railway (Alternativa Simples)

1. **Acesse** https://railway.app
2. **Clique** em "Start a New Project"
3. **Escolha** "Provision MySQL"
4. **Aguarde** a criação
5. **Clique** em "Connect"
6. **Copie** a `DATABASE_URL`

---

### Passo 5: Adicionar Variáveis de Ambiente no Vercel

1. **No Vercel**, vá para seu projeto "minhas-financas"
2. **Clique** em "Settings" (aba no topo)
3. **Clique** em "Environment Variables" (menu esquerdo)
4. **Adicione** as seguintes variáveis:

| Variável | Valor | Onde Obter |
|----------|-------|-----------|
| `DATABASE_URL` | `mysql://...` | PlanetScale ou Railway |
| `JWT_SECRET` | Gere uma chave aleatória | Veja abaixo ↓ |
| `VITE_APP_ID` | ID da sua app Manus | Seu dashboard Manus |
| `OAUTH_SERVER_URL` | `https://api.manus.im` | Fixo |
| `VITE_OAUTH_PORTAL_URL` | `https://oauth.manus.im` | Fixo |
| `OWNER_OPEN_ID` | Seu ID Manus | Seu perfil Manus |
| `OWNER_NAME` | Seu nome | Digite seu nome |
| `VITE_APP_TITLE` | `Minhas Finanças` | Fixo |
| `VITE_APP_LOGO` | URL de uma imagem | URL pública (ex: imgur) |
| `BUILT_IN_FORGE_API_URL` | `https://api.manus.im` | Fixo |
| `BUILT_IN_FORGE_API_KEY` | Sua chave API Manus | Seu dashboard Manus |

#### Como Gerar JWT_SECRET

**Opção 1: Usando Node.js**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Opção 2: Usando OpenSSL**
```bash
openssl rand -base64 32
```

**Copie o resultado e adicione no Vercel**

---

## 📝 Checklist de Variáveis

Antes de fazer o deploy, certifique-se de ter:

- [ ] `DATABASE_URL` - String de conexão do banco
- [ ] `JWT_SECRET` - Chave aleatória gerada
- [ ] `VITE_APP_ID` - ID da aplicação OAuth
- [ ] `OAUTH_SERVER_URL` - https://api.manus.im
- [ ] `VITE_OAUTH_PORTAL_URL` - https://oauth.manus.im
- [ ] `OWNER_OPEN_ID` - Seu ID Manus
- [ ] `OWNER_NAME` - Seu nome
- [ ] `VITE_APP_TITLE` - Minhas Finanças
- [ ] `VITE_APP_LOGO` - URL do logo
- [ ] `BUILT_IN_FORGE_API_URL` - https://api.manus.im
- [ ] `BUILT_IN_FORGE_API_KEY` - Sua chave API

---

## 🔄 Após Adicionar Variáveis

1. **Clique** em "Save" após adicionar cada variável
2. **Vá** para a aba "Deployments"
3. **Clique** em "Redeploy" no deployment mais recente
4. **Aguarde** o novo build completar (5-10 minutos)

---

## ✅ Verificar se Funcionou

Após o deployment:

1. **Acesse** a URL do seu projeto (ex: `https://minhas-financas.vercel.app`)
2. **Você deve ver** a página inicial com o gradiente roxo/azul
3. **Clique** em "Começar Agora"
4. **Faça login** com sua conta Manus
5. **Você deve ser redirecionado** para o Dashboard

---

## 🐛 Troubleshooting

### Erro: "Build failed"

**Solução:**
```bash
# Verificar localmente se compila
pnpm build

# Se der erro, corrigir e fazer push
git add .
git commit -m "Fix: Build errors"
git push

# Vercel vai fazer redeploy automaticamente
```

### Erro: "Database connection failed"

**Solução:**
1. Verificar se `DATABASE_URL` está correto
2. Se usar PlanetScale, pode ser necessário criar uma senha
3. Testar a conexão localmente:
   ```bash
   mysql -h seu-host -u usuario -p -e "SELECT 1"
   ```

### Erro: "OAuth callback URL mismatch"

**Solução:**
1. Ir para configurações da app Manus
2. Adicionar URL de callback: `https://seu-projeto.vercel.app/api/oauth/callback`
3. Fazer redeploy no Vercel

### Erro: "Cannot find module"

**Solução:**
```bash
# Limpar cache local
rm -rf node_modules pnpm-lock.yaml

# Reinstalar
pnpm install

# Fazer push
git add .
git commit -m "Fix: Clean install"
git push
```

---

## 📊 Monitorar Deploy

1. **Na página do projeto**, clique em "Deployments"
2. **Você verá** todos os deploys anteriores
3. **Clique** em um deployment para ver logs
4. **Se houver erro**, clique em "View Function Logs"

---

## 🎉 Próximos Passos

Após o deploy bem-sucedido:

1. **Testar a aplicação**
   - Adicionar despesas
   - Verificar se o orçamento funciona
   - Testar alertas

2. **Configurar domínio customizado** (opcional)
   - Settings → Domains
   - Adicionar seu domínio
   - Seguir instruções de DNS

3. **Configurar backups do banco**
   - Se usar PlanetScale: Automático
   - Se usar Railway: Configurar retenção

4. **Monitorar performance**
   - Analytics → Vercel Analytics
   - Verificar latência e erros

---

## 📞 Suporte

- **Vercel Docs**: https://vercel.com/docs
- **PlanetScale Docs**: https://planetscale.com/docs
- **Manus Docs**: https://docs.manus.im

---

## ✨ Parabéns!

Seu aplicativo "Minhas Finanças" está no ar! 🎊

**URL de acesso**: `https://seu-projeto.vercel.app`

Compartilhe com seus amigos e aproveite para gerenciar suas finanças! 💰
