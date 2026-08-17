import { useEffect, useState } from "react";
import { X, User, CheckCircle, Loader2, PawPrint } from "lucide-react";
import { useUserStore } from "@/store/useUserStore";

/**
 * 昵称弹窗，复用两种场景：
 * - 首次访问的欢迎弹窗（isWelcomeOpen）
 * - 后续修改昵称（isEditOpen）
 */
export function NicknameModal() {
  const isWelcomeOpen = useUserStore((s) => s.isWelcomeOpen);
  const isEditOpen = useUserStore((s) => s.isEditOpen);
  const closeWelcome = useUserStore((s) => s.closeWelcome);
  const closeEdit = useUserStore((s) => s.closeEdit);
  const setNickname = useUserStore((s) => s.setNickname);
  const currentNickname = useUserStore((s) => s.nickname);

  const isOpen = isWelcomeOpen || isEditOpen;
  const isWelcome = isWelcomeOpen;

  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isOpen) {
      setValue(currentNickname);
      setError("");
    }
  }, [isOpen, currentNickname]);

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        isWelcome ? closeWelcome() : closeEdit();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, isWelcome, closeWelcome, closeEdit]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("总得有个称呼吧~");
      return;
    }
    if (trimmed.length > 16) {
      setError("昵称最多16个字哦");
      return;
    }
    setNickname(trimmed);
    isWelcome ? closeWelcome() : closeEdit();
  };

  const handleClose = () => {
    // 欢迎弹窗允许跳过，但不设置昵称点歌时仍需填
    isWelcome ? closeWelcome() : closeEdit();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="nickname-modal-title"
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      <div
        className="relative glass-card w-full max-w-md p-0 overflow-hidden animate-fade-in-up shadow-2xl shadow-accent-violet/20"
        style={{ animationFillMode: "forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gold-glow" />

        <button
          onClick={handleClose}
          aria-label="关闭"
          className="absolute right-3 top-3 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-glow shadow-glow-gold mb-3">
              {isWelcome ? (
                <PawPrint className="w-7 h-7 text-wolf-900" />
              ) : (
                <User className="w-7 h-7 text-wolf-900" />
              )}
            </div>
            <h2
              id="nickname-modal-title"
              className="font-display text-2xl text-gradient-gold mb-1"
            >
              {isWelcome ? "欢迎来到独狼点歌台" : "修改我的昵称"}
            </h2>
            <p className="text-xs text-white/50">
              {isWelcome
                ? "先留下你的昵称，点歌时自动带上 🐺"
                : "修改后立即生效，下次访问也会记住"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="flex items-center gap-1.5 text-sm text-white/80 mb-1.5">
                <User className="w-3.5 h-3.5 text-accent-gold" />
                你的昵称 <span className="text-accent-gold">*</span>
              </label>
              <input
                type="text"
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  if (error) setError("");
                }}
                placeholder="请输入你的昵称，最多16字"
                maxLength={16}
                autoFocus
                className={`glass-input w-full pl-10 pr-4 ${
                  error ? "border-red-400/60 focus:shadow-[0_0_12px_rgba(239,68,68,0.3)]" : ""
                }`}
              />
              {error && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <span>⚠</span> {error}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3 pt-2">
              {isWelcome && (
                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-secondary flex-1"
                >
                  稍后
                </button>
              )}
              <button
                type="submit"
                className="btn-primary flex-1 inline-flex items-center justify-center gap-1.5 relative overflow-hidden"
              >
                <CheckCircle className="w-4 h-4" />
                {isWelcome ? "就这个昵称" : "保存修改"}
                <span className="absolute inset-0 shine-effect animate-shine pointer-events-none" />
              </button>
            </div>
          </form>

          {isWelcome && (
            <p className="mt-4 text-[11px] text-center text-white/30 leading-relaxed">
              💡 昵称会保存在你的设备里，下次访问自动带上。可在右上角随时修改
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
