-- ============================================================
-- app-sports · Reset dos treinos (início da v2 "limpa")
-- Rodar no painel do Supabase: SQL Editor → New query → colar → Run
--
-- Apaga TODOS os treinos (de todos os perfis) — plano da semana,
-- histórico e estatísticas voltam a ficar vazios.
-- NÃO mexe em: profiles (login/perfis continuam intactos),
-- políticas de RLS, nem em nenhuma outra configuração.
-- ============================================================

truncate table public.workouts;
