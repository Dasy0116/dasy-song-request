import { create } from "zustand";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface AuthState {
  user: User | null;
  session: Session | null;
  nickname: string | null;
  isLoading: boolean; // 初始化中
  isAuthModalOpen: boolean;
  authError: string | null;
  submitting: boolean;

  init: () => () => void;
  setAuthModalOpen: (open: boolean) => void;
  clearAuthError: () => void;
  signUp: (email: string, password: string, nickname?: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
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
    // 拉取当前 session
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

    // 监听 session 变化
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      set({
        session,
        user: session?.user || null,
        // 切换用户时清掉昵称，再异步重新拉
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

  signUp: async (email, password, nickname) => {
    set({ submitting: true, authError: null });
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: nickname ? { nickname } : undefined,
        },
      });
      if (error) throw error;
      // 如果不需要邮箱验证，会直接返回 session
      if (data.session) {
        set({ session: data.session, user: data.user, isAuthModalOpen: false });
      } else {
        // 需要邮箱验证的情况
        set({
          isAuthModalOpen: false,
          authError: null,
        });
        // 提示用户去验证邮箱
        alert("注册成功！请去邮箱点击验证链接后再次登录。");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "注册失败";
      set({ authError: msg });
      throw err;
    } finally {
      set({ submitting: false });
    }
  },

  signIn: async (email, password) => {
    set({ submitting: true, authError: null });
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
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
      // profiles 没有记录时（理论上有 trigger 自动创建，但兜底用邮箱前缀）
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
    try {
      // upsert：profile 不存在就插入，存在就更新
      const { error } = await supabase
        .from("profiles")
        .upsert({ id: user.id, nickname }, { onConflict: "id" });
      if (error) throw error;
      set({ nickname });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "更新昵称失败";
      console.error(err);
      throw new Error(msg);
    }
  },
}));
