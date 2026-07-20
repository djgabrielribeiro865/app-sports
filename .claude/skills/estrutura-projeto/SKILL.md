---
name: estrutura-projeto
description: Documentação viva do app-sports — visão, stack, estrutura de pastas, convenções e roadmap. Carregue no início de qualquer sessão de trabalho neste projeto, ou quando precisar entender onde algo mora ou como as coisas se encaixam.
---

# app-sports — Estrutura do Projeto

Documento de referência do projeto. **Mantenha atualizado**: sempre que a arquitetura,
o stack ou o roadmap mudarem, edite este arquivo na mesma tarefa.

## ▶️ Onde paramos (retomar aqui) — pausa em 2026-07-20

**Tudo publicado e funcionando no PWA real**: https://djgabrielribeiro865.github.io/app-sports/
— plano da semana, marcar como feito, login com Google, perfis + RLS seguros, e
**navegação em gaveta (drawer) com 5 telas: Plano da semana, Perfil, Agente de treinos
(gerar plano via Gemini), Histórico e Estatísticas** (com gráficos). Tudo commitado e
no GitHub (branch `main`, limpo).

**A esposa já testou o login com a própria conta Google, com sucesso** — confirma que
os perfis separados e a RLS por-usuário funcionam na prática (cada um vê só o seu
plano).

**Banco de treinos foi resetado** (pedido do Gabriel, `db/03_reset_workouts.sql`) pra
começar a v2 do zero, sem dados de exemplo. Perfis/login/configurações ficaram intactos.

**Agente Gemini agora usa o Perfil do atleta** (`db/04_perfil_atleta.sql` +
`src/app/(drawer)/perfil.tsx`): nível, objetivo, dias disponíveis pra treinar, meta de
prova+data e restrições/lesões — tudo isso é lido pela edge function e injetado no
prompt (ver seção "Agente Gemini" abaixo pros detalhes de como cada campo é usado).
**Pendência conhecida:** a geração real com o Gemini ainda **não teve um teste de
sucesso confirmado** (billing da chave já foi resolvido; o Gabriel pediu pra testar
mais pra frente). Ao retomar: preencher o Perfil de cada um (Gabriel e esposa) e gerar
um plano pra ver o resultado. Se falhar, checar `resultadoGemini.debug` reintroduzindo
temporariamente o modo debug (ver Notas do agente Gemini abaixo).

**Depois disso, o roadmap original está completo.** Próximos passos seriam iniciativa
livre: refinar Estatísticas (mais métricas), outro esporte além de corrida, notificações,
etc. — perguntar ao Gabriel o que ele quer em seguida.

**Itens de manutenção em aberto (não bloqueantes):** trocar/revogar o token de acesso
do Supabase e a chave do Gemini que apareceram em texto puro no chat durante a
configuração (por precaução).

**⚠️ Workflow de teste mudou:** o Gabriel pediu pra ser o próprio QA — **nunca rodar o
servidor local (`expo start`) nem testar via browser automation** por conta própria.
Depois de mudar código: `npx tsc --noEmit` + `npx expo export -p web` (só pra validar
que compila) → commit + push (dispara publicação automática) → avisar que está no ar
e deixar o Gabriel testar manualmente. Ver seção "Como rodar (dev) e workflow de teste"
mais abaixo.

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
| Banco/Auth | **Supabase** | Grátis. Sincroniza os dois celulares. Auth via Google OAuth |
| IA | **Google Gemini** (`gemini-2.5-flash` via API) | Agente gera plano semanal, rodando numa Edge Function. Modo: sob demanda + conversacional |

## Estrutura de pastas

```
src/
  app/                    # As TELAS (cada arquivo = uma rota, via expo-router)
    _layout.tsx           # Layout raiz: ThemeProvider + GestureHandlerRootView + AuthProvider
                           # + Porteiro (login vs <Slot/>, que renderiza o grupo (drawer))
    (drawer)/              # Grupo de rotas com navegação em gaveta (não aparece na URL)
      _layout.tsx          # <Drawer> do expo-router/drawer: hambúrguer, overlay, drawerContent custom
      index.tsx             # "Plano da semana" (rota "/") — só o plano: ver + marcar como feito
      perfil.tsx              # "Perfil" (rota "/perfil") — nível, objetivo, dias disponíveis, meta, restrições
      agente.tsx                # "Agente de treinos" (rota "/agente") — gerar plano via Gemini
      historico.tsx               # "Histórico" (rota "/historico") — semanas passadas, cards expansíveis
      estatisticas.tsx              # "Estatísticas" (rota "/estatisticas") — KPIs + gráficos
  components/             # Peças reutilizáveis de UI
    drawer-content.tsx     # Conteúdo customizado da gaveta: avatar+nome, 4 itens de navegação
                           # + seção de conta (Perfil com badge, Sair) separada no rodapé
    treino-card.tsx         # <TreinoCard> — usado em "Plano da semana" e "Histórico"
    donut-chart.tsx          # Anel de progresso (SVG) — usado nas Estatísticas
    login-screen.tsx       # Tela de login (botão Entrar com Google)
    themed-text.tsx        # <ThemedText type="..."> — todo texto passa por aqui
    themed-view.tsx        # <ThemedView type="..."> — containers com cor de tema
    ...                    # animated-icon, hint-row, external-link, web-badge, ui/collapsible
  constants/
    theme.ts              # Colors (claro/escuro), Accent (verde/azul/cinza), Fonts, Spacing.
                           # FONTE DA VERDADE de estilo
  lib/
    treinos.ts             # Tipo Treino, DIAS, helpers de data (semana/formatação),
                           # atualizarConclusao() — compartilhado entre as telas de treino
    perfil.ts               # Tipo PerfilAtleta, DIAS_SEMANA, buscarPerfil()/salvarPerfil()
    auth.tsx                  # AuthProvider (sessão + Perfil + perfilCompleto + recarregarPerfil)
    supabase.ts                # Cliente do Supabase
  hooks/
    use-theme.ts           # Retorna as cores do tema atual (claro/escuro)
    use-color-scheme.ts
  global.css               # CSS base (web)
supabase/functions/       # Edge Functions (rodam no servidor, runtime Deno — fora do tsconfig do app)
  generate-plan/index.ts   # Agente Gemini
assets/images/            # Ícones, splash
app.json                  # Config do Expo (nome, ícones, plugins, web output=single)
app.config.js              # Aplica EXPO_BASE_URL só na publicação (dev local fica na raiz)
package.json               # Dependências e scripts
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

- **Gaveta (drawer) com hambúrguer**, pedido explícito do Gabriel: ícone ☰ no canto
  superior esquerdo abre um menu que desliza **por cima** do conteúdo (`drawerType: 'front'`)
  e **fecha automaticamente** ao escolher uma aba.
- Implementado com `expo-router/drawer` (grupo de rotas `src/app/(drawer)/`). Requer
  `GestureHandlerRootView` envolvendo o app (está em `src/app/_layout.tsx`).
- `drawerContent` é **customizado** (`src/components/drawer-content.tsx`, não o padrão do
  React Navigation): mostra avatar (inicial do nome) + nome completo no topo, os 4 itens
  de navegação (`ITENS` — Plano da semana, Agente de treinos, Histórico, Estatísticas)
  com emoji + destaque no ativo. **Perfil e Sair ficam numa seção separada no rodapé**
  (abaixo de uma linha divisória), pedido do Gabriel pra distinguir "navegação" de
  "conta". "Perfil" ganha um ponto vermelho (badge) quando `!perfilCompleto`. Ao tocar
  num item, chama `navigation.navigate(rota)` + `navigation.closeDrawer()` explicitamente.
- ⚠️ **Rotas tipadas ficam desatualizadas**: `.expo/types/router.d.ts` (gerado, gitignored)
  só é regenerado pelo servidor dev interativo (`expo start`), que **não rodamos mais**
  (ver regra de teste abaixo). `npx expo export` NÃO regenera esse arquivo. Resultado:
  `router.push('/rota-nova')` para uma tela recém-criada dá erro de tipo no `tsc` mesmo
  a rota existindo e funcionando de verdade. Solução usada: `router.push('/rota' as any)`
  com um comentário explicando o motivo (ver `src/app/(drawer)/index.tsx`). Não afeta o
  build/deploy real (o workflow não roda `tsc`, só `expo export`).
- Cabeçalho do Drawer (`screenOptions` em `(drawer)/_layout.tsx`) fica minimalista:
  só o hambúrguer, sem título (cada tela já mostra seu próprio título grande como conteúdo).
- ⚠️ **Import da tipagem**: usar `DrawerContentComponentProps` de `expo-router/drawer`
  (não de `@react-navigation/drawer` diretamente) — os tipos não são intercambiáveis
  (erro de branded type no TS) mesmo sendo estruturalmente iguais em runtime.
- Adicionar tela nova = criar `src/app/(drawer)/nome.tsx` + um item em `ITENS` no
  `drawer-content.tsx`.

## GitHub / versionamento

- Repo privado: **https://github.com/djgabrielribeiro865/app-sports** (remote `origin`, branch `main`).
- **Workflow combinado com o Gabriel: a cada atualização/feature, fazer `git commit` + `git push`.**
  Isso prepara o terreno pra publicação automática do PWA. Mensagens de commit em português.
- `.env` e `.claude/settings.local.json` são gitignored — nunca versionar.

## Como rodar (dev) e workflow de teste

```bash
npx expo start --web     # abre em http://localhost:8081 (PWA/navegador)
# npx expo start         # + QR code pra testar no celular com o app "Expo Go"
```

⚠️ **Regra combinada com o Gabriel: NÃO rodar o servidor local nem testar via browser
automation (nem local nem no PWA publicado) por conta própria.** Ele é o QA — testa
manualmente o PWA publicado e avisa se algo quebrar. O fluxo correto após uma mudança é:
`npx tsc --noEmit` (checar tipos) → `npx expo export -p web` se quiser validar que
compila → commit + push (dispara a publicação automática) → avisar que está no ar.
Só usar o servidor local ou abrir o navegador se o Gabriel pedir explicitamente ou
reportar um bug específico que precise ser reproduzido.

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
- [x] Esposa testou o login com a própria conta Google — sucesso (perfis/RLS separados confirmados na prática)
- [x] Navegação em gaveta (drawer) com hambúrguer, overlay, fecha ao escolher
- [x] Tela Histórico — semanas passadas agrupadas, cards expansíveis, marcar/desmarcar retroativo
- [x] Tela Estatísticas — km percorridos, sequência (streak), taxa de conclusão (donut), km por semana (barras)
- [x] "Agente de treinos" virou tela própria no menu (antes era um cartão dentro do Plano da semana)
- [x] Tela Perfil — nível, objetivo, dias disponíveis, meta de prova+data, restrições/lesões
- [x] Agente Gemini lê o Perfil e injeta no prompt (nível, dias disponíveis viram regra
      obrigatória de treino/descanso, meta de prova com prazo calculado, restrições)
- [x] Banco de treinos resetado (v2 limpa, sem dados de exemplo) — perfis/login intactos

### Notas de auth
- Google OAuth: client no Google Cloud (projeto `app-sports-503000`), provider Google habilitado no Supabase.
- Redirect URLs liberados no Supabase: `http://localhost:8081/**` e `https://djgabrielribeiro865.github.io/app-sports/**`. Site URL = a do Pages.
- `src/lib/auth.tsx` = AuthProvider (sessão + upsert de perfil no login). `src/components/login-screen.tsx` = tela de login. Porteiro em `src/app/_layout.tsx`.
- `detectSessionInUrl: true` (captura o retorno OAuth na web).
- Usuário de teste no consent screen do Google: adicionar o e-mail de cada pessoa que for logar. Gabriel e esposa já testaram login com sucesso.
- Gabriel uid = `1dc91e1b-1d06-4c93-bc02-64893c6962a0`.

### Perfil do atleta e "aviso de perfil incompleto"
- Campos em `profiles`: `nivel`, `objetivo`, `dias_disponiveis` (text[]), `meta_prova`,
  `meta_data`, `restricoes` (`db/04_perfil_atleta.sql`). Tela: `src/app/(drawer)/perfil.tsx`.
- `src/lib/perfil.ts`: tipo `PerfilAtleta`, `DIAS_SEMANA`, `buscarPerfil()`, `salvarPerfil()`
  e `perfilEstaCompleto()` — essa função é a fonte única de verdade sobre o que conta
  como "obrigatório" (hoje: `nivel`, `objetivo`, `dias_disponiveis`; `meta_prova`/
  `meta_data`/`restricoes` são opcionais). **Se adicionar um campo obrigatório novo no
  futuro, só incluir na lista `CAMPOS_OBRIGATORIOS` dentro de `perfil.ts` — o aviso pra
  completar volta a aparecer sozinho pra quem não preencheu, sem precisar mexer em mais nada.**
- `AuthProvider` (`src/lib/auth.tsx`) carrega o Perfil junto com a sessão e expõe
  `perfil`, `perfilCompleto` (booleano já calculado) e `recarregarPerfil()` via `useAuth()`.
  A tela de Perfil chama `recarregarPerfil()` depois de salvar, pra badge/aviso
  atualizarem em tempo real em qualquer tela, sem precisar recarregar o app.
- Onde o aviso aparece quando `!perfilCompleto`: ponto vermelho no item "Perfil" da
  gaveta (`drawer-content.tsx`), e um cartão "💡 Complete seu Perfil" no topo do Plano
  da semana e no topo do Agente de treinos — ambos somem sozinhos assim que fica completo.

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
  "como o usuário" (Authorization forwarded) → busca o **Perfil** do usuário
  (`profiles`: nivel, objetivo, dias_disponiveis, meta_prova, meta_data, restricoes) →
  chama a API do Gemini (`gemini-2.5-flash`, `generationConfig.responseSchema` força
  JSON estruturado) → apaga os treinos antigos da semana atual e insere os novos,
  respeitando a RLS (não usa service_role — só a identidade do próprio usuário).
- **Perfil no prompt** (`montarPrompt` em `supabase/functions/generate-plan/index.ts`):
  - `nivel` → linha "Nível do atleta: X" (calibra intensidade/volume).
  - `objetivo` e `restricoes` → citados literalmente entre aspas no prompt.
  - `meta_prova` + `meta_data` → calcula semanas restantes (`hoje` = segunda-feira da
    semana atual) e pede periodização gradual rumo à meta.
  - `dias_disponiveis` (array de chaves tipo `'segunda'`, `'sabado'`) → vira **regra
    obrigatória**: como os 7 dias gerados são sempre sequenciais a partir da segunda
    (posição 1 = segunda, ..., posição 7 = domingo), a função já sabe exatamente quais
    posições são "disponível" vs "indisponível" sem precisar que o Gemini calcule nada —
    só lista os dias disponíveis/indisponíveis por nome e manda os indisponíveis serem
    sempre "Descanso". Todos os campos são opcionais; sem perfil preenchido, o prompt
    cai de volta pro comportamento genérico de antes.
- A função sempre responde HTTP 200 com `{ treinos: [...] }` ou `{ error: "..." }` —
  decisão deliberada pra evitar lidar com `FunctionsHttpError`/`error.context` no
  client (simplicidade > pureza HTTP aqui).
- Segredo `GEMINI_API_KEY` guardado via `npx supabase secrets set` — nunca no código
  nem no `.env` do app (senão vazaria no bundle público do PWA).
- Deploy da função: `npx supabase functions deploy generate-plan` (não precisa Docker
  rodando, apesar do aviso). CLI conectado via `npx supabase login --token ...` +
  `npx supabase link --project-ref bxwbghyumajjhzotscyu`.
- UI: tela própria `src/app/(drawer)/agente.tsx` (acessível pelo menu lateral), com
  campo de instruções opcional + botão "Gerar plano da semana". Ao concluir com sucesso,
  navega de volta pra "Plano da semana" (`router.push('/')`) pra ver o resultado.
- **Debug**: essa versão do `supabase` CLI não tem `functions logs`. Pra depurar erros do
  Gemini, reintroduzir temporariamente o campo `debug` na resposta de erro (já foi feito
  uma vez — ver histórico do git em `supabase/functions/generate-plan/index.ts`) e
  remover de novo depois de resolver.
- Erro já visto: `429 RESOURCE_EXHAUSTED` / "prepayment credits are depleted" — billing
  do projeto Google Cloud da chave, não bug nosso. Resolvido pelo Gabriel regularizando
  o pagamento; geração real ainda sem teste de sucesso confirmado.

### Histórico e Estatísticas — decisões de cálculo
- **Histórico**: busca treinos com `data < segunda-feira atual` (semana em curso fica só
  no Plano da semana, sem duplicar). Agrupa por semana via `segundaDaData()`, mais recente
  primeiro. Cada card expande/recolhe (estado local `semanaAberta`, um de cada vez).
- **Estatísticas**: busca TODOS os treinos (sem filtro de data).
  - *Km percorridos* = soma de `distancia_km` só dos treinos **concluídos** (km real, não planejado).
  - *Taxa de conclusão* = concluídos ÷ total, mas só entre corridas com `data <= hoje`
    (não penaliza treinos futuros que ainda não tiveram chance de acontecer).
  - *Sequência (streak)* = nº de semanas consecutivas (mais recente pra trás) **já
    encerradas** (domingo < hoje) em que TODOS os treinos de corrida planejados foram
    concluídos. Semanas sem nenhuma corrida planejada são puladas (não contam nem quebram).
  - *Gráfico km por semana* = últimas 8 semanas, km **concluídos** (não planejados).
  - Se não houver corridas passadas / km > 0, os cards de donut/gráfico ficam ocultos
    (evita mostrar um gráfico vazio ou 0/0 sem sentido).
- `DonutChart` (`src/components/donut-chart.tsx`) usa `react-native-svg`. ⚠️ Para girar o
  arco, usar `transform={`rotate(-90 cx cy)`}` no `<Circle>` — **não** usar as props
  `rotation`/`origin` do react-native-svg, elas geram um atributo `transform-origin` que o
  React acusa como "Invalid DOM property" no build web (bug já visto e corrigido).
- O gráfico de barras (km por semana) é feito com `View`s simples (sem SVG) — barras
  crescem por `height` percentual dentro de uma "trilho" de altura fixa.

### Publicação (GitHub Pages)
- Repo é **público** (GitHub Pages grátis exige repo público). URL do app: **https://djgabrielribeiro865.github.io/app-sports/**.
- Pages configurado no modo "GitHub Actions" (`gh api ... /pages -f build_type=workflow`).
- Deploy automático a cada push via `.github/workflows/deploy.yml` (exporta web com `EXPO_BASE_URL=/app-sports`, adiciona `.nojekyll` e `404.html`, publica).
- `app.config.js` aplica o baseUrl só quando `EXPO_BASE_URL` existe → dev local segue na raiz.
- A chave anon do Supabase fica no workflow (pública por natureza; ok mesmo com repo público). **Reforçar RLS/login antes de considerar os dados protegidos.**
- Push de workflows exigiu escopo `workflow` no token do `gh` (`gh auth refresh -s workflow`).

## Roadmap (o que falta)

1. **Confirmar o primeiro plano gerado com sucesso pelo Gemini** (retomar aqui).
2. Daí em diante, o MVP original está completo — próximos passos ficam a critério do
   Gabriel (outro esporte, mais métricas, notificações, etc.).

## Memória relacionada

Ver memórias do assistente: `user-never-programmed`, `project-app-sports`.
