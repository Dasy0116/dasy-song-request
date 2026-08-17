-- Dasy独狼点歌台 · 用户体系重构脚本
-- 改为「昵称 + 密码」登录，不用真实邮箱
-- 执行前请在 Supabase Dashboard → Authentication → Users 确认所有测试账号可删

-- ============ 1. 清空所有现有用户数据（级联清掉 profiles / my_history / favorites） ============
-- 注意：会删除所有粉丝的云端收藏和历史，但保留 song_requests（主播点歌记录）
delete from public.favorites;
delete from public.my_history;
delete from public.profiles;
-- 清空 auth.users 会触发 on delete cascade 自动清理 profiles
delete from auth.users;

-- ============ 2. profiles 表：给 nickname 加 UNIQUE 约束（双保险，防止重复） ============
-- 先删掉老的唯一约束（如果存在），再加新的
alter table public.profiles drop constraint if exists profiles_nickname_unique;
alter table public.profiles add constraint profiles_nickname_unique unique (nickname);

-- ============ 3. 更新触发器：注册时用 email 前缀（即昵称）作为 profile.nickname ============
-- 因为我们把昵称转成 昵称@dasy.local 存入 auth.users.email，所以 split_part 取前缀正好是昵称
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

-- ============ 4. 确认 RLS 策略已生效（之前的脚本已建过，这里仅验证） ============
-- profiles 的 RLS
alter table public.profiles enable row level security;

-- my_history 的 RLS
alter table public.my_history enable row level security;

-- favorites 的 RLS
alter table public.favorites enable row level security;

-- ============ 5. 完成提示 ============
-- 执行完后请到 Supabase Dashboard → Authentication → Users 确认用户列表为空
-- 前端注册时昵称会被转成 昵称@dasy.local，前端不暴露邮箱字段给用户
