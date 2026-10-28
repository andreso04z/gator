import { scrapeFeeds } from "src/lib/rss/feed";

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
