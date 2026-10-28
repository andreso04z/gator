import { createFeedFollow, deleteFeedFollow, getFeedFollowsForUser } from "src/lib/db/queries/feed_follows";
import { createFeed, getAllFeeds, getFeedByUrl } from "src/lib/db/queries/feeds";
import { getUserById } from "src/lib/db/queries/users";
import { printFeed } from "src/lib/rss/feed";
import { User } from "src/lib/db/schema";
import { rethrow } from "./rethrow";

export async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  if (!args[0] || !args[1]) {
    throw new Error("Name and URL must be passed as parameters");
  }

  const name = args[0];
  const url = args[1];

  const feed = await rethrow(createFeed(name, url, user.id), "Failed to insert feed to database");

  console.log(`Feed: ${name} was inserted succesfully`);

  const feedUserFollow = await rethrow(createFeedFollow(user.id, feed.id), "Failed to automatically follow feed");

  console.log(feedUserFollow.feedName);
  console.log(feedUserFollow.userName);
}

export async function handlerShowFeeds(cmdName: string, ...args: string[]) {
  const feeds = await rethrow(getAllFeeds(), "Failed to get all feeds");

  for (const feed of feeds) {
    const user = await rethrow(getUserById(feed.userId), "Failed to get user");
    printFeed(feed, user);
  };
}

export async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  const url = args[0];

  const feed = await rethrow(getFeedByUrl(url), "Failed to get feed by its url");
  const feedUserFollow = await rethrow(createFeedFollow(user.id, feed.id), "Failed to create feed follow");

  console.log(`Feed name: ${feedUserFollow.feedName}`);
  console.log(`User name: ${feedUserFollow.userName}`);
}

export async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  const followedFeeds = await rethrow(getFeedFollowsForUser(user.id), "Failed to get the user's followed feeds");

  followedFeeds.forEach(feed => console.log(feed.feedName));
}

export async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  if (!args[0]) {
    throw new Error("Feed url must be passed as parameter");
  }

  const url = args[0];

  const feed = await rethrow(getFeedByUrl(url), "Failed to get feed by url");
  await rethrow(deleteFeedFollow(user.id, feed.id), "Failed to delete follow relationship");

  console.log(`Unfollowed feed: ${feed.name}`);
}
