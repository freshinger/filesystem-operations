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
import { FormValidationResponse } from "./classes/FormValidationResponse";

const pathToKey = process.env.PRIVATE_KEY || "";
const pathToCert = process.env.SERVER_CERT || "";
const PASSWORD_MIN_LENGTH = 8;
const MESSAGE_MAX_LENGTH = 1024;
const MESSAGE_MIN_LENGTH = 3;

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
    const messageResult = new FormValidationResponse();
    const passwordResult = new FormValidationResponse();

    if (!result.isEmpty()) {
      if (!req.body.message || req.body.message.length === 0) {
        messageResult.addMessage("Message was empty!");
      } else if (req.body.message.length > MESSAGE_MAX_LENGTH) {
        messageResult.addMessage("Message was too long!");
      } else if (req.body.message.length < MESSAGE_MIN_LENGTH) {
        messageResult.addMessage("Message was too short!");
      }
      if (!req.body.password || req.body.password.length === 0) {
        passwordResult.addMessage("Password was empty!");
      } else if (req.body.password.length < PASSWORD_MIN_LENGTH) {
        passwordResult.addMessage("Password was too short!");
      } else if (!req.body.password.match(/^[^<>&'"\/]+$/)) {
        passwordResult.addMessage("Password contains illegal characters!");
      }
      let passwordProtection = false;
      if (req.body.passwordProtection) {
        passwordProtection = true;
      }

      return res.render("index.html", {
        message: req.body.message,
        messageResult,
        passwordResult,
        passwordProtection,
      });
    } else {
      const data = matchedData(req);
      let messageService;
      if (req.body.password && req.body.password.trim().length === 0) {
        messageService = new Messages(data.message);
      } else {
        messageService = new Messages(data.message, data.password);
      }
      const messageId = await messageService.createMessage();

      let link = `http://localhost:${http_port}/message/${messageId}`;
      if (credentials.cert !== "" && credentials.key !== "") {
        link = `https://localhost:${https_port}/message/${messageId}`;
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
        if (error instanceof Error && error.message == "wrongPassword") {
          res.render("messagePasswordProtected.html", {
            id: req.params.id,
            error: "password is wrong!<br/>",
          });
        } else {
          res.status(404).render("404.html");
        }
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
    }
  } catch (error) {
    console.error("over here");
    if (error instanceof Error && error.message == "wrongPassword") {
      res.render("messagePasswordProtected.html", {
        id: req.params.id,
        error: "Message is password protected",
      });
    } else {
      res.status(404).render("404.html");
    }
  }
});

if (credentials.cert !== "" && credentials.key !== "") {
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(https_port);
  console.log("running on https://localhost:" + https_port);
} else {
  const httpServer = http.createServer(app);
  httpServer.listen(http_port);
  console.log("running on http://localhost:" + http_port);
}
