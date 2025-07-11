import type { Request, Response, NextFunction } from "express";
import { access, writeFile, constants, appendFile } from "node:fs/promises";
import * as path from "node:path";

const LOG_DIR = path.join(__dirname, "..", "..", "logs");
const LOG_FILE = path.join(LOG_DIR, "logs.txt");

export async function addLogMessage(message: string): Promise<void> {
  try {
    if (message.length > 20) {
      await appendFile(LOG_FILE, message + "\n");
    } else {
      throw Error("message is not as expected. Please check format.");
    }
  } catch (error) {}
}

async function fileExists(): Promise<boolean> {
  try {
    await access(LOG_FILE, constants.F_OK);
    return true;
  } catch (error) {
    return false;
  }
}

async function createLogFile(): Promise<void> {
  try {
    writeFile(LOG_FILE, "", {
      encoding: "utf8",
    });
  } catch (error) {
    console.error(error);
  }
}
fileExists()
  .then(async (fileExists: boolean) => {
    if (!fileExists) {
      await createLogFile();
    }
  })
  .catch((error) => {
    console.error(error);
  });

/**
 * Definition of log entry
 *
 * fields:
 *  - current date & time
 *  - http method
 *  - IP adress
 *  - url
 */
export async function logger(req: Request, res: Response, next: NextFunction) {
  const { ip, method, originalUrl: url } = req;

  /** dateTime */
  const dateTime = new Date().toISOString();

  const log = [dateTime, method, ip, url].join(" ");
  await addLogMessage(log);
  next();
}
