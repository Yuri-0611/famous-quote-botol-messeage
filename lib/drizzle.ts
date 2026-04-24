import { drizzle } from "drizzle-orm/libsql";
import { getTursoClient } from "@/lib/db";
import * as schema from "@/lib/schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let cached: Db | null = null;

export function getDb(): Db {
  if (!cached) {
    cached = drizzle(getTursoClient(), { schema });
  }
  return cached;
}
