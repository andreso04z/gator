# Gator

A command-line RSS feed aggregator. Follow feeds, scrape posts into Postgres, and browse the latest articles in your terminal.

Built for [Boot.dev](https://www.boot.dev)'s **Build a Blog Aggregator in TypeScript** course to strengthen TypeScript, Postgres, and CLI fundamentals.

## Setup

1. Create a Postgres database.
2. Add `~/.gatorconfig.json`:

```json
{
  "db_url": "postgres://postgres:postgres@localhost:5432/gator?sslmode=disable",
  "current_user_name": ""
}
```

3. Install dependencies and run migrations:

```bash
npm install
npm run migrate
```

## Usage

```bash
npm start -- <command> [args]
```

| Command | Description |
| --- | --- |
| `register <name>` | Create a user and log in |
| `login <name>` | Switch to an existing user |
| `users` | List users |
| `reset` | Delete all users (and cascaded data) |
| `addfeed <name> <url>` | Add a feed and follow it |
| `feeds` | List all feeds |
| `follow <url>` | Follow an existing feed |
| `following` | List feeds you follow |
| `unfollow <url>` | Unfollow a feed |
| `agg <duration>` | Scrape feeds on an interval (`1s`, `1m`, `1h`) |
| `browse [limit]` | Show latest posts from followed feeds (default 2) |

Example:

```bash
npm start -- register alice
npm start -- addfeed "TechCrunch" https://techcrunch.com/feed/
npm start -- agg 1m
npm start -- browse 5
```

Stop the aggregator with `Ctrl+C`.
