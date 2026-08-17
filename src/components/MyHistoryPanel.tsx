import { useEffect } from "react";
import {
  X,
  History,
  Music2,
  Trash2,
  RefreshCw,
  Inbox,
  Clock,
  Check,
  HelpCircle,
  User,
  MessageSquare,
} from "lucide-react";
import { useSongStore } from "@/store/useSongStore";
import type { MyHistoryItem } from "@/store/useSongStore";

function formatTime(iso: string) {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getMonth() + 1}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return iso;
  }
}

function StatusChip({ status }: { status: string | undefined }) {
  if (status === "pending")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-accent-gold/40 bg-accent-gold/15 text-accent-gold">
        <Clock className="w-2.5 h-2.5" /> 待唱
      </span>
    );
  if (status === "sung")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-emerald-400/40 bg-emerald-400/15 text-emerald-300">
        <Check className="w-2.5 h-2.5" /> 已唱
      </span>
    );
  if (status === "deleted")
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-red-400/40 bg-red-400/15 text-red-300">
        <Trash2 className="w-2.5 h-2.5" /> 已删除
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] rounded-full border border-white/20 bg-white/5 text-white/50">
      <HelpCircle className="w-2.5 h-2.5" /> 未知
    </span>
  );
}

/**
 * 我的点歌历史浮层
 * - 数据存 localStorage（本设备/浏览器）
 * - 打开时异步查询每条记录在 Supabase 中的最新状态
 */
export function MyHistoryPanel() {
  const isOpen = useSongStore((s) => s.isMyHistoryOpen);
  const setOpen = useSongStore((s) => s.setMyHistoryOpen);
  const history = useSongStore((s) => s.myHistory);
  const statusMap = useSongStore((s) => s.myHistoryStatus);
  const refresh = useSongStore((s) => s.refreshMyHistoryStatus);
  const remove = useSongStore((s) => s.removeMyHistory);

  useEffect(() => {
    if (isOpen) refresh();
  }, [isOpen, refresh]);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  const pendingCount = history.filter(
    (h) => statusMap[h.local_id] === "pending"
  ).length;
  const sungCount = history.filter(
    (h) => statusMap[h.local_id] === "sung"
  ).length;

  return (
    <div
      className="fixed inset-0 z-40 animate-fade-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="my-history-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <aside
        className="absolute top-0 right-0 h-full w-full max-w-md glass-card rounded-none overflow-y-auto animate-fade-in-up shadow-2xl shadow-accent-violet/30"
        style={{ animationFillMode: "forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gold-glow" />

        <header className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b border-white/10 bg-wolf-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-accent-gold/20 flex items-center justify-center">
              <History className="w-4.5 h-4.5 text-accent-gold" />
            </div>
            <div>
              <h2
                id="my-history-title"
                className="font-display text-lg text-gradient-gold leading-tight"
              >
                我的点歌
              </h2>
              <p className="text-[11px] text-white/50">
                共 {history.length} 条 · 待唱 {pendingCount} · 已唱 {sungCount}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => refresh()}
              title="刷新状态"
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

        <div className="p-4 space-y-2">
          {history.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-white/50">
              <Inbox className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-base mb-1">还没有点歌记录</p>
              <p className="text-xs text-white/40">去歌单里点一首试试吧 🐺</p>
            </div>
          ) : (
            history.map((h: MyHistoryItem) => {
              const st = statusMap[h.local_id];
              return (
                <div
                  key={h.local_id}
                  className="glass-card p-3 transition-all hover:bg-white/[0.06]"
                >
                  <div className="flex items-start gap-3">
                    {/* 状态徽标 + 序号 */}
                    <div className="shrink-0 flex flex-col items-center gap-1">
                      <div className="w-9 h-9 rounded-full bg-violet-glow/20 border border-accent-violet/30 flex items-center justify-center">
                        <Music2 className="w-4 h-4 text-accent-violet" />
                      </div>
                    </div>

                    {/* 主信息 */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-medium text-white truncate">
                          {h.song_title}
                        </span>
                        <StatusChip status={st} />
                      </div>
                      <p className="text-xs text-white/50 truncate mt-0.5">
                        {h.song_artist}
                      </p>
                      <div className="flex items-center gap-2 mt-1.5 text-[11px] text-white/40">
                        <span className="inline-flex items-center gap-0.5">
                          <User className="w-2.5 h-2.5" /> {h.nickname}
                        </span>
                        <span>·</span>
                        <span>{formatTime(h.created_at)}</span>
                      </div>
                      {h.message && (
                        <p className="mt-1.5 text-xs text-white/60 italic border-l-2 border-accent-violet/40 pl-2 leading-relaxed">
                          <MessageSquare className="w-2.5 h-2.5 inline mr-1" />
                          {h.message}
                        </p>
                      )}
                    </div>

                    {/* 删除按钮 */}
                    <button
                      onClick={() => {
                        if (confirm("从本地记录中移除？\n（不会影响主播后台的记录）")) {
                          remove(h.local_id);
                        }
                      }}
                      title="从本地记录移除"
                      className="shrink-0 p-1.5 rounded-lg text-white/30 hover:text-red-300 hover:bg-red-500/10 transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <p className="px-5 pb-5 text-[11px] text-center text-white/30 leading-relaxed">
          💡 仅本设备/浏览器可见，清除浏览器数据会丢失。状态会从主播后台实时同步
        </p>
      </aside>
    </div>
  );
}

/**
 * 触发按钮（不带 fixed 定位，由父容器统一布局）
 */
export function MyHistoryTrigger() {
  const setOpen = useSongStore((s) => s.setMyHistoryOpen);
  const count = useSongStore((s) => s.myHistory.length);

  return (
    <button
      onClick={() => setOpen(true)}
      className="glass-card px-3 py-2 flex items-center gap-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-all"
      title="查看我的点歌记录"
    >
      <History className="w-3.5 h-3.5 text-accent-gold" />
      <span>我的</span>
      {count > 0 && (
        <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-violet text-white text-[10px] font-bold flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
