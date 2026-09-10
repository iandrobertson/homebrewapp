import "server-only";
import { appDb } from "@/db/client";
import { chapters } from "@/db/schema";

export type ChapterOption = {
  id: string;
  name: string;
  slug: string;
  region: string;
};

export async function listChapters(): Promise<ChapterOption[]> {
  return appDb
    .select({
      id: chapters.id,
      name: chapters.name,
      slug: chapters.slug,
      region: chapters.region,
    })
    .from(chapters)
    .orderBy(chapters.region, chapters.name);
}
