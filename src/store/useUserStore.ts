import { create } from "zustand";

const STORAGE_KEY = "dasy_nickname";

interface UserStore {
  nickname: string;
  // 是否已初始化（从 localStorage 读取过）
  hydrated: boolean;
  // 欢迎弹窗显示状态（仅首次未设置昵称时自动弹出）
  isWelcomeOpen: boolean;
  // 设置昵称弹窗（用于后续修改）
  isEditOpen: boolean;

  hydrate: () => void;
  setNickname: (name: string) => void;
  clearNickname: () => void;
  openWelcome: () => void;
  closeWelcome: () => void;
  openEdit: () => void;
  closeEdit: () => void;
}

export const useUserStore = create<UserStore>((set, get) => ({
  nickname: "",
  hydrated: false,
  isWelcomeOpen: false,
  isEditOpen: false,

  hydrate: () => {
    if (get().hydrated) return;
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || "";
      const isFirstVisit = !localStorage.getItem("dasy_visited");
      localStorage.setItem("dasy_visited", "1");
      set({
        nickname: saved,
        hydrated: true,
        // 首次访问且未设置昵称时弹出欢迎弹窗
        isWelcomeOpen: isFirstVisit && !saved,
      });
    } catch {
      set({ hydrated: true });
    }
  },

  setNickname: (name) => {
    const trimmed = name.trim();
    try {
      if (trimmed) {
        localStorage.setItem(STORAGE_KEY, trimmed);
      } else {
        localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // localStorage 不可用时静默失败
    }
    set({ nickname: trimmed });
  },

  clearNickname: () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    set({ nickname: "" });
  },

  openWelcome: () => set({ isWelcomeOpen: true }),
  closeWelcome: () => set({ isWelcomeOpen: false }),

  openEdit: () => set({ isEditOpen: true }),
  closeEdit: () => set({ isEditOpen: false }),
}));
