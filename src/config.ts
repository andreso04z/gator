import fs from "fs";
import os from "os";
import path from "path";

type Config = {
  dbUrl: string;
  currentUserName: string;
};

export function getConfigFilePath() {
  const homeDir = os.homedir();
  const configFileName = ".gatorconfig.json";
  return path.join(homeDir, configFileName);
}

export function setUser(userName: string) {
  const fullPath = getConfigFilePath();
  const config: Config = readConfig();

  const formatted = {
    current_user_name: userName,
    db_url: config.dbUrl,
  }

  const configString = JSON.stringify(formatted, null, 2);
  fs.writeFileSync(fullPath, configString, "utf-8");
}

export function readConfig() {
  const fullPath = getConfigFilePath();
  const content = fs.readFileSync(fullPath, "utf-8");
  const parsed = JSON.parse(content);

  const config: Config = {
    currentUserName: parsed.current_user_name,
    dbUrl: parsed.db_url,
  }

  return config;
}
