import { useEffect, useState } from "react";
import {
  X,
  Lock,
  User,
  LogIn,
  UserPlus,
  Loader2,
  AlertCircle,
  Sparkles,
} from "lucide-react";
import { useAuthStore } from "@/store/useAuthStore";

type Mode = "login" | "signup";

export function AuthModal() {
  const isOpen = useAuthStore((s) => s.isAuthModalOpen);
  const setOpen = useAuthStore((s) => s.setAuthModalOpen);
  const signIn = useAuthStore((s) => s.signIn);
  const signUp = useAuthStore((s) => s.signUp);
  const signOut = useAuthStore((s) => s.signOut);
  const submitting = useAuthStore((s) => s.submitting);
  const authError = useAuthStore((s) => s.authError);
  const clearError = useAuthStore((s) => s.clearAuthError);
  const user = useAuthStore((s) => s.user);
  const nickname = useAuthStore((s) => s.nickname);
  const updateNickname = useAuthStore((s) => s.updateNickname);

  const [mode, setMode] = useState<Mode>("login");
  const [nicknameInput, setNicknameInput] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [localErr, setLocalErr] = useState<string | null>(null);
  const [editingNick, setEditingNick] = useState(false);
  const [newNick, setNewNick] = useState("");
  const [updatingNick, setUpdatingNick] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setNicknameInput("");
      setPassword("");
      setLocalErr(null);
      setEditingNick(false);
      setNewNick("");
      clearError();
    }
  }, [isOpen, clearError]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !submitting) setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, setOpen, submitting]);

  if (!isOpen) return null;

  // 已登录时显示账号信息
  if (user) {
    const handleSaveNick = async () => {
      const trimmed = newNick.trim();
      if (!trimmed) {
        setLocalErr("请输入新昵称");
        return;
      }
      setUpdatingNick(true);
      setLocalErr(null);
      try {
        await updateNickname(trimmed);
        setEditingNick(false);
        setNewNick("");
      } catch (err) {
        setLocalErr(err instanceof Error ? err.message : "修改失败");
      } finally {
        setUpdatingNick(false);
      }
    };

    return (
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
        onClick={() => setOpen(false)}
        role="dialog"
        aria-modal="true"
      >
        <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
        <div
          className="relative glass-card w-full max-w-md p-0 overflow-hidden animate-fade-in-up shadow-2xl shadow-accent-violet/20"
          style={{ animationFillMode: "forwards" }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="h-1 w-full bg-gold-glow" />
          <button
            onClick={() => setOpen(false)}
            aria-label="关闭"
            className="absolute right-3 top-3 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-400/40 mb-3">
              <Sparkles className="w-7 h-7 text-emerald-300" />
            </div>
            <h2 className="font-display text-2xl text-gradient-gold mb-1">
              已登录
            </h2>
            <p className="text-xs text-white/50 mb-4">你的点歌和收藏已跨设备同步</p>

            <div className="text-left bg-black/20 border border-white/5 rounded-xl p-4 mb-4 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <User className="w-3.5 h-3.5 text-white/40" />
                <span className="text-white/60">昵称</span>
                <span className="ml-auto text-white truncate font-semibold">
                  {nickname || "—"}
                </span>
              </div>
            </div>

            {editingNick ? (
              <div className="mb-3 space-y-2">
                <input
                  type="text"
                  value={newNick}
                  onChange={(e) => setNewNick(e.target.value)}
                  placeholder="输入新昵称"
                  className="glass-input w-full px-3 py-2"
                  maxLength={20}
                  autoFocus
                />
                {localErr && (
                  <div className="flex items-start gap-2 p-2 rounded-lg bg-red-500/10 border border-red-400/30 text-red-300 text-xs">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                    <span>{localErr}</span>
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={handleSaveNick}
                    disabled={updatingNick}
                    className="btn-primary flex-1 px-3 py-2 text-xs"
                  >
                    {updatingNick ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : null}
                    保存
                  </button>
                  <button
                    onClick={() => {
                      setEditingNick(false);
                      setNewNick("");
                      setLocalErr(null);
                    }}
                    className="px-3 py-2 text-xs rounded-lg border border-white/10 text-white/60 hover:text-white"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => {
                  setEditingNick(true);
                  setNewNick(nickname || "");
                  setLocalErr(null);
                }}
                className="w-full mb-3 px-4 py-2 rounded-xl text-xs border border-white/10 text-white/70 hover:bg-white/5 transition"
              >
                修改昵称
              </button>
            )}

            <button
              onClick={async () => {
                await signOut();
                setOpen(false);
              }}
              className="w-full px-4 py-2.5 rounded-xl text-sm border border-red-400/40 bg-red-500/15 text-red-300 hover:bg-red-500/25 transition"
            >
              退出登录
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalErr(null);

    if (!nicknameInput.trim()) {
      setLocalErr("请输入昵称");
      return;
    }
    if (!password) {
      setLocalErr("请输入密码");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setLocalErr("密码至少 6 位");
      return;
    }

    try {
      if (mode === "login") {
        await signIn(nicknameInput.trim(), password);
      } else {
        await signUp(nicknameInput.trim(), password);
      }
    } catch {
      // 错误已存到 store.authError
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={() => !submitting && setOpen(false)}
      role="dialog"
      aria-modal="true"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div
        className="relative glass-card w-full max-w-md p-0 overflow-hidden animate-fade-in-up shadow-2xl shadow-accent-violet/20"
        style={{ animationFillMode: "forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gold-glow" />
        <button
          onClick={() => !submitting && setOpen(false)}
          aria-label="关闭"
          className="absolute right-3 top-3 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-violet-glow shadow-glow-gold mb-3">
              {mode === "login" ? (
                <LogIn className="w-7 h-7 text-accent-gold" />
              ) : (
                <UserPlus className="w-7 h-7 text-accent-gold" />
              )}
            </div>
            <h2 className="font-display text-2xl text-gradient-gold mb-1">
              {mode === "login" ? "登录账户" : "创建账户"}
            </h2>
            <p className="text-xs text-white/50">
              {mode === "login"
                ? "登录后跨设备同步你的点歌和收藏 🐺"
                : "注册后即可跨设备同步，告别清缓存丢失烦恼"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="relative">
              <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type="text"
                value={nicknameInput}
                onChange={(e) => setNicknameInput(e.target.value)}
                placeholder={mode === "signup" ? "昵称（粉丝端展示，不可重复）" : "昵称"}
                className="glass-input w-full pl-9 pr-4"
                autoComplete="username"
                maxLength={20}
                autoFocus
              />
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
              <input
                type={showPwd ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "密码（至少 6 位）" : "密码"}
                className="glass-input w-full pl-9 pr-10"
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
              />
              <button
                type="button"
                onClick={() => setShowPwd((v) => !v)}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded text-white/40 hover:text-white hover:bg-white/10 transition text-xs"
              >
                {showPwd ? "隐藏" : "显示"}
              </button>
            </div>

            {(localErr || authError) && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-500/10 border border-red-400/30 text-red-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
                <span>{localErr || authError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full relative overflow-hidden disabled:opacity-70 disabled:cursor-wait"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === "login" ? (
                <LogIn className="w-4 h-4" />
              ) : (
                <UserPlus className="w-4 h-4" />
              )}
              {mode === "login" ? "登录" : "注册"}
              <span className="absolute inset-0 shine-effect animate-shine pointer-events-none" />
            </button>
          </form>

          <div className="mt-4 text-center text-xs text-white/50">
            {mode === "login" ? (
              <>
                还没账户？{" "}
                <button
                  onClick={() => {
                    setMode("signup");
                    setLocalErr(null);
                    clearError();
                  }}
                  className="text-accent-gold hover:underline"
                >
                  立即注册
                </button>
              </>
            ) : (
              <>
                已有账户？{" "}
                <button
                  onClick={() => {
                    setMode("login");
                    setLocalErr(null);
                    clearError();
                  }}
                  className="text-accent-gold hover:underline"
                >
                  去登录
                </button>
              </>
            )}
          </div>

          <p className="mt-4 text-[11px] text-white/30 text-center leading-relaxed">
            未登录也能浏览歌单、点歌，但点歌记录和收藏仅本设备可见
          </p>
        </div>
      </div>
    </div>
  );
}
