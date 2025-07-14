require("dotenv").config();

import express, { Request, Response } from "express";
import nunjucks from "nunjucks";
import { logger } from "./middlewares/loggerMiddleware";
import { Messages } from "./classes/Messages";
import { readFileSync } from "node:fs";
import https from "node:https";
import http from "node:http";
import helmet from "helmet";
import { body, matchedData, validationResult } from "express-validator";
import { ValidationService } from "./Services/ValidationService";

const pathToKey = process.env.PRIVATE_KEY || "";
const pathToCert = process.env.SERVER_CERT || "";
export const PASSWORD_MIN_LENGTH = 8;
export const MESSAGE_MAX_LENGTH = 1024;
export const MESSAGE_MIN_LENGTH = 3;
let domain = process.env.DOMAIN || "localhost";
if (process.env.ENVIRONMENT == "DEV") {
  domain = "localhost";
}
let pKey = "";
if (pathToKey != "") {
  pKey = readFileSync(pathToKey, "utf8");
}
let crt = "";
if (pathToCert != "") {
  crt = readFileSync(pathToCert, "utf8");
}
const credentials = { key: pKey, cert: crt };

const app = express();
nunjucks.configure("src/templates", {
  autoescape: true,
  express: app,
});
const https_port = process.env.HTTPS_PORT || 8443;
const http_port = process.env.HTTP_PORT || 8080;

/**
 * Middlewares
 */

app.use(helmet());
app.use(logger);
app.use(
  express.urlencoded({
    extended: true,
  }),
); // for consuming forms
app.use(express.static("public"));

/**
 * Routes
 */

app.get("/", async (req: Request, res: Response) => {
  res.render("index.html", {});
});

app.post(
  "/",
  body("message")
    .notEmpty()
    .escape()
    .isString()
    .isLength({ max: MESSAGE_MAX_LENGTH, min: MESSAGE_MIN_LENGTH }),
  body("password")
    .if(body("password").notEmpty())
    .matches(/^[^<>&'"\/]+$/)
    .escape()
    .isLength({ min: PASSWORD_MIN_LENGTH }),
  async (req: Request, res: Response) => {
    const result = validationResult(req);

    if (!result.isEmpty()) {
      const validationService = new ValidationService();
      return res.render("index.html", validationService.validateMessage(req));
    } else {
      const data = matchedData(req);
      let messageService;
      if (req.body.password && req.body.password.trim().length === 0) {
        messageService = new Messages(data.message);
      } else {
        messageService = new Messages(data.message, data.password);
      }
      const messageId = await messageService.createMessage();

      let link = `http://${domain}:${http_port}/message/${messageId}`;
      if (credentials.cert !== "" && credentials.key !== "") {
        link = `https://${domain}:${https_port}/message/${messageId}`;
      }

      return res.render("index.html", {
        link,
      });
    }
  },
);

app.post(
  "/message/:id",
  body("password")
    .matches(/^[^<>&'"\/]+$/)
    .escape()
    .isLength({ min: PASSWORD_MIN_LENGTH }),
  async (req: Request, res: Response) => {
    const result = validationResult(req);
    if (!result.isEmpty()) {
      return res.render("messagePasswordProtected.html", {
        id: req.params.id,
        error: "Wrong Password!<br /> ",
      });
    } else {
      const data = matchedData(req);
      const messageService = new Messages();
      try {
        const message = await messageService.getMessage(
          req.params.id,
          data.password,
        );

        if (typeof message !== "string") {
          res.render("message.html", {
            id: req.params.id,
            message: message?.message,
          });
        }
      } catch (error) {
        res.status(404).render("404.html");
      }
    }
  },
);

app.get("/message/:id", async (req: Request, res: Response) => {
  const messageService = new Messages();
  try {
    const message = await messageService.getMessage(req.params.id);

    if (typeof message == "string" && message == "nopassword") {
      res.render("messagePasswordProtected.html", {
        id: req.params.id,
        error: "Message is password protected",
      });
    } else if (typeof message !== "string") {
      res.render("message.html", {
        id: req.params.id,
        message: message?.message,
      });
    } else {
      res.status(404).render("404.html");
    }
  } catch (error) {
    res.status(404).render("404.html");
  }
});

if (credentials.cert !== "" && credentials.key !== "") {
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(https_port);
  console.log(`running on https://${domain}:${https_port}}`);
} else {
  const httpServer = http.createServer(app);
  httpServer.listen(http_port);
  console.log(`running on http://${domain}:${http_port}`);
}
