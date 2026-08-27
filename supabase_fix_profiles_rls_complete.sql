-- Dasy独狼点歌台 · 完整修复 profiles 表 RLS 策略
-- 解决问题：new row violates row-level security policy for table "profiles"

-- 1. 确保 RLS 已启用
alter table public.profiles enable row level security;

-- 2. 删除所有现有策略（从头创建）
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_self" on public.profiles;
drop policy if exists "profiles_update_self" on public.profiles;
drop policy if exists "profiles_delete_self" on public.profiles;

-- 3. 创建完整的 RLS 策略

-- SELECT：用户只能查看自己的 profile
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

-- INSERT：用户只能插入自己的 profile
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

-- UPDATE：用户只能更新自己的 profile
create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- DELETE：用户只能删除自己的 profile
create policy "profiles_delete_self"
  on public.profiles for delete
  using (auth.uid() = id);

-- 4. 验证策略
-- select schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check from pg_policies where tablename = 'profiles';
