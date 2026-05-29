# Missão da Fé

Aplicação web mobile-first com Jornada da Fé de 365 dias, Quiz da Fé, Palavra da Fé, XP, sequência e ranking.

## Tecnologias Usadas

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase para ranking global e sincronização de progresso
- Bible API (`translation=almeida`) para carregar leituras bíblicas sob demanda
- localStorage como fallback offline
- Camada de serviços para facilitar futura evolução do backend

## Como Instalar

```bash
npm install
```

## Como Rodar Localmente

```bash
npm run dev
```

Abra:

```text
http://localhost:3000
```

No Windows, se o PowerShell bloquear `npm`, use:

```bash
npm.cmd run dev
```

## Como Gerar Build

```bash
npm run build
```

Para testar a versão de produção:

```bash
npm run start
```

## Supabase

O app usa Supabase quando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configuradas. Se a conexão falhar ou as variáveis não existirem, o app continua funcionando com `localStorage`.

- `services/progressService.ts` centraliza as chamadas de progresso.
- `services/localProgressService.ts` mantém o fallback local/offline.
- `services/supabaseProgressService.ts` sincroniza `profiles`, `daily_results` e ranking semanal.
- `services/bibleJourneyService.ts` sincroniza a Jornada da Fé.
- `services/journeyContentService.ts` busca conteúdo em `journey_days` e `journey_quiz_questions`.
- `services/bibleApi.ts` busca o texto bíblico sob demanda na Bible API e usa cache local.
- `services/siteStatsService.ts` usa `site_stats` com fallback local.
- `services/analyticsService.ts` usa `app_events` quando disponível e falha silenciosamente quando não estiver.

Crie um `.env.local` a partir do `.env.example` para rodar com Supabase localmente.

## Banco da Jornada

Para criar ou corrigir o schema esperado pelo app, rode no SQL Editor do Supabase:

```text
scripts/createJourneyTables.sql
scripts/fixSupabaseSchema.sql
```

Depois configure `.env.local` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e, para seeds/admin locais, `SUPABASE_SERVICE_ROLE_KEY`.

```bash
npm run seed:journey
```

O seed cria:

- 365 dias em `journey_days`, com referência bíblica, palavra da fé e XP;
- 1095 perguntas em `journey_quiz_questions`, 3 por dia da jornada.

As leituras bíblicas usam referências, títulos e metadados. O texto é carregado no frontend pela Bible API apenas quando a pessoa abre a leitura, com cache em `localStorage` por referência.

## Como Fazer Deploy na Vercel

1. Suba este projeto para um repositório no GitHub.
2. Acesse a Vercel e importe o repositório.
3. Configure `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
4. Use as configurações padrão de Next.js.
5. Rode o deploy.

Comandos esperados pela Vercel:

```bash
npm install
npm run build
```

## O Que o MVP Inclui

- Home mobile-first centrada na Jornada da Fé.
- Jornada sequencial de 365 dias para leitura do Novo Testamento.
- Quiz da Fé e Palavra da Fé como partes da missão diária.
- Calendário com 365 dias da jornada.
- Palavra da Fé com grade 6x5, teclado virtual, Enter e Backspace físicos.
- Nome do jogador e usuário anônimo salvos localmente, sem login real.
- XP total, XP semanal, sequência atual, melhor sequência e histórico.
- Ranking semanal.
- Compartilhamento no WhatsApp.

## Próximos Passos

- Migrar identidade anônima para Supabase Anonymous Auth.
- Criar ranking por grupo/paróquia.
- Criar painel administrativo para cadastrar leituras, perguntas e palavras.
- Melhorar SEO, metadados sociais e páginas compartilháveis.
