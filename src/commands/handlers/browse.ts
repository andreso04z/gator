import { getPostsForUser } from "src/lib/db/queries/posts";
import { User } from "src/lib/db/schema";
import { rethrow } from "./rethrow";

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
