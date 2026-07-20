---
name: estrutura-projeto
description: Documentação viva do app-sports — visão, stack, estrutura de pastas, convenções e roadmap. Carregue no início de qualquer sessão de trabalho neste projeto, ou quando precisar entender onde algo mora ou como as coisas se encaixam.
---

# app-sports — Estrutura do Projeto

Documento de referência do projeto. **Mantenha atualizado**: sempre que a arquitetura,
o stack ou o roadmap mudarem, edite este arquivo na mesma tarefa.

## ▶️ Onde paramos (retomar aqui) — pausa em 2026-07-20

**Tudo publicado e funcionando no PWA real** (não só local):
https://djgabrielribeiro865.github.io/app-sports/ — ver plano da semana, marcar como
feito, login com Google, perfis + RLS seguros, app "cru" sem barra do Expo, e o
**agente Gemini já integrado** (edge function `generate-plan` publicada e ligada ao
botão "Gerar plano da semana" no app). Tudo commitado e no GitHub (branch `main`, limpo).

**Pendência conhecida:** a geração real com o Gemini ainda **não teve um teste de
sucesso confirmado**. No único teste feito, a chave de API deu erro `429
RESOURCE_EXHAUSTED` ("prepayment credits are depleted") — problema de billing do
projeto Google Cloud vinculado à chave, não bug de código (auth → edge function → RLS
→ chamada ao Gemini funcionaram, só a resposta do Gemini falhou). O Gabriel já
regularizou o pagamento na chave atual, mas **pediu para adiar o primeiro teste real
para mais adiante** — retomar por aí: clicar em "Gerar plano da semana" no PWA e
conferir se os 7 treinos aparecem. Se falhar de novo, checar `resultadoGemini.debug`
reintroduzindo temporariamente o modo debug (ver Notas do agente Gemini abaixo).

**Depois disso, os passos que faltam:** histórico/estatísticas; convidar a esposa
(adicionar o e-mail dela como "usuário de teste" no Google Cloud Console antes dela
logar, já que o app OAuth ainda está em modo de teste).

**Para retomar o desenvolvimento local (opcional — o Gabriel usa o PWA publicado):**
`npx expo start --web` (abre em http://localhost:8081). Reiniciar sempre que mudar
`.env`, instalar pacote ou mexer em `app.json`/`app.config.js`.

## Contexto humano importante

- O dono (Gabriel) **nunca programou**. Escreva 100% do código, explique cada passo em
  linguagem simples, sem jargão, um passo de cada vez. Ele copia/cola comandos e reporta
  o resultado. Complexidade de implementação é problema do assistente, não dele.
- App de uso pessoal do **casal** (Gabriel e esposa). Idioma da interface: **português**.

## Visão

App de gestão esportiva pessoal. **Primeiro esporte: corrida.** Interface inspirada no
app **Runna** (comprado pela Strava). Três peças que conversam:

1. **App mobile (PWA)** — telas de treinos, marcar como feito, histórico.
2. **Banco de dados na nuvem (Supabase)** — guarda os dados e sincroniza os dois celulares.
3. **Agente Gemini** — gera/atualiza a rotina semanal de corrida e grava no banco.

## Stack

| Camada | Tecnologia | Observação |
|---|---|---|
| App | **Expo (React Native)** ~57, roteador `expo-router` | Um código → iPhone, Android e web |
| Distribuição inicial | **PWA** (web) | `npx expo start --web`. Porta aberta pro nativo depois (ex: GPS de corrida) |
| Linguagem | **TypeScript** | Alias de import `@/` → `src/` |
| Banco/Auth | **Supabase** (planejado) | Grátis. Sincroniza os dois celulares |
| IA | **Google Gemini** (conta Pro do Gabriel) | Agente gera plano semanal. Modo: sob demanda + conversacional |

## Estrutura de pastas

```
src/
  app/                 # As TELAS (cada arquivo = uma rota, via expo-router)
    _layout.tsx        # Layout raiz: ThemeProvider + AuthProvider + Porteiro (login/app via <Slot/>)
    index.tsx          # Única tela hoje: "Plano da semana" (lê do Supabase)
  components/          # Peças reutilizáveis de UI
    login-screen.tsx   # Tela de login (botão Entrar com Google)
    themed-text.tsx    # <ThemedText type="..."> — todo texto passa por aqui
    themed-view.tsx    # <ThemedView type="..."> — containers com cor de tema
    ...                # animated-icon, hint-row, external-link, web-badge, ui/collapsible
  constants/
    theme.ts           # Cores (claro/escuro), Fonts, Spacing, larguras. FONTE DA VERDADE de estilo
  hooks/
    use-theme.ts       # Retorna as cores do tema atual (claro/escuro)
    use-color-scheme.ts
  global.css           # CSS base (web)
assets/images/         # Ícones, splash, ícones das abas (tabIcons/)
app.json               # Config do Expo (nome, ícones, plugins, web output=static)
package.json           # Dependências e scripts
```

Arquivos `*.web.tsx` são variantes só-web de um componente (o Expo escolhe automaticamente
a versão certa por plataforma).

## Convenções de estilo (importante seguir)

- **Nunca** hardcode cores ou tamanhos. Use `Colors`, `Spacing`, `Fonts` de `@/constants/theme`.
- Todo texto: `<ThemedText type="title|subtitle|default|small|smallBold|code|...">`.
  Cor secundária: `themeColor="textSecondary"`.
- Containers com fundo de tema: `<ThemedView type="backgroundElement">` (cartões, etc.).
- Espaçamento pela escala `Spacing` (half=2, one=4, two=8, three=16, four=24, five=32, six=64).
- App é **light/dark automático** (segue o sistema). Sempre pense nas duas versões.

## Navegação

- **Sem barra de navegação** (app "cru", pedido do Gabriel). O `_layout.tsx` renderiza `<Slot/>`
  quando logado, que mostra a rota atual. Hoje só existe `index`.
- A barra do template Expo (`app-tabs*.tsx`, "Expo Starter"/Home/Explore/Docs) e a tela `explore`
  foram REMOVIDAS.
- Adicionar tela nova = criar `src/app/nome.tsx`. Quando houver mais de uma tela e quisermos
  navegação, dá pra introduzir um menu/abas limpo (sem marca Expo).

## GitHub / versionamento

- Repo privado: **https://github.com/djgabrielribeiro865/app-sports** (remote `origin`, branch `main`).
- **Workflow combinado com o Gabriel: a cada atualização/feature, fazer `git commit` + `git push`.**
  Isso prepara o terreno pra publicação automática do PWA. Mensagens de commit em português.
- `.env` e `.claude/settings.local.json` são gitignored — nunca versionar.

## Como rodar (dev)

```bash
npx expo start --web     # abre em http://localhost:8081 (PWA/navegador)
# npx expo start         # + QR code pra testar no celular com o app "Expo Go"
```

## Estado atual (atualize conforme evolui)

- [x] App Expo criado e rodando na web
- [x] Tela "Plano da semana" de corrida (`src/app/index.tsx`)
- [x] Banco de dados Supabase: conta + tabelas (`profiles`, `workouts`) + conexão
- [x] App LÊ os treinos da semana direto do banco (query em `index.tsx`)
- [x] Marcar treino como feito — ESCREVE no banco (toggle `concluido` + progresso no topo)
- [x] Login com Google (Supabase Auth) + porteiro (login vs app) + botão Sair
- [x] Perfis por usuário + RLS seguro (cada um vê/mexe só no seu, via `auth.uid()`)
- [x] Publicar como PWA no GitHub Pages — NO AR em https://djgabrielribeiro865.github.io/app-sports/ (deploy automático funcionando)
- [x] App "cru" sem barra do Expo (removida a navegação/template padrão)
- [x] Agente Gemini — edge function publicada + UI pronta; geração real ainda sem teste de sucesso confirmado ← **retomar aqui**
- [ ] Histórico + estatísticas
- [ ] Convidar a esposa (adicionar e-mail como usuário de teste no Google Cloud Console)

### Notas de auth
- Google OAuth: client no Google Cloud (projeto `app-sports-503000`), provider Google habilitado no Supabase.
- Redirect URLs liberados no Supabase: `http://localhost:8081/**` e `https://djgabrielribeiro865.github.io/app-sports/**`. Site URL = a do Pages.
- `src/lib/auth.tsx` = AuthProvider (sessão + upsert de perfil no login). `src/components/login-screen.tsx` = tela de login. Porteiro em `src/app/_layout.tsx`.
- `detectSessionInUrl: true` (captura o retorno OAuth na web).
- Usuário de teste no consent screen do Google: adicionar o e-mail de cada pessoa que for logar (esposa ainda não logou).
- Gabriel uid = `1dc91e1b-1d06-4c93-bc02-64893c6962a0`.

### Notas técnicas do que já foi feito
- `app.json` → `web.output = "single"` (SPA, renderiza no navegador; necessário pro Supabase funcionar na web).
- Conexão em `src/lib/supabase.ts`; credenciais em `.env` (vars `EXPO_PUBLIC_SUPABASE_URL` / `_ANON_KEY`), que é gitignored.
- SQL das tabelas + seed documentado em `db/01_schema_e_seed.sql`.
- RLS com políticas TEMPORÁRIAS "acesso total" (`temp_acesso_total_*`) — trocar por regras por-usuário quando entrar o login.
- Reiniciar o servidor (`npx expo start --web`) sempre que mudar `.env`, instalar pacote ou mexer em `app.json`.

### Agente Gemini (geração do plano)
- Código: `supabase/functions/generate-plan/index.ts` (Supabase Edge Function, Deno).
- Fluxo: app chama `supabase.functions.invoke('generate-plan', { body: { instrucoes } })`
  (JWT do usuário vai junto automaticamente) → a função cria um client Supabase
  "como o usuário" (Authorization forwarded) → chama a API do Gemini
  (`gemini-2.5-flash`, `generationConfig.responseSchema` força JSON estruturado) →
  apaga os treinos antigos da semana atual e insere os novos, respeitando a RLS
  (não usa service_role — só a identidade do próprio usuário).
- A função sempre responde HTTP 200 com `{ treinos: [...] }` ou `{ error: "..." }` —
  decisão deliberada pra evitar lidar com `FunctionsHttpError`/`error.context` no
  client (simplicidade > pureza HTTP aqui).
- Segredo `GEMINI_API_KEY` guardado via `npx supabase secrets set` — nunca no código
  nem no `.env` do app (senão vazaria no bundle público do PWA).
- Deploy da função: `npx supabase functions deploy generate-plan` (não precisa Docker
  rodando, apesar do aviso). CLI conectado via `npx supabase login --token ...` +
  `npx supabase link --project-ref bxwbghyumajjhzotscyu`.
- UI: cartão "🤖 Agente de treinos" em `src/app/index.tsx` (campo de instruções opcional
  + botão "Gerar plano da semana"/"Gerar novo plano da semana").
- **Debug**: essa versão do `supabase` CLI não tem `functions logs`. Pra depurar erros do
  Gemini, reintroduzir temporariamente o campo `debug` na resposta de erro (já foi feito
  uma vez — ver histórico do git em `supabase/functions/generate-plan/index.ts`) e
  remover de novo depois de resolver.
- Erro já visto: `429 RESOURCE_EXHAUSTED` / "prepayment credits are depleted" — billing
  do projeto Google Cloud da chave, não bug nosso. Resolvido pelo Gabriel regularizando
  o pagamento; geração real ainda sem teste de sucesso confirmado.

### Publicação (GitHub Pages)
- Repo é **público** (GitHub Pages grátis exige repo público). URL do app: **https://djgabrielribeiro865.github.io/app-sports/**.
- Pages configurado no modo "GitHub Actions" (`gh api ... /pages -f build_type=workflow`).
- Deploy automático a cada push via `.github/workflows/deploy.yml` (exporta web com `EXPO_BASE_URL=/app-sports`, adiciona `.nojekyll` e `404.html`, publica).
- `app.config.js` aplica o baseUrl só quando `EXPO_BASE_URL` existe → dev local segue na raiz.
- A chave anon do Supabase fica no workflow (pública por natureza; ok mesmo com repo público). **Reforçar RLS/login antes de considerar os dados protegidos.**
- Push de workflows exigiu escopo `workflow` no token do `gh` (`gh auth refresh -s workflow`).

## Roadmap (o que falta)

1. **Confirmar o primeiro plano gerado com sucesso pelo Gemini** (retomar aqui).
2. Histórico + estatísticas.
3. Convidar a esposa (perfil dela, usuário de teste no Google Cloud Console).

## Memória relacionada

Ver memórias do assistente: `user-never-programmed`, `project-app-sports`.
