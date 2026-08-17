import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// 虚拟邮箱后缀：用户用昵称登录，内部转成 base64url(昵称)@example.com
// Supabase Auth 默认按 email 唯一性约束，这样昵称自动唯一
// 用 base64url 编码是因为中文/特殊字符不是合法邮箱用户名，会被 Supabase 拒绝
// 用 example.com 是 RFC 2606 保留域名，格式合法不会被 Supabase 邮箱校验拒绝
// 邮箱已禁用验证邮件，example.com 不会真实投递，也不会和真实用户冲突（base64url 前缀唯一）
const VIRTUAL_EMAIL_DOMAIN = "example.com";

/** UTF-8 字符串 -> base64url（仅含 [A-Za-z0-9_-]，合法邮箱用户名） */
function utf8ToBase64url(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let bin = "";
  bytes.forEach((b) => (bin += String.fromCharCode(b)));
  const b64 = btoa(bin);
  return b64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** 把昵称转成虚拟邮箱：base64url(昵称小写)@dasy.local
 *  小写化是为了大小写不敏感（邮箱本地部分本就不区分大小写） */
function nicknameToEmail(nickname: string): string {
  const lower = nickname.trim().toLowerCase();
  return `${utf8ToBase64url(lower)}@${VIRTUAL_EMAIL_DOMAIN}`;
}

interface AuthState {
  user: User | null;
  session: Session | null;
  nickname: string | null;
  isLoading: boolean;
  isAuthModalOpen: boolean;
  authError: string | null;
  submitting: boolean;

  init: () => () => void;
  setAuthModalOpen: (open: boolean) => void;
  clearAuthError: () => void;
  /** 用昵称注册，密码至少 6 位 */
  signUp: (nickname: string, password: string) => Promise<void>;
  /** 用昵称登录 */
  signIn: (nickname: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** 修改昵称（会重建账号邮箱，密码不变） */
  updateNickname: (nickname: string) => Promise<void>;
  fetchNickname: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  session: null,
  nickname: null,
  isLoading: true,
  isAuthModalOpen: false,
  authError: null,
  submitting: false,

  init: () => {
    supabase.auth.getSession().then(({ data }) => {
      set({
        session: data.session,
        user: data.session?.user || null,
        isLoading: false,
      });
      if (data.session?.user) {
        get().fetchNickname();
      }
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      set({
        session,
        user: session?.user || null,
        nickname: session?.user ? get().nickname : null,
      });
      if (session?.user) {
        get().fetchNickname();
      }
    });

    return () => sub.subscription.unsubscribe();
  },

  setAuthModalOpen: (open) => set({ isAuthModalOpen: open, authError: null }),

  clearAuthError: () => set({ authError: null }),

  signUp: async (nickname, password) => {
    set({ submitting: true, authError: null });
    try {
      const trimmed = nickname.trim();
      if (!trimmed) throw new Error("请输入昵称");
      if (password.length < 6) throw new Error("密码至少 6 位");

      const email = nicknameToEmail(trimmed);

      // 先检查 profiles 里是否已有这个昵称（大小写不敏感）
      const { data: existRow, error: checkErr } = await supabase
        .from("profiles")
        .select("id")
        .ilike("nickname", trimmed)
        .maybeSingle();
      if (checkErr) throw checkErr;
      if (existRow) throw new Error("这个昵称已被注册啦，换一个试试~");

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { nickname: trimmed } },
      });
      if (error) {
        // Supabase 已开启"同一邮箱已注册则报错"时直接翻译
        if (error.message.toLowerCase().includes("already registered")) {
          throw new Error("这个昵称已被注册啦，换一个试试~");
        }
        throw error;
      }

      // 触发器写入的 nickname 是 base64url 字符串（不可读），
      // 这里立即把真实昵称覆盖写入 profiles（同时再校验一次唯一性，作为兜底）
      if (data.user) {
        const { error: upErr } = await supabase
          .from("profiles")
          .upsert({ id: data.user.id, nickname: trimmed }, { onConflict: "id" });
        if (upErr) {
          // 唯一约束冲突 = 极小概率的并发竞态
          if (upErr.message.toLowerCase().includes("unique")) {
            // 立即登出这个孤儿账号，让用户重试
            await supabase.auth.signOut();
            throw new Error("这个昵称刚刚被抢注啦，换一个试试~");
          }
          // 其它错误不阻塞流程，只打日志
          console.warn("写入真实昵称失败（不影响注册）:", upErr);
        }
      }

      if (data.session) {
        set({
          session: data.session,
          user: data.user,
          nickname: trimmed,
          isAuthModalOpen: false,
        });
      } else {
        set({ isAuthModalOpen: false });
        alert("注册成功！但 Supabase 未直接返回会话，请重新登录。");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "注册失败";
      set({ authError: msg });
      throw err;
    } finally {
      set({ submitting: false });
    }
  },

  signIn: async (nickname, password) => {
    set({ submitting: true, authError: null });
    try {
      const trimmed = nickname.trim();
      if (!trimmed) throw new Error("请输入昵称");

      const email = nicknameToEmail(trimmed);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        if (error.message.toLowerCase().includes("invalid login")) {
          throw new Error("昵称或密码不对呀~");
        }
        throw error;
      }
      set({
        session: data.session,
        user: data.user,
        isAuthModalOpen: false,
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "登录失败";
      set({ authError: msg });
      throw err;
    } finally {
      set({ submitting: false });
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
    } finally {
      set({ session: null, user: null, nickname: null });
    }
  },

  fetchNickname: async () => {
    const { user } = get();
    if (!user) {
      set({ nickname: null });
      return;
    }
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("nickname")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      // 优先：profiles.nickname（注册时已写入真实昵称）
      // 兜底1：user_metadata.nickname（注册时附带）
      // 兜底2：email 前缀（老数据，base64url 编码，最后才用）
      const metaNick =
        (user.user_metadata as { nickname?: string } | null)?.nickname ||
        undefined;
      const nick =
        (data as { nickname?: string } | null)?.nickname ||
        metaNick ||
        "粉丝";
      set({ nickname: nick });
    } catch (err) {
      console.warn("拉取昵称失败:", err);
      const metaNick =
        (user.user_metadata as { nickname?: string } | null)?.nickname ||
        "粉丝";
      set({ nickname: metaNick });
    }
  },

  updateNickname: async (nickname) => {
    const { user } = get();
    if (!user) throw new Error("未登录");
    const trimmed = nickname.trim();
    if (!trimmed) throw new Error("昵称不能为空");

    // 检查昵称是否已被别人占用
    const { data: existRow, error: checkErr } = await supabase
      .from("profiles")
      .select("id")
      .ilike("nickname", trimmed)
      .neq("id", user.id)
      .maybeSingle();
    if (checkErr) throw checkErr;
    if (existRow) throw new Error("这个昵称已被占用啦，换一个试试~");

    try {
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, nickname: trimmed }, { onConflict: "id" });
      if (error) throw error;
      set({ nickname: trimmed });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "更新昵称失败";
      console.error(err);
      throw new Error(msg);
    }
  },
}));
