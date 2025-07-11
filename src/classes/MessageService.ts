import * as path from "node:path";
import { access, rm, writeFile, constants, readFile } from "node:fs/promises";
import { addLogMessage } from "../middlewares/loggerMiddleware";
import { v4 as uuidv4 } from "uuid";
import * as fruits from "../data/fruits.json";

export class MessageService {
  private PATH = path.join(__dirname, "..", "..", "messages");

  async getMessage(messageId: string): Promise<string> {
    return this.MessageExists(messageId)
      .then(
        async (messageExists: boolean) => {
          if (!messageExists) {
            await addLogMessage(
              "Message with id: " + messageId + " is nonexistent",
            );
            return "nonexistent";
          } else {
            return await this.readMessage(messageId);
          }
        },
        () => {
          return "rejected";
        },
      )
      .then(
        async (message) => {
          if (typeof message !== undefined) {
            await this.deleteMessage(messageId);
            return message;
          } else {
            return "undefined";
          }
        },
        () => {
          return "rejected";
        },
      )
      .catch(async (error) => {
        console.error(error);
        await addLogMessage(error);
        return "error";
      });
  }

  async MessageExists(messageId: string): Promise<boolean> {
    try {
      await access(this.PATH + "/" + messageId + ".txt", constants.F_OK);
      return true;
    } catch (error) {
      return false;
    }
  }
  async readMessage(messageId: string): Promise<string> {
    try {
      const message = await readFile(this.PATH + "/" + messageId + ".txt", {
        encoding: "utf8",
      });
      if (typeof message === undefined) {
        return "undefined";
      } else {
        return message;
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
  async deleteMessage(messageId: string): Promise<void> {
    try {
      await rm(this.PATH + "/" + messageId + ".txt");
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async createMessage(): Promise<string> {
    try {
      const id = uuidv4();
      const fruit = fruits[Math.floor(Math.random() * fruits.length)];
      await writeFile(
        this.PATH + "/" + id + ".txt",
        `you should try out ${fruit.fruit} ${fruit.emoji}`,
        {
          encoding: "utf8",
        },
      );
      return id;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
