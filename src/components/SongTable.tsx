import { useEffect, useRef } from "react";
import { useSongFilter } from "@/hooks/useSongFilter";
import { useSongStore } from "@/store/useSongStore";
import type { Song } from "@/types";
import { Music2, ExternalLink, Send, Inbox, Loader2, AlertCircle, RotateCw, Heart } from "lucide-react";

const statusText: Record<Song["status"], string> = {
  available: "可点",
  full: "已满",
  closed: "暂关",
};

const statusStyles: Record<Song["status"], string> = {
  available: "bg-emerald-500/15 text-emerald-400 border-emerald-400/30",
  full: "bg-red-500/15 text-red-400 border-red-400/30",
  closed: "bg-zinc-500/15 text-zinc-400 border-zinc-400/30",
};

interface SongRowProps {
  song: Song;
  index: number;
}

function SongRow({ song, index }: SongRowProps) {
  const highlightedSongId = useSongStore((s) => s.highlightedSongId);
  const openRequestModal = useSongStore((s) => s.openRequestModal);
  const pointStatus = useSongStore((s) => s.songPointStatus[song.id]);
  const isFav = useSongStore((s) => s.favorites.includes(song.id));
  const toggleFav = useSongStore((s) => s.toggleFavorite);

  const isHighlighted = highlightedSongId === song.id;
  const isDisabled = song.status !== "available";
  const pointBlocked = !!pointStatus?.disabled;
  const buttonDisabled = isDisabled || pointBlocked;
  const buttonTitle = isDisabled
    ? "当前歌曲不可点"
    : pointBlocked
    ? pointStatus?.reason
    : "点这首歌";
  const rowRef = useRef<HTMLTableRowElement>(null);

  useEffect(() => {
    if (isHighlighted && rowRef.current) {
      rowRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  return (
    <tr
      ref={rowRef}
      className={`
        border-b border-white/5 transition-all duration-300
        hover:bg-white/[0.06] hover:shadow-[inset_4px_0_0_rgba(139,92,246,0.5)]
        ${isHighlighted ? "animate-highlight [animation-duration:1.5s]" : ""}
        ${isDisabled ? "opacity-60" : ""}
      `}
    >
      <td className="table-cell w-12 text-white/40 font-mono text-xs">
        {String(index + 1).padStart(2, "0")}
      </td>
      <td className="table-cell font-medium text-white">
        <div className="flex items-center gap-2">
          <Music2 className="w-3.5 h-3.5 text-accent-violet shrink-0" />
          <span className="truncate max-w-[220px]" title={song.title}>
            {song.title}
          </span>
          {song.isPaid && (
            <span className="chip shrink-0 bg-accent-gold/15 text-accent-gold border border-accent-gold/30">
              付费
            </span>
          )}
        </div>
      </td>
      <td className="table-cell text-white/75 max-w-[180px] truncate" title={song.artist}>
        {song.artist}
      </td>
      <td className="table-cell">
        <span className="chip bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
          {song.language}
        </span>
      </td>
      <td className="table-cell">
        <span className="chip bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
          {song.genre}
        </span>
      </td>
      <td className="table-cell">
        {song.hasClip ? (
          <span className="chip bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-400/30">
            ✂ 歌切
          </span>
        ) : (
          <span className="text-white/30">—</span>
        )}
      </td>
      <td className="table-cell">
        <span className={`chip border ${statusStyles[song.status]}`}>
          {statusText[song.status]}
        </span>
      </td>
      <td className="table-cell text-white/50 max-w-[160px] truncate" title={song.remark}>
        {song.remark}
      </td>
      <td className="table-cell">
        <div className="flex items-center gap-1.5">
          {song.bvLink && (
            <a
              href={song.bvLink}
              target="_blank"
              rel="noopener noreferrer"
              title="查看歌切/B站视频"
              className="p-1.5 rounded-full bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:scale-110 transition-all border border-pink-400/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
          <button
            onClick={() => toggleFav(song.id)}
            title={isFav ? "取消收藏" : "收藏"}
            className={`p-1.5 rounded-full transition-all border ${
              isFav
                ? "bg-pink-500/20 text-pink-400 border-pink-400/40 hover:bg-pink-500/30"
                : "bg-white/5 text-white/40 border-white/10 hover:text-pink-400 hover:bg-pink-500/10"
            }`}
          >
            <Heart className={`w-3.5 h-3.5 ${isFav ? "fill-pink-400" : ""}`} />
          </button>
          <button
            onClick={() => openRequestModal(song)}
            disabled={buttonDisabled}
            title={buttonTitle}
            className={`
              inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all
              ${buttonDisabled
                ? "bg-white/5 text-white/40 cursor-not-allowed"
                : "bg-gold-glow text-wolf-900 hover:shadow-glow-gold hover:scale-105 active:scale-95"}
            `}
          >
            <Send className="w-3 h-3" />
            点歌
          </button>
        </div>
      </td>
    </tr>
  );
}

export function SongTable() {
  const { filteredSongs, isEmpty } = useSongFilter();
  const isLoading = useSongStore((s) => s.isLoading);
  const loadError = useSongStore((s) => s.loadError);
  const allSongs = useSongStore((s) => s.allSongs);
  const fetchSongs = useSongStore((s) => s.fetchSongs);

  return (
    <section
      className="opacity-0 animate-fade-in-up stagger-5"
      style={{ animationFillMode: "forwards" }}
    >
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto max-h-[70vh]">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-white/50">
              <Loader2 className="w-12 h-12 mb-4 text-accent-violet animate-spin" />
              <p className="text-lg mb-1">正在加载歌单...</p>
              <p className="text-sm text-white/40">🐺 独狼正在翻箱倒柜找歌呢</p>
            </div>
          ) : loadError ? (
            <div className="py-20 flex flex-col items-center justify-center text-white/50">
              <AlertCircle className="w-12 h-12 mb-4 text-red-400/70" />
              <p className="text-lg mb-1">{loadError}</p>
              <button
                onClick={() => fetchSongs()}
                className="btn-secondary mt-4"
              >
                <RotateCw className="w-4 h-4" />
                重新加载
              </button>
            </div>
          ) : isEmpty ? (
            <div className="py-20 flex flex-col items-center justify-center text-white/50">
              <Inbox className="w-16 h-16 mb-4 opacity-40" />
              <p className="text-lg mb-1">没有找到匹配的歌曲</p>
              <p className="text-sm text-white/40">试试调整筛选条件或搜索关键词</p>
            </div>
          ) : (
            <table className="w-full min-w-[820px]">
              <thead className="sticky top-0 z-10 bg-wolf-900/85 backdrop-blur-md border-b border-white/10">
                <tr>
                  <th className="table-header w-12">#</th>
                  <th className="table-header">歌名</th>
                  <th className="table-header">歌手</th>
                  <th className="table-header">语言</th>
                  <th className="table-header">曲风</th>
                  <th className="table-header">歌切</th>
                  <th className="table-header">状态</th>
                  <th className="table-header">备注</th>
                  <th className="table-header text-right pr-6">操作</th>
                </tr>
              </thead>
              <tbody>
                {filteredSongs.map((song, i) => (
                  <SongRow key={song.id} song={song} index={i} />
                ))}
              </tbody>
            </table>
          )}
        </div>

        {!isLoading && !loadError && !isEmpty && (
          <div className="px-5 py-3 border-t border-white/5 flex items-center justify-between text-xs text-white/50 bg-wolf-900/40">
            <span>
              🎵 当前显示 <span className="text-accent-gold font-semibold">{filteredSongs.length}</span> / {allSongs.length} 首
            </span>
            <span className="hidden sm:inline text-white/40">
              💡 点击「点歌」按钮提交你的点歌请求
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
