import { RSSFeed } from "src/lib/rss/feed";
import { db } from "..";
import { feeds, InsertFeed } from "../schema";
import { eq } from "drizzle-orm";

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
