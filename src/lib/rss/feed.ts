import { XMLParser } from "fast-xml-parser";
import { Feed, InsertPost, User } from "../db/schema";
import { getNextFeedToFetch, markFeedFetched } from "../db/queries/feeds";
import { createPost } from "../db/queries/posts";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description?: string;
  pubDate?: string;
};

export async function fetchFeed(feedURL: string) {
  const res = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
      accept: "application/rss+xml",
    },
  });
  if (!res.ok) {
    throw new Error(`failed to fetch feed: ${res.status} ${res.statusText}`);
  }

  const xml = await res.text();
  const parser = new XMLParser({
    processEntities: false,
  });
  let result = parser.parse(xml);

  const channel = result.rss?.channel;
  if (!channel) {
    throw new Error("failed to parse channel");
  }

  if (
    !channel ||
    !channel.title ||
    !channel.link ||
    !channel.description ||
    !channel.item
  ) {
    throw new Error("failed to parse channel");
  }

  const items: any[] = Array.isArray(channel.item)
    ? channel.item
    : [channel.item];

  const rssItems: RSSItem[] = [];

  for (const item of items) {
    if (!item.title || !item.link) {
      continue;
    }

    rssItems.push({
      title: item.title,
      link: item.link,
      description: item.description,
      pubDate: item.pubDate,
    });
  }

  const rss: RSSFeed = {
    channel: {
      title: channel.title,
      link: channel.link,
      description: channel.description,
      item: rssItems,
    },
  };

  return rss;
}

function parsePublishedAt(pubDate: string | undefined): Date | undefined {
  if (!pubDate) {
    return undefined;
  }

  const publishedAt = new Date(pubDate);
  if (Number.isNaN(publishedAt.getTime())) {
    return undefined;
  }

  return publishedAt;
}

export function printFeed(feed: Feed, user: User) {
  console.log(`* Name: ${feed.name}`);
  console.log(`* URL:  ${feed.url}`);
  console.log(`* User: ${user.name}`);
}

export async function scrapeFeeds() {
  let nextFeed;

  try {
    nextFeed = await getNextFeedToFetch();
  } catch (err: unknown) {
    throw new Error("Failed to fetch next feed");
  }

  if (!nextFeed) {
    console.log("No feeds pending to fetch");
    return;
  }

  let feedData;

  try {
    feedData = await fetchFeed(nextFeed.url);
  } catch (err: unknown) {
    throw new Error("Failed to fetch feed");
  }

  try {
    await markFeedFetched(nextFeed.id);
  } catch (err: unknown) {
    throw new Error("Failed to fetch feed");
  }

  let savedCount = 0;

  for (const item of feedData.channel.item) {
    const post: InsertPost = {
      title: item.title,
      url: item.link,
      description: item.description || undefined,
      publishedAt: parsePublishedAt(item.pubDate),
      feedId: nextFeed.id,
    };

    const saved = await createPost(post);
    if (saved) {
      savedCount += 1;
    }
  }

  console.log(`Saved ${savedCount} posts from ${nextFeed.name}`);
}
