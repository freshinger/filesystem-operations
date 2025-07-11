require("dotenv").config();

import express, { Request, Response } from "express";
import nunjucks from "nunjucks";
import { logger } from "./middlewares/loggerMiddleware";
import { MessageService } from "./classes/MessageService";

const app = express();
nunjucks.configure("src/templates", {
  autoescape: true,
  express: app,
});
const port = process.env.PORT || 3000;

app.use(logger);

app.get("/", async (req: Request, res: Response) => {
  const messageService = new MessageService();
  const messageId = await messageService.createMessage();

  res.render("index.html", {
    link: `/message/${messageId}`,
  });
});

app.get("/message/:id", async (req: Request, res: Response) => {
  const messageService = new MessageService();
  try {
    const message = await messageService.getMessage(req.params.id);
    res.render("message.html", {
      id: req.params.id,
      message,
    });
  } catch (error) {
    res.status(404).render("404.html");
  }
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
