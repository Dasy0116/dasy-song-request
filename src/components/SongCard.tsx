import { useEffect, useRef } from "react";
import { useSongFilter } from "@/hooks/useSongFilter";
import { useSongStore } from "@/store/useSongStore";
import type { Song } from "@/types";
import {
  Music2,
  User,
  Globe2,
  Tags,
  Scissors,
  CircleDot,
  Send,
  ExternalLink,
  Inbox,
  Loader2,
  AlertCircle,
  RotateCw,
} from "lucide-react";

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

interface CardProps {
  song: Song;
  index: number;
}

function MobileSongCard({ song, index }: CardProps) {
  const highlightedSongId = useSongStore((s) => s.highlightedSongId);
  const openRequestModal = useSongStore((s) => s.openRequestModal);

  const isHighlighted = highlightedSongId === song.id;
  const isDisabled = song.status !== "available";
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isHighlighted && cardRef.current) {
      cardRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [isHighlighted]);

  return (
    <div
      ref={cardRef}
      className={`
        glass-card p-4 transition-all duration-300 relative overflow-hidden
        ${isHighlighted ? "animate-highlight [animation-duration:1.5s]" : ""}
        ${isDisabled ? "opacity-60" : ""}
      `}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 shrink-0 rounded-full bg-violet-glow flex items-center justify-center">
            <Music2 className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-white truncate">{song.title}</span>
              {song.isPaid && (
                <span className="chip bg-accent-gold/15 text-accent-gold border border-accent-gold/30 shrink-0">
                  付费
                </span>
              )}
            </div>
            <div className="flex items-center gap-1 text-xs text-white/60 mt-0.5">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate">{song.artist}</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-white/40 font-mono shrink-0">
          #{String(index + 1).padStart(2, "0")}
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-3">
        <span className="chip bg-accent-blue/15 text-accent-blue border border-accent-blue/30">
          <Globe2 className="w-3 h-3" /> {song.language}
        </span>
        <span className="chip bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/30">
          <Tags className="w-3 h-3" /> {song.genre}
        </span>
        {song.hasClip && (
          <span className="chip bg-fuchsia-500/15 text-fuchsia-400 border border-fuchsia-400/30">
            <Scissors className="w-3 h-3" /> 歌切
          </span>
        )}
        <span className={`chip border ${statusStyles[song.status]}`}>
          <CircleDot className="w-3 h-3" /> {statusText[song.status]}
        </span>
      </div>

      {song.remark && song.remark !== "-" && (
        <p className="text-xs text-white/50 mb-3 italic border-l-2 border-accent-violet/40 pl-2">
          「{song.remark}」
        </p>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-white/5">
        <div className="flex items-center gap-2">
          {song.bvLink && (
            <a
              href={song.bvLink}
              target="_blank"
              rel="noopener noreferrer"
              className="p-2 rounded-full bg-pink-500/10 text-pink-400 hover:bg-pink-500/20 hover:scale-105 transition-all border border-pink-400/20"
              title="查看视频"
            >
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
        <button
          onClick={() => openRequestModal(song)}
          disabled={isDisabled}
          className={`
            inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-all
            ${isDisabled
              ? "bg-white/5 text-white/40 cursor-not-allowed"
              : "bg-gold-glow text-wolf-900 hover:shadow-glow-gold hover:scale-105 active:scale-95"}
          `}
        >
          <Send className="w-4 h-4" />
          点这首歌
        </button>
      </div>
    </div>
  );
}

export function SongCard() {
  const { filteredSongs, isEmpty } = useSongFilter();
  const isLoading = useSongStore((s) => s.isLoading);
  const loadError = useSongStore((s) => s.loadError);
  const fetchSongs = useSongStore((s) => s.fetchSongs);

  if (isLoading) {
    return (
      <div className="glass-card py-16 flex flex-col items-center justify-center text-white/50">
        <Loader2 className="w-10 h-10 mb-3 text-accent-violet animate-spin" />
        <p className="text-base">正在加载歌单...</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <div className="glass-card py-16 flex flex-col items-center justify-center text-white/50">
        <AlertCircle className="w-10 h-10 mb-3 text-red-400/70" />
        <p className="text-base mb-3">{loadError}</p>
        <button onClick={() => fetchSongs()} className="btn-secondary">
          <RotateCw className="w-4 h-4" />
          重新加载
        </button>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="glass-card py-16 flex flex-col items-center justify-center text-white/50">
        <Inbox className="w-14 h-14 mb-3 opacity-40" />
        <p className="text-base mb-1">没有找到匹配的歌曲</p>
        <p className="text-sm text-white/40">试试调整筛选条件</p>
      </div>
    );
  }

  return (
    <section className="grid gap-4 md:hidden">
      {filteredSongs.map((song, i) => (
        <MobileSongCard key={song.id} song={song} index={i} />
      ))}
    </section>
  );
}
