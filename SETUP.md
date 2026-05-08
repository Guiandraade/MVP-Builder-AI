# MVP Builder AI Setup Guide

## Prerequisitos

- Node.js 18+
- Conta Supabase (https://supabase.com)
- Vercel (opcional, para deploy)

## 1. Setup Supabase

### 1.1 Criar Projeto
1. Acesse https://supabase.com e crie uma nova conta
2. Crie um novo projeto
3. Copie a `Project URL` e a `anon key`

### 1.2 Configurar Banco de Dados
1. Na dashboard do Supabase, vá para SQL Editor
2. Cole o conteúdo do arquivo `database.sql`
3. Execute a query para criar as tabelas e políticas de RLS

### 1.3 Configurar Magic Link Auth
1. Vá para Authentication > Providers
2. Ative "Email" como provider
3. Configure as settings de Email (pode deixar como padrão)
4. Vá para Auth > Email Templates
5. Personalize o template de email se desejar

## 2. Configurar Variáveis de Ambiente

1. Crie um arquivo `.env.local` na raiz do projeto
2. Adicione as variáveis:

```
NEXT_PUBLIC_SUPABASE_URL=sua_url_do_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=sua_chave_anonima
```

3. Para deploy em produção, adicione as mesmas variáveis no painel de deployment (Vercel)

## 3. Configurar Redirect URL

1. Na dashboard do Supabase, vá para Authentication > URL Configuration
2. Adicione a URL de callback:
   - **Desenvolvimento**: `http://localhost:3000/auth/callback`
   - **Produção**: `https://seu-dominio.com/auth/callback`

## 4. Rodando Localmente

```bash
npm install
npm run dev
```

Acesse `http://localhost:3000/login`

## 5. Deploy na Vercel

```bash
npm install -g vercel
vercel
```

Siga as instruções e defina as variáveis de ambiente durante o setup.

## Próximos Passos

- [ ] Integrar IA real (OpenAI/Anthropic)
- [ ] Adicionar busca no histórico
- [ ] Implementar export de conversas
- [ ] Adicionar suporte a múltiplos idiomas
- [ ] Personalizar system prompt do arquiteto
