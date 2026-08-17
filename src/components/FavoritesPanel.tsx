import { useEffect } from "react";
import {
  X,
  Heart,
  Music2,
  Trash2,
  RefreshCw,
  Inbox,
  Send,
} from "lucide-react";
import { useSongStore } from "@/store/useSongStore";

/**
 * 收藏歌曲浮层
 */
export function FavoritesPanel() {
  const isOpen = useSongStore((s) => s.isFavoritesOpen);
  const setOpen = useSongStore((s) => s.setFavoritesOpen);
  const favorites = useSongStore((s) => s.favorites);
  const allSongs = useSongStore((s) => s.allSongs);
  const toggleFavorite = useSongStore((s) => s.toggleFavorite);
  const openRequestModal = useSongStore((s) => s.openRequestModal);

  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [isOpen, setOpen]);

  if (!isOpen) return null;

  // 用 allSongs 查详情
  const favSongs = favorites
    .map((id) => allSongs.find((s) => s.id === id))
    .filter((s): s is NonNullable<typeof s> => !!s);

  return (
    <div
      className="fixed inset-0 z-40 animate-fade-in"
      onClick={() => setOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="favorites-title"
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <aside
        className="absolute top-0 right-0 h-full w-full max-w-md glass-card rounded-none overflow-y-auto animate-fade-in-up shadow-2xl shadow-accent-violet/30"
        style={{ animationFillMode: "forwards" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="h-1 w-full bg-gradient-to-r from-pink-500 to-accent-gold" />

        <header className="sticky top-0 z-10 px-5 py-4 flex items-center justify-between border-b border-white/10 bg-wolf-900/90 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-pink-500/20 flex items-center justify-center">
              <Heart className="w-4.5 h-4.5 text-pink-400 fill-pink-400/30" />
            </div>
            <div>
              <h2
                id="favorites-title"
                className="font-display text-lg text-gradient-gold leading-tight"
              >
                我的收藏
              </h2>
              <p className="text-[11px] text-white/50">
                共 <span className="text-pink-400">{favSongs.length}</span> 首
              </p>
            </div>
          </div>

          <button
            onClick={() => setOpen(false)}
            aria-label="关闭"
            className="p-2 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="p-4 space-y-2">
          {favSongs.length === 0 ? (
            <div className="py-16 flex flex-col items-center justify-center text-white/50">
              <Inbox className="w-12 h-12 mb-3 opacity-40" />
              <p className="text-base mb-1">还没有收藏</p>
              <p className="text-xs text-white/40">
                点歌单里每首歌右侧的爱心即可收藏 🐺
              </p>
            </div>
          ) : (
            favSongs.map((song) => (
              <div
                key={song.id}
                className="glass-card p-3 flex items-center gap-3 transition-all hover:bg-white/[0.06]"
              >
                <div className="shrink-0 w-9 h-9 rounded-full bg-pink-500/20 border border-pink-400/30 flex items-center justify-center">
                  <Music2 className="w-4 h-4 text-pink-400" />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="font-medium text-white truncate">
                    {song.title}
                  </p>
                  <p className="text-xs text-white/50 truncate mt-0.5">
                    {song.artist}
                  </p>
                </div>

                <button
                  onClick={() => {
                    openRequestModal(song);
                  }}
                  disabled={song.status !== "available"}
                  title={song.status !== "available" ? "不可点" : "点这首歌"}
                  className={`shrink-0 p-2 rounded-lg transition-all ${
                    song.status !== "available"
                      ? "text-white/30 cursor-not-allowed"
                      : "text-accent-gold hover:bg-accent-gold/20"
                  }`}
                >
                  <Send className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={() => toggleFavorite(song.id)}
                  title="取消收藏"
                  className="shrink-0 p-2 rounded-lg text-pink-400 hover:bg-pink-500/20 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))
          )}
        </div>

        <p className="px-5 pb-5 text-[11px] text-center text-white/30 leading-relaxed">
          💡 登录后收藏跨设备同步，未登录仅本设备可见
        </p>
      </aside>
    </div>
  );
}

/**
 * 收藏触发按钮（不含 fixed 定位，与"队列"/"我的"共用容器）
 */
export function FavoritesTrigger() {
  const setOpen = useSongStore((s) => s.setFavoritesOpen);
  const count = useSongStore((s) => s.favorites.length);

  return (
    <button
      onClick={() => setOpen(true)}
      className="glass-card px-3 py-2 flex items-center gap-1.5 text-xs text-white/80 hover:text-white hover:bg-white/10 transition-all"
      title="查看我的收藏"
    >
      <Heart className="w-3.5 h-3.5 text-pink-400" />
      <span>收藏</span>
      {count > 0 && (
        <span className="ml-0.5 min-w-[18px] h-[18px] px-1 rounded-full bg-pink-500 text-white text-[10px] font-bold flex items-center justify-center">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </button>
  );
}
