import { useMemo } from "react";
import { songs } from "@/data/songs";
import { useSongStore } from "@/store/useSongStore";
import type { Song } from "@/types";

export function useSongFilter(): {
  filteredSongs: Song[];
  totalCount: number;
  isEmpty: boolean;
} {
  const firstLetter = useSongStore((s) => s.firstLetter);
  const language = useSongStore((s) => s.language);
  const genre = useSongStore((s) => s.genre);
  const condition = useSongStore((s) => s.condition);
  const searchKeyword = useSongStore((s) => s.searchKeyword);

  const filteredSongs = useMemo(() => {
    return songs.filter((song) => {
      // 首字母筛选
      if (firstLetter !== "全部" && song.firstLetter !== firstLetter) {
        return false;
      }
      // 语言筛选
      if (language !== "全部" && song.language !== language) {
        return false;
      }
      // 曲风筛选
      if (genre !== "全部" && song.genre !== genre) {
        return false;
      }
      // 条件筛选
      if (condition === "可点" && song.status !== "available") {
        return false;
      }
      if (condition === "免费" && song.isPaid) {
        return false;
      }
      if (condition === "有歌切" && !song.hasClip) {
        return false;
      }
      // 关键词搜索
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
  }, [firstLetter, language, genre, condition, searchKeyword]);

  return {
    filteredSongs,
    totalCount: filteredSongs.length,
    isEmpty: filteredSongs.length === 0,
  };
}
