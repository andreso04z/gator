import { readConfig, setUser } from "src/config";
import { createUser, getUserByName, getUsers, resetUsers } from "src/lib/db/queries/users";
import { rethrow } from "./rethrow";

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
