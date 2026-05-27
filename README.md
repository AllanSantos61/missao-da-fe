# Missão da Fé

Aplicação web mobile-first com desafios católicos diários: Evangelho, Quiz e Palavra da Fé.

## Tecnologias Usadas

- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- localStorage no MVP
- Camada `services/progressService.ts` preparada para futura troca por Supabase

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
- Evangelho do Dia, Quiz da Fé e Palavra da Fé.
- Palavra da Fé com grade 6x5, teclado virtual, Enter e Backspace físicos.
- Nome do jogador salvo em localStorage, sem login real.
- XP total, XP semanal, streak atual, melhor streak e histórico diário.
- Ranking local da semana usando os dados do próprio usuário.
- Compartilhamento no WhatsApp.

## Preparado para Supabase

O MVP usa `localStorage` por padrão, mas a arquitetura já está separada para uma futura integração com Supabase.

- `services/progressService.ts` centraliza as chamadas usadas pelo app.
- `services/localProgressService.ts` implementa a versão atual em `localStorage`.
- `services/supabaseProgressService.ts` fica reservado para a implementação futura com banco.
- `lib/supabaseClient.ts` lê `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` sem quebrar quando as variáveis ainda não existem.

Crie um `.env.local` a partir do `.env.example` quando for iniciar a integração.

## Próximos Passos

- Integrar Supabase no `progressService`.
- Criar desafios reais por data litúrgica.
- Adicionar ranking global e ranking por grupo/paróquia.
- Criar painel administrativo para cadastrar Evangelho, perguntas e palavras.
- Melhorar SEO, metadados sociais e páginas compartilháveis.
