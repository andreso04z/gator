import { readConfig, setUser } from "src/config";
import { createFeedFollow, deleteFeedFollow, getFeedFollowsForUser } from "src/lib/db/queries/feed_follows";
import { createFeed, getAllFeeds, getFeedByUrl } from "src/lib/db/queries/feeds";
import { getPostsForUser } from "src/lib/db/queries/posts";
import { createUser, getUserById, getUserByName, getUsers, resetUsers } from "src/lib/db/queries/users";
import { printFeed, scrapeFeeds } from "src/lib/rss/feed";
import { User } from "src/lib/db/schema";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

async function rethrow<T>(promise: Promise<T>, message: string): Promise<T> {
  try {
    return await promise;
  } catch {
    throw new Error(message);
  }
}

export async function handlerLogin(cmdName: string, ...args: string[]) {
  if (!args[0]) {
    throw new Error("No username specified");
  }
  const username = args[0];
  const user = await getUserByName(username);

  if (!user) {
    throw new Error(`Login failed. User ${username} does not exist`);
  }

  setUser(username);
  console.log(`Username ${username} was set to config`);
}

export async function handlerRegister(cmdName: string, ...args: string[]) {
  if (!args[0]) {
    throw new Error("No username specified");
  }

  let user;

  const username = args[0];
  try {
    user = await createUser(username);
  } catch (err: unknown) {
    if (typeof err === "object" && err !== null && "code" in err && err.code === "23505") {
      throw new Error("That value is already in use");
    }

    throw err;
  }

  setUser(user.name);
  console.log(`Username ${username} was created`);
}

export async function handlerReset(cmdName: string, ...args: string[]) {
  const reset = await rethrow(resetUsers(), "Failed to reset users table");
  console.log(`Deleted ${reset.length} users from table`);
}

export async function handlerUsers(cmdName: string, ...args: string[]) {
  const users = await rethrow(getUsers(), "Failed to get users");

  const config = readConfig();
  const currentUser = config.currentUserName;

  users.forEach(user => {
    if (user.name === currentUser) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  })
}

function parseDuration(durationStr: string): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error("Invalid duration string");
  }

  const value = match[1];
  const unit = match[2];
  const valueNum = parseInt(value);

  switch (unit) {
    case "ms": return valueNum;
    case "s": return valueNum * 1000;
    case "m": return valueNum * 1000 * 60;
    case "h": return valueNum * 1000 * 60 * 60;
    default: throw new Error("Invalid duration string");
  }
}

export async function handlerAgg(cmdName: string, ...args: string[]) {
  if (!args[0]) {
    throw new Error("Time between requests must be passed as a parameter");
  }

  const timeBetweenReqs = args[0];
  const parsedTimeBetweenReqs = parseDuration(timeBetweenReqs);

  console.log(`Collecting feeds every ${timeBetweenReqs}`);

  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : "Failed to scrape feeds";
    console.error(message);
  };

  scrapeFeeds().catch(handleError);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, parsedTimeBetweenReqs);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log("Shutting down feed aggregator...");
      clearInterval(interval);
      resolve();
    });
  });
}

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

export async function handlerBrowse(
  cmdName: string,
  user: User,
  ...args: string[]
) {
  let limit = 2;

  if (args[0]) {
    const parsedLimit = parseInt(args[0], 10);
    if (Number.isNaN(parsedLimit) || parsedLimit < 1) {
      throw new Error("Limit must be a positive integer");
    }
    limit = parsedLimit;
  }

  const posts = await rethrow(getPostsForUser(user.id, limit), "Failed to get posts for user");

  if (posts.length === 0) {
    console.log("No posts found");
    return;
  }

  for (const post of posts) {
    console.log(`Title: ${post.title}`);
    console.log(`URL: ${post.url}`);
    console.log(`Description: ${post.description ?? ""}`);
    console.log(`Feed: ${post.feedName}`);
    console.log(`Published: ${post.publishedAt?.toISOString() ?? "unknown"}`);
    console.log("---");
  }
}
