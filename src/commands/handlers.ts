import { ne } from "drizzle-orm";
import { readConfig, setUser } from "src/config";
import { createFeedFollow, getFeedFollowsForUser } from "src/lib/db/queries/feed_follows";
import { createFeed, getAllFeeds, getFeedByUrl } from "src/lib/db/queries/feeds";
import { createUser, getUserById, getUserByName, getUsers, resetUsers } from "src/lib/db/queries/users";
import { fetchFeed, printFeed } from "src/lib/rss/feed";

export type CommandHandler = (cmdName: string, ...args: string[]) => Promise<void>;

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
  let reset
  try {
    reset = await resetUsers();
  } catch (err: unknown) {
    throw new Error("Failed to reset users table");
  }
  console.log(`Deleted ${reset.length} users from table`);
}

export async function handlerUsers(cmdName: string, ...args: string[]) {
  let users
  try {
    users = await getUsers();
  } catch (err: unknown) {
    throw new Error("Failed to get users");
  }

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

export async function handlerAgg(cmdName: string, ...args: string[]) {
  let feed;
  try {
    feed = await fetchFeed("https://www.wagslane.dev/index.xml");
  } catch (err: unknown) {
    throw new Error("Failed to get rss feed");
  }
  const parsed = JSON.stringify(feed);
  console.log(parsed);
}

export async function handlerCreateFeed(cmdName: string, ...args: string[]) {
  if (!args[0] || !args[1]) {
    throw new Error("Name and URL must be passed as parameters");
  }

  const name = args[0];
  const url = args[1];
  const currentUser = readConfig().currentUserName;

  let user;

  try {
    user = await getUserByName(currentUser);
  } catch (err: unknown) {
    throw new Error("Failed to get user");
  }

  let feed;

  try {
    feed = await createFeed(name, url, user.id);
  } catch (err: unknown) {
    throw new Error("Failed to insert feed to database");
  }

  console.log(`Feed: ${name} was inserted succesfully`);

  let feedUserFollow;

  try {
    feedUserFollow = await createFeedFollow(user.id, feed.id);
  } catch (err: unknown) {
    throw new Error("Failed to automatically follow feed");
  }

  console.log(feedUserFollow.feedName);
  console.log(feedUserFollow.userName);
}

export async function handlerShowFeeds(cmdName: string, ...args: string[]) {
  let feeds;

  try {
    feeds = await getAllFeeds();
  } catch (err: unknown) {
    throw new Error("Failed to get all feeds");
  }

  for (const feed of feeds) {
    let user;

    try {
      user = await getUserById(feed.userId);
    } catch (err: unknown) {
      throw new Error("Failed to get user");
    }

    printFeed(feed, user);
  };
}

export async function handlerFollow(cmdName: string, ...args: string[]) {
  const url = args[0];
  const currentUserName = readConfig().currentUserName;

  let feed;

  try {
    feed = await getFeedByUrl(url);
  } catch (err: unknown) {
    throw new Error("Failed to get feed by its url");
  }

  let user;

  try {
    user = await getUserByName(currentUserName);
  } catch (err: unknown) {
    throw new Error("Failed to get user by its user name");
  }

  let feedUserFollow;

  try {
    feedUserFollow = await createFeedFollow(user.id, feed.id);
  } catch (err: unknown) {
    throw new Error("Failed to create feed follow");
  }

  console.log(`Feed name: ${feedUserFollow.feedName}`);
  console.log(`User name: ${feedUserFollow.userName}`);
}

export async function handlerFollowing(cmdName: string, ...args: string[]) {
  const currentUserName = readConfig().currentUserName;

  let user;

  try {
    user = await getUserByName(currentUserName);
  } catch (err: unknown) {
    throw new Error("Failed to get user");
  }

  let followedFeeds;

  try {
    followedFeeds = await getFeedFollowsForUser(user.id);
  } catch (err: unknown) {
    throw new Error("Failed to get the user's followed feeds");
  }

  followedFeeds.forEach(feed => console.log(feed.feedName));
}
