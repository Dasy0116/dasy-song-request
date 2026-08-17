import { useEffect } from "react";
import { X, ListMusic, Music2, RefreshCw, Inbox, Loader2 } from "lucide-react";
import { useSongStore } from "@/store/useSongStore";

/**
 * 粉丝端可见的点唱队列浮层
 * - 仅展示 pending 状态歌曲（不含昵称/留言）
 * - 按 order_index 排序，对应主播后台队列
 */
export function FanQueuePanel() {
  const isOpen = useSongStore((s) => s.isFanQueueOpen);
  const setOpen = useSongStore((s) => s.setFanQueueOpen);
  const fanQueue = useSongStore((s) => s.fanQueue);
  const refresh = useSongStore((s) => s.refreshPointStatus);

  // 打开时刷新一次
  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  // ESC 关闭
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-40 animate-fade-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="fan-queue-title"
    >
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* 右侧抽屉 */}
      <aside
        className="absolute top-0 right-0 h-full w-full max-w-md glass-card rounded-none overflow-y-auto animate-fade-in-up shadow-2xl shadow-accent-violet/30"
        style={{ animationFillMode: "forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gold-glow" />

        {/* 头部 */}
        <header className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b border-white/10 bg-wolf-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-gold-glow/20 flex items-center justify-center">
              <ListMusic className="w-4.5 h-4.5 text-accent-gold" />
            </div>
            <div>
              <h2
                id="fan-queue-title"
                className="font-display text-lg text-gradient-gold leading-tight"
              >
                点唱队列
              </h2>
              <p className="text-[11px] text-white/50">
                共 <span className="text-accent-gold">{fanQueue.length}</span> 首待唱
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => refresh()}
              title="刷新"
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={() => setOpen(false)}
              aria-label="关闭"
              className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* 列表 */}
        <div className="p-4 space-y-2">
          {fanQueue.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-white/50">
              <Inbox className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-base mb-1">队列空空如也</p>
              <p className="text-xs text-white/40">快来成为第一个点歌的人 🐺</p>
            </div>
          ) : (
            fanQueue.map((item, i) => (
              <div
                key={item.id}
                className="glass-card p-3 flex items-center gap-3 transition-all hover:bg-white/[0.06]"
              >
                {/* 序号 */}
                <div className="shrink-0 w-8 h-8 rounded-full bg-violet-glow/20 border border-accent-violet/30 flex items-center justify-center">
                  <span className="text-xs font-mono text-accent-violet">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                </div>

                {/* 歌曲信息 */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <Music2 className="w-3.5 h-3.5 text-accent-violet shrink-0" />
                    <span className="font-medium text-white truncate">
                      {item.song_title}
                    </span>
                  </div>
                  <p className="text-xs text-white/50 truncate mt-0.5 pl-5">
                    {item.song_artist}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <p className="px-5 pb-5 text-[11px] text-center text-white/30 leading-relaxed">
          💡 队列按主播排片顺序展示，仅显示待唱歌曲
        </p>
      </aside>
    </div>
  );
}

/**
 * 触发按钮（不带 fixed 定位，由父容器统一布局）
 */
export function FanQueueTrigger() {
  const setOpen = useSongStore((s) => s.setFanQueueOpen);
  const count = useSongStore((s) => s.fanQueue.length);

  return (
    <button
      onClick={() => setOpen(true)}
      className="glass-card px-3 py-2 flex items-center gap-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-all"
      title="查看点唱队列"
    >
      <ListMusic className="w-3.5 h-3.5 text-accent-gold" />
      <span>队列</span>
      {count > 0 && (
        <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-gold text-wolf-900 text-[10px] font-bold flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
