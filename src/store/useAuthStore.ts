import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

// 虚拟邮箱后缀：用户用昵称登录，内部转成 昵称@dasy.local
// Supabase Auth 默认按 email 唯一性约束，这样昵称自动唯一
const VIRTUAL_EMAIL_DOMAIN = "dasy.local";

/** 把昵称转成虚拟邮箱 */
function nicknameToEmail(nickname: string): string {
  // 去掉首尾空白，转小写，邮箱不区分大小写更稳妥
  return `${nickname.trim().toLowerCase()}@${VIRTUAL_EMAIL_DOMAIN}`;
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

      if (data.session) {
        set({ session: data.session, user: data.user, isAuthModalOpen: false });
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
      // 兜底：从虚拟邮箱前缀取昵称
      const nick =
        (data as { nickname?: string } | null)?.nickname ||
        user.email?.split("@")[0] ||
        "粉丝";
      set({ nickname: nick });
    } catch (err) {
      console.warn("拉取昵称失败:", err);
      set({ nickname: user.email?.split("@")[0] || "粉丝" });
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
