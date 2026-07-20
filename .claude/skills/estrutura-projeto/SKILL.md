---
name: estrutura-projeto
description: Documentação viva do app-sports — visão, stack, estrutura de pastas, convenções e roadmap. Carregue no início de qualquer sessão de trabalho neste projeto, ou quando precisar entender onde algo mora ou como as coisas se encaixam.
---

# app-sports — Estrutura do Projeto

Documento de referência do projeto. **Mantenha atualizado**: sempre que a arquitetura,
o stack ou o roadmap mudarem, edite este arquivo na mesma tarefa.

## ▶️ Onde paramos (retomar aqui) — pausa em 2026-07-19

**Funcionando de ponta a ponta (local):** app Expo/PWA + Supabase, ver plano da semana,
marcar treino como feito (salva no banco), login com Google, perfis por usuário e RLS
segura (cada um só vê/mexe no seu). Tudo commitado e no GitHub (branch `main`, limpo).

**Pendência conhecida:** publicação do PWA no GitHub Pages ficou **bloqueada por um
incidente do GitHub Actions** (degradação em 2026-07-19). A configuração está 100% pronta;
ao retomar, é só re-disparar o deploy: `gh workflow run deploy.yml` (ou dar um push). URL
final será https://djgabrielribeiro865.github.io/app-sports/. Confirmar no celular depois.

**Próximo passo combinado:** o **agente Gemini** (gerar/ajustar plano da semana). Plano:
1. Chave de API do Gemini via Google AI Studio (faixa grátis; a assinatura "Gemini Pro" do
   consumidor é separada da chave de API).
2. Uma **Supabase Edge Function** (servidor) guarda a chave em segredo e chama o Gemini —
   a chave NUNCA vai pro app/PWA (senão fica exposta no bundle público).
3. No app: botão "Gerar plano da semana" + modo conversacional, que chamam a função e
   gravam os treinos no banco. Modo do agente: sob demanda + conversacional.
Alternativa mais rápida que o usuário pode escolher antes: **histórico/estatísticas**
(não depende de nada externo).

**Para retomar o desenvolvimento local:** `npx expo start --web` (abre em
http://localhost:8081). Reiniciar sempre que mudar `.env`, instalar pacote ou mexer em
`app.json`/`app.config.js`.

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
    _layout.tsx        # Layout raiz: ThemeProvider (claro/escuro) + <AppTabs/>
    index.tsx          # Tela "Home" → hoje é o "Plano da semana" (dados de exemplo fixos)
    explore.tsx        # Tela "Explore" (ainda template padrão do Expo)
  components/          # Peças reutilizáveis de UI
    app-tabs.tsx       # Abas de baixo (NativeTabs). Onde renomear/adicionar abas
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

- Abas de baixo definidas em `src/components/app-tabs.tsx` (`NativeTabs`). Cada `<NativeTabs.Trigger name="X">`
  aponta pra uma tela `src/app/X.tsx`. Hoje: `index` (Home) e `explore`.
- Adicionar tela nova = criar `src/app/nome.tsx` + um `Trigger` em `app-tabs.tsx`.

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
- [~] Publicar como PWA no GitHub Pages (workflow pronto; bloqueado por incidente do GitHub Actions — auto-retry rodando)
- [ ] Agente Gemini gerando o plano  ← **próximo passo**
- [ ] Histórico + estatísticas

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

### Publicação (GitHub Pages)
- Repo é **público** (GitHub Pages grátis exige repo público). URL do app: **https://djgabrielribeiro865.github.io/app-sports/**.
- Pages configurado no modo "GitHub Actions" (`gh api ... /pages -f build_type=workflow`).
- Deploy automático a cada push via `.github/workflows/deploy.yml` (exporta web com `EXPO_BASE_URL=/app-sports`, adiciona `.nojekyll` e `404.html`, publica).
- `app.config.js` aplica o baseUrl só quando `EXPO_BASE_URL` existe → dev local segue na raiz.
- A chave anon do Supabase fica no workflow (pública por natureza; ok mesmo com repo público). **Reforçar RLS/login antes de considerar os dados protegidos.**
- Push de workflows exigiu escopo `workflow` no token do `gh` (`gh auth refresh -s workflow`).

## Roadmap (ordem combinada)

1. Banco de dados (Supabase) — guardar treinos reais e sincronizar os 2 celulares.
2. Perfis separados (login de cada um).
3. Agente Gemini — gerar plano semanal (sob demanda + ajuste conversacional).
4. Marcar treino como feito.
5. Histórico + estatísticas.
6. Publicar o PWA.

## Memória relacionada

Ver memórias do assistente: `user-never-programmed`, `project-app-sports`.
