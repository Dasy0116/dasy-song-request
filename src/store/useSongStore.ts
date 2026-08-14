import { create } from "zustand";
import type { Song, SongRequest, FilterKey, FilterState } from "@/types";

interface SongStore extends FilterState {
  // 歌曲数据
  allSongs: Song[];
  highlightedSongId: number | null;
  // 加载状态
  isLoading: boolean;
  loadError: string | null;
  // 弹窗状态
  isRequestModalOpen: boolean;
  selectedSong: Song | null;
  // 点歌记录
  requestHistory: SongRequest[];
  // 成功提示
  successToast: string | null;

  // Actions
  fetchSongs: () => Promise<void>;
  setFilter: <K extends FilterKey>(key: K, value: FilterState[K]) => void;
  resetFilters: () => void;
  setHighlighted: (id: number | null) => void;
  playRandom: () => void;
  openRequestModal: (song: Song) => void;
  closeRequestModal: () => void;
  submitRequest: (data: { nickname: string; message: string }) => void;
  clearToast: () => void;
}

export const useSongStore = create<SongStore>((set, get) => ({
  // 筛选条件默认值
  firstLetter: "全部",
  language: "全部",
  genre: "全部",
  condition: "全部",
  searchKeyword: "",

  // 歌曲数据（初始为空，异步加载）
  allSongs: [],
  highlightedSongId: null,

  // 加载状态
  isLoading: false,
  loadError: null,

  // 弹窗
  isRequestModalOpen: false,
  selectedSong: null,

  // 记录
  requestHistory: [],

  // Toast
  successToast: null,

  fetchSongs: async () => {
    set({ isLoading: true, loadError: null });
    try {
      // 加时间戳防止缓存，确保每次拿到最新歌单
      const url = `./songs.json?t=${Date.now()}`;
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
      const data: Song[] = await res.json();
      set({ allSongs: data, isLoading: false, loadError: null });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "未知错误";
      set({ isLoading: false, loadError: `歌单加载失败: ${msg}` });
    }
  },

  setFilter: (key, value) => set({ [key]: value } as Pick<SongStore, FilterKey>),

  resetFilters: () =>
    set({
      firstLetter: "全部",
      language: "全部",
      genre: "全部",
      condition: "全部",
      searchKeyword: "",
    }),

  setHighlighted: (id) => {
    set({ highlightedSongId: id });
    if (id !== null) {
      setTimeout(() => set({ highlightedSongId: null }), 1500);
    }
  },

  playRandom: () => {
    const { allSongs } = get();
    const availableSongs = allSongs.filter((s) => s.status === "available");
    if (availableSongs.length === 0) return;
    const random =
      availableSongs[Math.floor(Math.random() * availableSongs.length)];
    set({ highlightedSongId: random.id });
    setTimeout(() => {
      const el = document.getElementById(`song-row-${random.id}`);
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 100);
    setTimeout(() => set({ highlightedSongId: null }), 2000);
  },

  openRequestModal: (song) =>
    set({
      selectedSong: song,
      isRequestModalOpen: true,
    }),

  closeRequestModal: () =>
    set({
      isRequestModalOpen: false,
      selectedSong: null,
    }),

  submitRequest: ({ nickname, message }) => {
    const { selectedSong, requestHistory } = get();
    if (!selectedSong) return;

    const newRequest: SongRequest = {
      id: Date.now(),
      songId: selectedSong.id,
      songTitle: selectedSong.title,
      nickname,
      message,
      createdAt: new Date().toISOString(),
    };

    set({
      requestHistory: [...requestHistory, newRequest],
      isRequestModalOpen: false,
      selectedSong: null,
      successToast: `🐺 点歌成功！已为「${nickname}」登记《${selectedSong.title}》`,
    });

    setTimeout(() => set({ successToast: null }), 4000);
  },

  clearToast: () => set({ successToast: null }),
}));
