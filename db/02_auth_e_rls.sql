-- ============================================================
-- app-sports · Camada 3: ligar dados ao usuário + segurança real
-- Rodar no Supabase: SQL Editor → New query → colar → Run
-- ============================================================

-- 1. Cria o perfil real do Gabriel (ligado à conta Google).
insert into public.profiles (id, nome) values
  ('1dc91e1b-1d06-4c93-bc02-64893c6962a0', 'Gabriel Budnieswski')
on conflict (id) do nothing;

-- 2. Transfere os treinos de exemplo pro usuário real do Gabriel.
update public.workouts
  set profile_id = '1dc91e1b-1d06-4c93-bc02-64893c6962a0'
  where profile_id = '11111111-1111-1111-1111-111111111111';

-- 3. Remove os perfis falsos antigos.
delete from public.profiles
  where id in ('11111111-1111-1111-1111-111111111111',
               '22222222-2222-2222-2222-222222222222');

-- 4. Troca as regras temporárias por regras seguras.
drop policy if exists temp_acesso_total_profiles on public.profiles;
drop policy if exists temp_acesso_total_workouts on public.workouts;

-- Perfis: cada um lê / cria / edita apenas o próprio.
create policy perfil_proprio_select on public.profiles
  for select using (id = auth.uid());
create policy perfil_proprio_insert on public.profiles
  for insert with check (id = auth.uid());
create policy perfil_proprio_update on public.profiles
  for update using (id = auth.uid()) with check (id = auth.uid());

-- Treinos: cada um vê / cria / edita / apaga apenas os próprios.
create policy treino_proprio_select on public.workouts
  for select using (profile_id = auth.uid());
create policy treino_proprio_insert on public.workouts
  for insert with check (profile_id = auth.uid());
create policy treino_proprio_update on public.workouts
  for update using (profile_id = auth.uid()) with check (profile_id = auth.uid());
create policy treino_proprio_delete on public.workouts
  for delete using (profile_id = auth.uid());
