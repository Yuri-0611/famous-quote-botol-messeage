export type WorryGenre =
  | "study_work"
  | "relationships"
  | "future"
  | "self_confidence"
  | "healing"
  | "romance"
  | "family"
  | "money_life"
  | "health"
  | "heartbreak"
  | "new_environment"
  | "time_stress"
  | "comparison"
  | "motivation"
  | "indecision";

export const WORRY_GENRES: readonly WorryGenre[] = [
  "study_work",
  "relationships",
  "future",
  "self_confidence",
  "healing",
  "romance",
  "family",
  "money_life",
  "health",
  "heartbreak",
  "new_environment",
  "time_stress",
  "comparison",
  "motivation",
  "indecision",
] as const;

export const GENRE_LABELS: Record<WorryGenre, string> = {
  study_work: "勉強・仕事",
  relationships: "人間関係",
  future: "将来のこと",
  self_confidence: "自分に自信がない",
  healing: "癒やされたい",
  romance: "恋愛",
  family: "家族",
  money_life: "お金・生活",
  health: "健康・体力",
  heartbreak: "失恋・別れ",
  new_environment: "環境の変化",
  time_stress: "時間に追われる",
  comparison: "人と比べてしまう",
  motivation: "やる気が続かない",
  indecision: "決められない・迷う",
};

export function normalizeGenre(raw: string): WorryGenre | null {
  if ((WORRY_GENRES as readonly string[]).includes(raw)) return raw as WorryGenre;
  return null;
}
