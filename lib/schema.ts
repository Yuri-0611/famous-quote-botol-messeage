import { index, integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

/** ユーザーが流した悩み */
export const worries = sqliteTable(
  "worries",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    category: text("category").notNull(),
    /** 名言マッチ結果: and / or（未取得は NULL） */
    matchType: text("match_type"),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (t) => ({
    categoryIdx: index("worries_category_idx").on(t.category),
    createdIdx: index("worries_created_idx").on(t.createdAt),
  }),
);

/** システム側の名言（ジャンル別に複数行を保持） */
export const quotes = sqliteTable(
  "quotes",
  {
    id: text("id").primaryKey(),
    content: text("content").notNull(),
    author: text("author").notNull(),
    explanation: text("explanation").notNull(),
    // カンマ区切りで複数カテゴリを保持（例: "romance,self_confidence"）
    category: text("category").notNull(),
    createdAt: integer("created_at", { mode: "number" }).notNull(),
  },
  (t) => ({
    categoryIdx: index("quotes_category_idx").on(t.category),
  }),
);
