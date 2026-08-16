import { useMemo } from "react";
import { useSongStore } from "@/store/useSongStore";
import type { Song } from "@/types";

export function useSongFilter(): {
  filteredSongs: Song[];
  totalCount: number;
  isEmpty: boolean;
} {
  const allSongs = useSongStore((s) => s.allSongs);
  const firstLetter = useSongStore((s) => s.firstLetter);
  const language = useSongStore((s) => s.language);
  const genre = useSongStore((s) => s.genre);
  const condition = useSongStore((s) => s.condition);
  const searchKeyword = useSongStore((s) => s.searchKeyword);

  const filteredSongs = useMemo(() => {
    return allSongs.filter((song) => {
      if (firstLetter !== "全部" && song.firstLetter?.[0] !== firstLetter) {
        return false;
      }
      if (language !== "全部" && song.language !== language) {
        return false;
      }
      if (genre !== "全部" && song.genre !== genre) {
        return false;
      }
      if (condition === "可点" && song.status !== "available") {
        return false;
      }
      if (condition === "免费" && song.isPaid) {
        return false;
      }
      if (condition === "有歌切" && !song.hasClip) {
        return false;
      }
      if (searchKeyword.trim()) {
        const kw = searchKeyword.trim().toLowerCase();
        if (
          !song.title.toLowerCase().includes(kw) &&
          !song.artist.toLowerCase().includes(kw)
        ) {
          return false;
        }
      }
      return true;
    });
  }, [allSongs, firstLetter, language, genre, condition, searchKeyword]);

  const sortedSongs = useMemo(() => {
    return [...filteredSongs].sort((a, b) => {
      const la = a.firstLetter || "~~";
      const lb = b.firstLetter || "~~";
      const maxLen = Math.max(la.length, lb.length);
      for (let i = 0; i < maxLen; i++) {
        const ca = la.charCodeAt(i) ?? -1;
        const cb = lb.charCodeAt(i) ?? -1;
        if (ca !== cb) return ca - cb;
      }
      const ta = a.title || "";
      const tb = b.title || "";
      for (let i = 0; i < Math.min(ta.length, tb.length); i++) {
        const ca = ta.charCodeAt(i);
        const cb = tb.charCodeAt(i);
        if (ca !== cb) return ca - cb;
      }
      return ta.length - tb.length;
    });
  }, [filteredSongs]);

  return {
    filteredSongs: sortedSongs,
    totalCount: sortedSongs.length,
    isEmpty: sortedSongs.length === 0,
  };
}
