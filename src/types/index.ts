export type Language = "国语" | "日语" | "英语" | "韩语" | "其他";

export type SongStatus = "available" | "full" | "closed";

export interface Song {
  id: number;
  title: string;
  artist: string;
  language: Language;
  genre: string;
  firstLetter: string;
  isPaid: boolean;
  hasClip: boolean;
  remark: string;
  bvLink?: string;
  status: SongStatus;
}

export interface SongRequest {
  id: string;
  song_id: number;
  song_title: string;
  song_artist: string;
  nickname: string;
  message: string;
  status: "pending" | "sung" | "deleted";
  order_index: number;
  created_at: string;
  updated_at: string;
}

export interface FilterState {
  firstLetter: string;
  language: string;
  genre: string;
  condition: string;
  searchKeyword: string;
}

export type FilterKey = keyof FilterState;
