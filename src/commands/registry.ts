import { User } from "src/lib/db/schema";
import { CommandHandler } from "./handlers"

export type CommandsRegistry = Record<string, CommandHandler>;

export function registerCommand(registry: CommandsRegistry, cmdName: string, handler: CommandHandler) {
  registry[cmdName] = handler;
  return registry;
}

export async function runCommand(registry: CommandsRegistry, cmdName: string, ...args: string[]) {
  const command = registry[cmdName];
  if (!command) {
    throw new Error("Command not registered");
  }
  await command(cmdName, ...args);
}

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void> | void;
