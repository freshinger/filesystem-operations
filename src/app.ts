require("dotenv").config();

import express, { Request, Response } from "express";
import nunjucks from "nunjucks";
import { logger } from "./middlewares/loggerMiddleware";
import { MessageService } from "./classes/MessageService";
import { readFileSync } from "node:fs";
import https from "node:https";
import http from "node:http";
import helmet from "helmet";
import { body, matchedData, validationResult } from "express-validator";

const pathToKey = process.env.PRIVATE_KEY || "";
const pathToCert = process.env.SERVER_CERT || "";

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

/**
 * Routes
 */

app.get("/", async (req: Request, res: Response) => {
  //const messageService = new MessageService();
  //const messageId = await messageService.createMessage();

  res.render("index.html", {});
});

app.post(
  "/message",
  body("message").notEmpty().escape().isString().isLength({ max: 600 }),
  async (req: Request, res: Response) => {
    //Todo sanitize post fields
    console.log(req.body.message);
    const result = validationResult(req);
    if (!result.isEmpty()) {
      console.warn(result.array());
      return res.render("index.html", {
        error: "Fehler aufgetreten.",
      });
    } else {
      const data = matchedData(req);
      const messageService = new MessageService(data.message);
      const messageId = await messageService.createMessage();
      return res.render("index.html", {
        link: `/message/${messageId}`,
      });
    }
  },
);

app.get("/message/:id", async (req: Request, res: Response) => {
  const messageService = new MessageService();
  try {
    const message = await messageService.getMessage(req.params.id);
    res.render("message.html", {
      id: req.params.id,
      message: message?.message,
    });
  } catch (error) {
    res.status(404).render("404.html");
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

//app.listen(port, () => {
//  console.log(`Example app listening on port ${port}`);
//});
