# 🚀 Guia Completo de Deployment - Minhas Finanças

## 📋 Índice
1. [Preparação Inicial](#preparação-inicial)
2. [Deployment no Vercel](#deployment-vercel)
3. [Deployment no Netlify](#deployment-netlify)
4. [Configuração do Banco de Dados](#banco-dados)
5. [Variáveis de Ambiente](#variáveis-ambiente)
6. [Troubleshooting](#troubleshooting)

---

## <a name="preparação-inicial"></a>1. Preparação Inicial

### 1.1 Verificar Estrutura do Projeto

Certifique-se de que seu projeto tem a seguinte estrutura:

```
minhas-financas/
├── client/                 # Frontend React
│   ├── src/
│   ├── public/
│   └── package.json
├── server/                 # Backend Node.js
│   ├── db.ts
│   ├── routers.ts
│   └── _core/
├── drizzle/               # Schema do banco
│   └── schema.ts
├── package.json           # Root package.json
├── tsconfig.json
└── .env.example          # Template de variáveis
```

### 1.2 Criar Arquivo .env.example

```bash
# .env.example
DATABASE_URL=mysql://user:password@host:3306/minhas_financas
JWT_SECRET=sua_chave_secreta_aqui
VITE_APP_ID=seu_app_id_oauth
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
OWNER_OPEN_ID=seu_owner_id
OWNER_NAME=Seu Nome
VITE_APP_TITLE=Minhas Finanças
VITE_APP_LOGO=https://seu-dominio.com/logo.png
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=sua_chave_api
```

### 1.3 Preparar Repositório Git

```bash
# Inicializar git (se ainda não estiver)
git init

# Adicionar .gitignore
cat > .gitignore << EOF
node_modules/
dist/
build/
.env
.env.local
.env.*.local
*.log
.DS_Store
EOF

# Fazer commit inicial
git add .
git commit -m "Initial commit: Minhas Finanças app"

# Adicionar remote (substituir URL)
git remote add origin https://github.com/seu-usuario/minhas-financas.git
git branch -M main
git push -u origin main
```

---

## <a name="deployment-vercel"></a>2. Deployment no Vercel

### 2.1 Preparar Projeto para Vercel

#### Criar arquivo `vercel.json`

```json
{
  "version": 2,
  "buildCommand": "pnpm install && pnpm build",
  "devCommand": "pnpm dev",
  "installCommand": "pnpm install",
  "env": {
    "DATABASE_URL": "@database_url",
    "JWT_SECRET": "@jwt_secret",
    "VITE_APP_ID": "@vite_app_id",
    "OAUTH_SERVER_URL": "@oauth_server_url",
    "VITE_OAUTH_PORTAL_URL": "@vite_oauth_portal_url",
    "OWNER_OPEN_ID": "@owner_open_id",
    "OWNER_NAME": "@owner_name",
    "VITE_APP_TITLE": "@vite_app_title",
    "VITE_APP_LOGO": "@vite_app_logo",
    "BUILT_IN_FORGE_API_URL": "@built_in_forge_api_url",
    "BUILT_IN_FORGE_API_KEY": "@built_in_forge_api_key"
  },
  "functions": {
    "server/**/*.ts": {
      "memory": 1024,
      "maxDuration": 60
    }
  },
  "rewrites": [
    {
      "source": "/api/trpc/:path*",
      "destination": "/api/trpc"
    }
  ]
}
```

#### Atualizar `package.json`

```json
{
  "name": "minhas-financas",
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "concurrently \"pnpm run dev:client\" \"pnpm run dev:server\"",
    "dev:client": "cd client && pnpm dev",
    "dev:server": "cd server && pnpm dev",
    "build": "pnpm run build:client && pnpm run build:server",
    "build:client": "cd client && pnpm build",
    "build:server": "cd server && pnpm build",
    "start": "node dist/server/index.js",
    "db:push": "drizzle-kit push",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate"
  },
  "dependencies": {
    "express": "^4.18.2",
    "trpc": "^11.0.0",
    "drizzle-orm": "^0.28.0",
    "mysql2": "^3.6.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "concurrently": "^8.2.0"
  }
}
```

### 2.2 Passo a Passo no Vercel

1. **Acessar Vercel**
   - Vá para [vercel.com](https://vercel.com)
   - Faça login com sua conta GitHub

2. **Importar Projeto**
   - Clique em "Add New" → "Project"
   - Selecione seu repositório GitHub
   - Clique em "Import"

3. **Configurar Variáveis de Ambiente**
   - Na seção "Environment Variables", adicione:
     - `DATABASE_URL` - String de conexão MySQL
     - `JWT_SECRET` - Chave secreta aleatória
     - `VITE_APP_ID` - ID da aplicação OAuth
     - `OAUTH_SERVER_URL` - URL do servidor OAuth
     - Todas as outras variáveis do `.env.example`

4. **Configurar Build Settings**
   - Build Command: `pnpm install && pnpm build`
   - Output Directory: `client/dist`
   - Install Command: `pnpm install`

5. **Deploy**
   - Clique em "Deploy"
   - Aguarde a conclusão do build (5-10 minutos)

### 2.3 Verificar Deploy no Vercel

```bash
# Após o deploy, testar a aplicação
curl https://seu-projeto.vercel.app

# Verificar logs
vercel logs seu-projeto --tail
```

---

## <a name="deployment-netlify"></a>3. Deployment no Netlify

### 3.1 Preparar Projeto para Netlify

#### Criar arquivo `netlify.toml`

```toml
[build]
  command = "pnpm install && pnpm build"
  functions = "netlify/functions"
  publish = "client/dist"

[build.environment]
  NODE_VERSION = "22.13.0"
  PNPM_VERSION = "9.0.0"

[[redirects]]
  from = "/api/trpc/*"
  to = "/.netlify/functions/trpc"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[context.production]
  environment = { ENVIRONMENT = "production" }

[context.deploy-preview]
  environment = { ENVIRONMENT = "preview" }

[context.branch-deploy]
  environment = { ENVIRONMENT = "branch" }
```

#### Criar Função Serverless para tRPC

Crie o arquivo `netlify/functions/trpc.ts`:

```typescript
import { Handler } from "@netlify/functions";
import express from "express";
import { createHTTPHandler } from "@trpc/server/adapters/standalone";
import { appRouter } from "../../server/routers";
import { createContext } from "../../server/_core/context";

const app = express();

app.use(
  "/api/trpc",
  createHTTPHandler({
    router: appRouter,
    createContext,
  })
);

export const handler: Handler = async (event, context) => {
  return new Promise((resolve) => {
    app(event as any, { status: resolve } as any);
  });
};
```

#### Atualizar `package.json` para Netlify

```json
{
  "scripts": {
    "build": "pnpm run build:client",
    "build:client": "cd client && pnpm build",
    "dev": "cd client && pnpm dev"
  }
}
```

### 3.2 Passo a Passo no Netlify

1. **Acessar Netlify**
   - Vá para [netlify.com](https://netlify.com)
   - Faça login com sua conta GitHub

2. **Conectar Repositório**
   - Clique em "Add new site" → "Import an existing project"
   - Selecione GitHub e autorize
   - Escolha seu repositório

3. **Configurar Build**
   - Build command: `pnpm install && pnpm build`
   - Publish directory: `client/dist`
   - Clique em "Deploy site"

4. **Adicionar Variáveis de Ambiente**
   - Vá para "Site settings" → "Build & deploy" → "Environment"
   - Clique em "Edit variables"
   - Adicione todas as variáveis do `.env.example`

5. **Configurar Funções Serverless**
   - Vá para "Functions" e verifique se estão sendo detectadas
   - Configure as variáveis de ambiente para as funções

### 3.3 Verificar Deploy no Netlify

```bash
# Após o deploy, testar a aplicação
curl https://seu-projeto.netlify.app

# Verificar logs das funções
# Vá para: Site settings → Functions → Logs
```

---

## <a name="banco-dados"></a>4. Configuração do Banco de Dados

### 4.1 Opções de Banco de Dados em Produção

#### Opção 1: PlanetScale (MySQL Serverless)

**Vantagens:**
- MySQL serverless sem gerenciamento
- Escalabilidade automática
- Integração fácil com Vercel
- Plano gratuito disponível

**Setup:**

```bash
# 1. Criar conta em planetscale.com
# 2. Criar novo banco de dados
# 3. Obter connection string

# 4. Adicionar ao .env
DATABASE_URL="mysql://user:password@aws.connect.psdb.cloud/minhas_financas?sslaccept=strict"

# 5. Executar migrações
pnpm db:push
```

#### Opção 2: AWS RDS

**Vantagens:**
- Gerenciado pela AWS
- Backup automático
- Alta disponibilidade
- Suporte profissional

**Setup:**

```bash
# 1. Criar instância RDS no AWS Console
# 2. Configurar security groups
# 3. Obter endpoint

# 4. Adicionar ao .env
DATABASE_URL="mysql://admin:senha@minhas-financas.c9akciq32.us-east-1.rds.amazonaws.com:3306/minhas_financas"

# 5. Executar migrações
pnpm db:push
```

#### Opção 3: Railway

**Vantagens:**
- Simples de usar
- Integração com Vercel/Netlify
- Plano gratuito com créditos
- Deploy automático

**Setup:**

```bash
# 1. Criar conta em railway.app
# 2. Criar novo projeto
# 3. Adicionar MySQL plugin
# 4. Copiar DATABASE_URL

# 5. Adicionar ao .env
DATABASE_URL="mysql://root:password@containers.railway.app:7199/railway"

# 6. Executar migrações
pnpm db:push
```

### 4.2 Executar Migrações em Produção

```bash
# Conectar ao banco de produção
export DATABASE_URL="sua_string_de_conexao_produção"

# Gerar migrações
pnpm db:generate

# Executar migrações
pnpm db:push

# Verificar status
pnpm db:status
```

---

## <a name="variáveis-ambiente"></a>5. Variáveis de Ambiente

### 5.1 Gerar Chaves Seguras

```bash
# Gerar JWT_SECRET
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Gerar chave API
openssl rand -base64 32
```

### 5.2 Variáveis Necessárias

| Variável | Descrição | Exemplo |
|----------|-----------|---------|
| `DATABASE_URL` | String de conexão MySQL | `mysql://user:pass@host/db` |
| `JWT_SECRET` | Chave para assinar tokens | `abc123def456...` |
| `VITE_APP_ID` | ID da aplicação OAuth | `seu_app_id` |
| `OAUTH_SERVER_URL` | URL do servidor OAuth | `https://api.manus.im` |
| `VITE_OAUTH_PORTAL_URL` | URL do portal OAuth | `https://oauth.manus.im` |
| `OWNER_OPEN_ID` | ID do proprietário | `seu_owner_id` |
| `OWNER_NAME` | Nome do proprietário | `Seu Nome` |
| `VITE_APP_TITLE` | Título da aplicação | `Minhas Finanças` |
| `VITE_APP_LOGO` | URL do logo | `https://seu-dominio.com/logo.png` |
| `BUILT_IN_FORGE_API_URL` | URL da API Manus | `https://api.manus.im` |
| `BUILT_IN_FORGE_API_KEY` | Chave da API Manus | `sua_chave_api` |

### 5.3 Adicionar Variáveis no Vercel

```bash
# Via CLI
vercel env add DATABASE_URL
vercel env add JWT_SECRET
vercel env add VITE_APP_ID
# ... etc

# Ou manualmente no dashboard:
# Settings → Environment Variables → Add
```

### 5.4 Adicionar Variáveis no Netlify

```bash
# Via CLI
netlify env:set DATABASE_URL "mysql://..."
netlify env:set JWT_SECRET "abc123..."
netlify env:set VITE_APP_ID "seu_app_id"
# ... etc

# Ou manualmente no dashboard:
# Site settings → Build & deploy → Environment → Edit variables
```

---

## <a name="troubleshooting"></a>6. Troubleshooting

### 6.1 Erro: "Cannot find module"

**Solução:**

```bash
# Limpar cache e reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install

# Rebuildar
pnpm build

# Fazer push novamente
git add .
git commit -m "Fix: Clean install"
git push
```

### 6.2 Erro: "Database connection failed"

**Verificar:**

```bash
# 1. Testar string de conexão localmente
mysql -h seu-host -u usuario -p -e "SELECT 1"

# 2. Verificar variáveis de ambiente
echo $DATABASE_URL

# 3. Verificar firewall/security groups
# - Vercel: Adicionar IP ranges da Vercel
# - Netlify: Adicionar IP ranges da Netlify

# 4. Testar conexão remota
pnpm db:push --dry-run
```

### 6.3 Erro: "Build timeout"

**Solução:**

```bash
# Aumentar timeout no vercel.json
{
  "functions": {
    "server/**/*.ts": {
      "maxDuration": 300  // 5 minutos
    }
  }
}

# Ou no netlify.toml
[build]
  command_timeout = 300
```

### 6.4 Erro: "OAuth callback URL mismatch"

**Solução:**

1. Ir para configurações da aplicação OAuth
2. Adicionar URL de callback de produção:
   - Vercel: `https://seu-projeto.vercel.app/api/oauth/callback`
   - Netlify: `https://seu-projeto.netlify.app/api/oauth/callback`

### 6.5 Erro: "CORS policy"

**Solução:**

Adicionar headers no `vercel.json`:

```json
{
  "headers": [
    {
      "source": "/api/(.*)",
      "headers": [
        {
          "key": "Access-Control-Allow-Origin",
          "value": "*"
        },
        {
          "key": "Access-Control-Allow-Methods",
          "value": "GET, POST, PUT, DELETE, OPTIONS"
        },
        {
          "key": "Access-Control-Allow-Headers",
          "value": "Content-Type, Authorization"
        }
      ]
    }
  ]
}
```

---

## 📊 Comparação: Vercel vs Netlify

| Aspecto | Vercel | Netlify |
|--------|--------|---------|
| **Preço** | Gratuito + pago | Gratuito + pago |
| **Funções Serverless** | ✅ Nativas | ✅ Funções |
| **Banco de Dados** | Integração fácil | Requer setup manual |
| **Performance** | Excelente | Muito bom |
| **Suporte** | Comunidade + Premium | Comunidade + Premium |
| **Escalabilidade** | Automática | Automática |
| **Deploy Automático** | ✅ Git push | ✅ Git push |
| **Recomendação** | **Melhor para Full-Stack** | **Melhor para Frontend** |

---

## 🎯 Checklist de Deployment

- [ ] Repositório Git criado e pushado
- [ ] `.env.example` criado com todas as variáveis
- [ ] `vercel.json` ou `netlify.toml` configurado
- [ ] Banco de dados criado (PlanetScale, RDS ou Railway)
- [ ] Variáveis de ambiente adicionadas na plataforma
- [ ] Build local testado: `pnpm build`
- [ ] Migrações executadas: `pnpm db:push`
- [ ] URLs de callback OAuth configuradas
- [ ] Deploy inicial realizado
- [ ] Aplicação testada em produção
- [ ] Monitoramento configurado
- [ ] Backups do banco de dados configurados

---

## 🔒 Segurança em Produção

### 6.1 Boas Práticas

```bash
# 1. Usar HTTPS sempre
# ✅ Vercel e Netlify fornecem HTTPS gratuito

# 2. Proteger variáveis sensíveis
# ✅ Nunca commitar .env
# ✅ Usar secrets da plataforma

# 3. Validar entrada de usuários
# ✅ Implementado no Zod (server/routers.ts)

# 4. Rate limiting
# Adicionar ao Express:
import rateLimit from "express-rate-limit";

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // limite de 100 requisições por IP
});

app.use("/api/", limiter);

# 5. CORS configurado
# ✅ Implementado no template

# 6. Backup automático do banco
# ✅ PlanetScale: Automático
# ✅ RDS: Configurar retention period
# ✅ Railway: Automático
```

---

## 📞 Suporte e Recursos

- **Vercel Docs**: https://vercel.com/docs
- **Netlify Docs**: https://docs.netlify.com
- **PlanetScale Docs**: https://planetscale.com/docs
- **Drizzle ORM**: https://orm.drizzle.team
- **tRPC Docs**: https://trpc.io/docs

---

## 🎉 Próximos Passos

Após o deployment bem-sucedido:

1. **Monitoramento**
   - Configurar alertas de erro
   - Monitorar performance
   - Verificar logs regularmente

2. **Otimização**
   - Implementar caching
   - Otimizar imagens
   - Minificar CSS/JS

3. **Escalabilidade**
   - Adicionar CDN
   - Implementar load balancing
   - Usar banco de dados replicado

4. **Manutenção**
   - Atualizar dependências regularmente
   - Fazer backup dos dados
   - Revisar logs de segurança

---

Desenvolvido com ❤️ usando Manus AI
