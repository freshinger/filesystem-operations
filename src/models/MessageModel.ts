import * as path from "node:path";
import { access, rm, writeFile, constants, readFile } from "node:fs/promises";
import { addLogMessage } from "../middlewares/loggerMiddleware";
import { v4 as uuidv4 } from "uuid";

interface disposableMessage {
  message: string;
  countdown: number;
}

class burnMessage implements disposableMessage {
  message: string;
  password: string;
  countdown: number = 1;
  constructor(message: string, password: string) {
    this.message = message;
    this.password = password;
    if (process.env.MESSAGE_TIMER) {
      this.countdown = Number.parseInt(process.env.MESSAGE_TIMER);
    }
  }
}

export class MessageModel {
  private PATH = path.join(__dirname, "..", "..", "messages");
  message: string;
  password: string;
  constructor(password: string = "", message: string = "") {
    this.message = message;
    this.password = password;
  }

  async getMessage(
    messageId: string,
    password: string = "",
  ): Promise<burnMessage | null | string> {
    return this.MessageExists(messageId)
      .then(
        async (messageExists: boolean) => {
          if (!messageExists) {
            await addLogMessage(
              "Message with id: " + messageId + " is nonexistent",
            );
            return Promise.reject("");
          } else {
            return await this.readMessage(messageId);
          }
        },
        () => {
          return null;
        },
      )
      .then((message) => {
        if (
          message?.password &&
          message?.password.length > 0 &&
          password.length == 0
        ) {
          return Promise.reject("nopassword");
        } else if (message?.password === password) {
          return message;
        } else {
          return Promise.reject("");
        }
      })
      .then(
        async (message) => {
          await this.updateMessage(messageId);
          if (message && typeof message.countdown !== undefined) {
            if (message?.countdown <= 1) {
              await this.deleteMessage(messageId);
            }
            return message;
          } else {
            return null;
          }
        },
        (reason) => {
          return reason;
        },
      )
      .catch(async (error) => {
        await addLogMessage(error);
      });
  }

  async MessageExists(messageId: string): Promise<boolean> {
    try {
      await access(this.PATH + "/" + messageId + ".json", constants.W_OK);
      return true;
    } catch (error) {
      return false;
    }
  }
  async readMessage(messageId: string): Promise<burnMessage | null> {
    try {
      const message = await readFile(this.PATH + "/" + messageId + ".json", {
        encoding: "utf8",
      });
      if (typeof message === undefined) {
        return null;
      } else {
        return JSON.parse(message);
      }
    } catch (error) {
      if (process.env.ENVIRONMENT == "DEV") {
        console.error(error);
      }
      throw error;
    }
  }

  async updateMessage(messageId: string): Promise<void> {
    try {
      const message = await this.readMessage(messageId);
      if (message && typeof message.countdown !== undefined) {
        message.countdown--;
      }
      if (message) {
        await this.saveMessage(messageId, message);
      }
    } catch (error) {
      if (process.env.ENVIRONMENT == "DEV") {
        console.error(error);
      }
      throw error;
    }
  }

  async saveMessage(messageId: string, message: burnMessage): Promise<void> {
    try {
      await writeFile(
        this.PATH + "/" + messageId + ".json",
        JSON.stringify(message),
        {
          encoding: "utf8",
        },
      );
    } catch (error) {
      if (process.env.ENVIRONMENT == "DEV") {
        console.error(error);
      }
      throw error;
    }
  }

  async deleteMessage(messageId: string): Promise<void> {
    try {
      await rm(this.PATH + "/" + messageId + ".json");
    } catch (error) {
      if (process.env.ENVIRONMENT == "DEV") {
        console.error(error);
      }
      throw error;
    }
  }

  async createMessage(): Promise<string> {
    try {
      let id = uuidv4();
      while (true) {
        if (await this.MessageExists(id)) {
          id = uuidv4();
        } else {
          break;
        }
      }
      const message = new burnMessage(this.password, this.message);

      await writeFile(this.PATH + "/" + id + ".json", JSON.stringify(message), {
        encoding: "utf8",
      });
      return id;
    } catch (error) {
      if (process.env.ENVIRONMENT == "DEV") {
        console.error(error);
      }
      throw error;
    }
  }
}
