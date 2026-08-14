import { useEffect, useState } from "react";
import {
  X,
  Send,
  Music2,
  User,
  MessageSquare,
  CheckCircle,
} from "lucide-react";
import { useSongStore } from "@/store/useSongStore";

export function RequestModal() {
  const isOpen = useSongStore((s) => s.isRequestModalOpen);
  const selectedSong = useSongStore((s) => s.selectedSong);
  const closeModal = useSongStore((s) => s.closeRequestModal);
  const submitRequest = useSongStore((s) => s.submitRequest);

  const [nickname, setNickname] = useState("");
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState<{ nickname?: string }>({});

  // 重置表单当弹窗开启
  useEffect(() => {
    if (isOpen) {
      setNickname("");
      setMessage("");
      setErrors({});
    }
  }, [isOpen]);

  // ESC关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, closeModal]);

  if (!isOpen || !selectedSong) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedNick = nickname.trim();
    if (!trimmedNick) {
      setErrors({ nickname: "请先填写你的昵称呀~" });
      return;
    }
    submitRequest({
      nickname: trimmedNick,
      message: message.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
      onClick={closeModal}
      role="dialog"
      aria-modal="true"
      aria-labelledby="request-modal-title"
    >
      {/* 背景遮罩 */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />

      {/* 弹窗主体 */}
      <div
        className="relative glass-card w-full max-w-md p-0 overflow-hidden animate-fade-in-up shadow-2xl shadow-accent-violet/20"
        style={{ animationFillMode: "forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* 顶部装饰条 */}
        <div className="h-1 w-full bg-gold-glow" />

        {/* 关闭按钮 */}
        <button
          onClick={closeModal}
          aria-label="关闭弹窗"
          className="absolute right-3 top-3 p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* 标题区 */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-gold-glow shadow-glow-gold mb-3">
              <Send className="w-7 h-7 text-wolf-900" />
            </div>
            <h2
              id="request-modal-title"
              className="font-display text-2xl text-gradient-gold mb-1"
            >
              提交点歌申请
            </h2>
            <p className="text-xs text-white/50">填写信息，让独狼听到你的声音 🐺🎵</p>
          </div>

          {/* 当前选歌信息 */}
          <div className="mb-6 p-3 rounded-xl bg-violet-glow/15 border border-accent-violet/30 flex items-center gap-3">
            <div className="w-11 h-11 shrink-0 rounded-lg bg-accent-violet/30 flex items-center justify-center">
              <Music2 className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-white/60 mb-0.5">你选择的歌曲</p>
              <p className="font-semibold text-white truncate">{selectedSong.title}</p>
              <p className="text-xs text-white/50 truncate">{selectedSong.artist}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 昵称输入 */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-white/80 mb-1.5">
                <User className="w-3.5 h-3.5 text-accent-gold" />
                你的昵称 <span className="text-accent-gold">*</span>
              </label>
              <input
                type="text"
                value={nickname}
                onChange={(e) => {
                  setNickname(e.target.value);
                  if (errors.nickname) setErrors({});
                }}
                placeholder="请输入你的昵称，最多16字"
                maxLength={16}
                className={`glass-input w-full pl-10 pr-4
                  ${errors.nickname ? "border-red-400/60 focus:shadow-[0_0_12px_rgba(239,68,68,0.3)]" : ""}`}
              />
              {errors.nickname && (
                <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                  <span>⚠</span> {errors.nickname}
                </p>
              )}
            </div>

            {/* 寄语输入 */}
            <div>
              <label className="flex items-center gap-1.5 text-sm text-white/80 mb-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-accent-cyan" />
                想对独狼说的话（选填）
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="想说什么就说什么吧~ 比如：加油！最喜欢你啦！（最多80字）"
                maxLength={80}
                rows={3}
                className="glass-input w-full rounded-xl px-4 py-3 resize-none"
              />
              <div className="mt-1 text-right text-xs text-white/40">
                {message.length}/80
              </div>
            </div>

            {/* 按钮组 */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={closeModal}
                className="btn-secondary flex-1"
              >
                再想想
              </button>
              <button
                type="submit"
                className="btn-primary flex-1 relative overflow-hidden"
              >
                <CheckCircle className="w-4 h-4" />
                确认点歌
                <span className="absolute inset-0 shine-effect animate-shine pointer-events-none" />
              </button>
            </div>
          </form>

          <p className="mt-4 text-[11px] text-center text-white/30 leading-relaxed">
            💡 温馨提示：提交后请耐心等待主播翻牌哦~ 付费歌曲可能需要额外支持
          </p>
        </div>
      </div>
    </div>
  );
}
