import { handlerAgg, handlerCreateFeed, handlerFollow, handlerFollowing, handlerLogin, handlerRegister, handlerReset, handlerShowFeeds, handlerUsers } from "./commands/handlers";
import { CommandsRegistry, registerCommand, runCommand } from "./commands/registry";

async function main() {
  const registry: CommandsRegistry = {};
  registerCommand(registry, "login", handlerLogin);
  registerCommand(registry, "register", handlerRegister);
  registerCommand(registry, "reset", handlerReset);
  registerCommand(registry, "users", handlerUsers);
  registerCommand(registry, "agg", handlerAgg);
  registerCommand(registry, "addfeed", handlerCreateFeed);
  registerCommand(registry, "feeds", handlerShowFeeds);
  registerCommand(registry, "follow", handlerFollow);
  registerCommand(registry, "following", handlerFollowing);

  const inputArgs = process.argv.slice(2);

  if (inputArgs.length < 1) {
    console.error("Not enough arguments provided");
    process.exit(1);
  }

  const cmdName = inputArgs[0];
  const cmdArgs = inputArgs.slice(1);

  await runCommand(registry, cmdName, ...cmdArgs)
  process.exit(0);
}

main();
