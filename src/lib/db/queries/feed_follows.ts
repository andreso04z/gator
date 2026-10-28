import { and, eq } from "drizzle-orm";
import { db } from "..";
import { feedFollows, feeds, users } from "../schema";
import { getFeedByUrl } from "./feeds";

export async function createFeedFollow(userId: string, feedId: string) {
  const [newFeedFollow] = await db.insert(feedFollows).values({ userId, feedId }).returning();

  const [feedUserFollow] = await db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAt: feedFollows.updatedAt,
      feedId: feedFollows.feedId,
      feedName: feeds.name,
      feedUrl: feeds.url,
      userId: feedFollows.userId,
      userName: users.name
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .where(eq(feedFollows.id, newFeedFollow.id));

  return feedUserFollow;
}

export async function getFeedFollowsForUser(userId: string) {
  const followedFeeds = await db
    .select({
      id: feedFollows.id,
      createdAt: feedFollows.createdAt,
      updatedAt: feedFollows.updatedAt,
      feedId: feedFollows.feedId,
      feedName: feeds.name,
      feedUrl: feeds.url,
      userId: feedFollows.userId,
      userName: users.name
    })
    .from(feedFollows)
    .innerJoin(feeds, eq(feedFollows.feedId, feeds.id))
    .innerJoin(users, eq(feedFollows.userId, users.id))
    .where(eq(feedFollows.userId, userId));

  return followedFeeds;
}

export async function deleteFeedFollow(userId: string, feedId: string) {
  const [deletedFollow] = await db
    .delete(feedFollows)
    .where(
      and(
        eq(feedFollows.userId, userId), eq(feedFollows.feedId, feedId)
      )
    )
    .returning();

  return deletedFollow;
}
