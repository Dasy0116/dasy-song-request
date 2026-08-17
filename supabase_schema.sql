-- Dasy独狼点歌台 · 用户体系数据库脚本
-- 在 Supabase Dashboard → SQL Editor 中执行整段脚本即可

-- ============ 1. profiles 表（用户昵称等扩展信息） ============
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text,
  created_at timestamptz default now()
);

-- ============ 2. my_history 表（点歌历史，云端同步） ============
create table if not exists public.my_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id int not null,
  song_title text not null,
  song_artist text not null,
  nickname text,
  message text,
  supabase_request_id text,
  created_at timestamptz default now()
);

create index if not exists idx_my_history_user_id on public.my_history(user_id);
create index if not exists idx_my_history_created_at on public.my_history(created_at desc);

-- ============ 3. favorites 表（收藏歌曲） ============
create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  song_id int not null,
  created_at timestamptz default now(),
  unique(user_id, song_id)
);

create index if not exists idx_favorites_user_id on public.favorites(user_id);

-- ============ 4. 注册时自动创建 profile 的触发器 ============
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, split_part(new.email, '@', 1))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ 5. RLS 策略（行级安全） ============

-- profiles：用户只能读取/更新自己的资料
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_self" on public.profiles;
create policy "profiles_select_self"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- my_history：用户只能 CRUD 自己的记录
alter table public.my_history enable row level security;

drop policy if exists "my_history_select_self" on public.my_history;
create policy "my_history_select_self"
  on public.my_history for select
  using (auth.uid() = user_id);

drop policy if exists "my_history_insert_self" on public.my_history;
create policy "my_history_insert_self"
  on public.my_history for insert
  with check (auth.uid() = user_id);

drop policy if exists "my_history_update_self" on public.my_history;
create policy "my_history_update_self"
  on public.my_history for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "my_history_delete_self" on public.my_history;
create policy "my_history_delete_self"
  on public.my_history for delete
  using (auth.uid() = user_id);

-- favorites：用户只能 CRUD 自己的收藏
alter table public.favorites enable row level security;

drop policy if exists "favorites_select_self" on public.favorites;
create policy "favorites_select_self"
  on public.favorites for select
  using (auth.uid() = user_id);

drop policy if exists "favorites_insert_self" on public.favorites;
create policy "favorites_insert_self"
  on public.favorites for insert
  with check (auth.uid() = user_id);

drop policy if exists "favorites_delete_self" on public.favorites;
create policy "favorites_delete_self"
  on public.favorites for delete
  using (auth.uid() = user_id);

-- ============ 6. 现有 song_requests 表：允许登录用户带 user_id（可选字段） ============
-- 添加 user_id 字段（可选，用于关联点歌记录和用户）
alter table public.song_requests add column if not exists user_id uuid references auth.users(id) on delete set null;
