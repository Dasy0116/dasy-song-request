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
      if (firstLetter !== "全部" && song.firstLetter !== firstLetter) {
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

  return {
    filteredSongs,
    totalCount: filteredSongs.length,
    isEmpty: filteredSongs.length === 0,
  };
}
