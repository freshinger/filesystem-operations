import { validationResult, matchedData } from "express-validator";
import { Messages } from "../classes/Messages";
import type { Request, Response } from "express";

export const postMesssageController = async (req: Request, res: Response) => {
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
};

export const getMessageController = async (req: Request, res: Response) => {
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
};
