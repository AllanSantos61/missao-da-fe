# Missão da Fé

Aplicação web mobile-first com desafios católicos diários: Jornada, Quiz da Fé e Palavra da Fé.

## Tecnologias Usadas

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- Supabase para ranking global e sincronização de progresso
- localStorage como fallback offline
- Camada `services/progressService.ts` centralizando a persistência

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

## Seeds de Conteúdo

Antes de rodar os seeds, aplique no SQL Editor do Supabase:

```text
supabase/content-base.sql
supabase/new-testament-journey.sql
```

Depois configure `.env.local` com `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e, para seeds/admin, `SUPABASE_SERVICE_ROLE_KEY`.

```bash
npm run seed:words
npm run seed:quiz
npm run seed:bible
npm run seed:plan
```

Os seeds criam:

- 500 linhas em `faith_words`;
- 1500 perguntas em `quiz_questions`;
- 365 leituras estruturais em `bible_readings`;
- 365 dias em `reading_plan`.

As leituras bíblicas usam referências, títulos e conteúdo temporário próprio. Substitua por texto bíblico com licença clara/autorizada antes de publicar a íntegra.

## Como Fazer Deploy na Vercel

1. Suba este projeto para um repositório no GitHub.
2. Acesse a Vercel e importe o repositório.
3. Use as configurações padrão de Next.js.
4. Rode o deploy.

Comandos esperados pela Vercel:

```bash
npm install
npm run build
```

## O Que o MVP Inclui

- Home mobile-first com três desafios independentes.
- Jornada do Novo Testamento, Quiz da Fé e Palavra da Fé.
- Jornada sequencial que não pula trechos quando o usuário falta.
- Calendário dos últimos 30 dias com dias concluídos, perdidos e pendentes.
- Palavra da Fé com grade 6x5, teclado virtual, Enter e Backspace físicos.
- Nome do jogador salvo em localStorage, sem login real.
- XP total, XP semanal, streak atual, melhor streak e histórico diário.
- Ranking local da semana usando os dados do próprio usuário.
- Compartilhamento no WhatsApp.

## Supabase

O app usa Supabase quando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` estão configuradas. Se a conexão falhar ou as variáveis não existirem, o app continua funcionando com `localStorage`.

- `services/progressService.ts` centraliza as chamadas usadas pelo app.
- `services/localProgressService.ts` mantém o fallback local/offline.
- `services/supabaseProgressService.ts` sincroniza `profiles`, `daily_results` e ranking semanal.
- `services/bibleJourneyService.ts` sincroniza a Jornada do Novo Testamento.
- `lib/supabaseClient.ts` lê `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` sem quebrar quando as variáveis ainda não existem.

Crie um `.env.local` a partir do `.env.example` para rodar com Supabase localmente.

Para criar as tabelas da Jornada do Novo Testamento, rode no SQL Editor do Supabase:

```text
supabase/new-testament-journey.sql
```

O seed inicial usa apenas referências e conteúdo temporário próprio, sem texto bíblico com direitos autorais restritos.

## Próximos Passos

- Criar desafios reais por data litúrgica.
- Adicionar ranking global e ranking por grupo/paróquia.
- Criar painel administrativo para cadastrar leituras, perguntas e palavras.
- Melhorar SEO, metadados sociais e páginas compartilháveis.
