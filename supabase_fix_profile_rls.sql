-- Dasy独狼点歌台 · 修复 profiles 表 RLS 与触发器
-- 解决问题：
--   1. 缺少 insert 策略，导致注册后前端 upsert profile 被拒绝
--      （错误：new row violates row-level security policy for table "profiles"）
--   2. 触发器从 email 前缀取昵称，但 email 前缀现在是 base64url 编码（不可读）
--      应该从 user_metadata.nickname 读取注册时传入的真实昵称
-- 执行方式：在 Supabase Dashboard → SQL Editor 中执行整段脚本

-- ============ 1. 添加 profiles 的 insert 策略（允许用户插入自己的 profile） ============
-- 兜底用：如果触发器没执行，前端 upsert 可以 INSERT 自己的 profile
drop policy if exists "profiles_insert_self" on public.profiles;
create policy "profiles_insert_self"
  on public.profiles for insert
  with check (auth.uid() = id);

-- ============ 2. 更新触发器：从 user_metadata.nickname 读取真实昵称 ============
-- 之前用 split_part(new.email, '@', 1)，但现在 email 前缀是 base64url 编码
-- 改为优先读 new.raw_user_meta_data->>'nickname'，兜底才用 email 前缀
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_nickname text;
begin
  -- 优先从 user_metadata 读真实昵称（注册时 options.data.nickname 传入）
  v_nickname := new.raw_user_meta_data->>'nickname';
  -- 兜底：用 email 前缀（向后兼容老数据，虽然现在是 base64url）
  if v_nickname is null or v_nickname = '' then
    v_nickname := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (id, nickname)
  values (new.id, v_nickname)
  on conflict (id) do update set nickname = excluded.nickname;
  return new;
end;
$$;

-- 触发器已存在（之前脚本创建过），不需要 drop + create
-- 只需要 replace function 即可生效

-- ============ 3. 修复历史脏数据：把 profiles.nickname 是 base64url 的行更新为真实昵称 ============
-- 通过 join auth.users 的 raw_user_meta_data 拿到真实昵称
update public.profiles p
set nickname = u.raw_user_meta_data->>'nickname'
from auth.users u
where p.id = u.id
  and u.raw_user_meta_data->>'nickname' is not null
  and u.raw_user_meta_data->>'nickname' != ''
  and (p.nickname is null or p.nickname = split_part(u.email, '@', 1));

-- ============ 4. 完成提示 ============
-- 执行完后，注册流程会：
--   1. 触发器从 user_metadata 读取真实昵称，写入 profiles.nickname
--   2. 前端 upsert 即使触发器没执行，也能 INSERT（有 insert 策略）
--   3. fetchNickname 优先用 user_metadata.nickname，显示正确
