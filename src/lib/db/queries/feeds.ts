import { RSSFeed } from "src/lib/rss/feed";
import { db } from "..";
import { feeds, InsertFeed } from "../schema";
import { asc, eq, sql } from "drizzle-orm";

export async function getAllFeeds() {
  const result = await db.select().from(feeds);
  return result;
}

export async function createFeed(name: string, url: string, userId: string) {
  const insertFeed: InsertFeed = {
    name: name,
    url: url,
    userId: userId
  }
  const [result] = await db.insert(feeds).values(insertFeed).returning();
  return result;
}

export async function getFeedByUrl(url: string) {
  const [feed] = await db.select().from(feeds).where(eq(feeds.url, url));
  return feed;
}

export async function markFeedFetched(id: string) {
  const [updated] = await db.update(feeds).set({ lastFetchedAt: new Date() }).where(eq(feeds.id, id)).returning();
  return updated;
}

export async function getNextFeedToFetch() {
  const [nextFeed] = await db
    .select()
    .from(feeds)
    .orderBy(sql`${feeds.lastFetchedAt} ASC NULLS FIRST`)
    .limit(1);

  return nextFeed;
}
