-- ============================================================
-- app-sports · Perfil do atleta (contexto pro agente Gemini)
-- Rodar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================

alter table public.profiles
  add column if not exists nivel text check (nivel in ('iniciante', 'intermediario', 'avancado')),
  add column if not exists objetivo text,
  add column if not exists dias_disponiveis text[],
  add column if not exists meta_prova text,
  add column if not exists meta_data date,
  add column if not exists restricoes text;
