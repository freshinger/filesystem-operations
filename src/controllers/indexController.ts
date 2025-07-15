import { matchedData, validationResult } from "express-validator";
import { ValidationService } from "../Services/ValidationService";
import type { Request, Response } from "express";
import { Messages } from "../classes/Messages";
import { credentials, domain, http_port, https_port } from "../app";

export const getIndexController = (req: Request, res: Response) => {
  res.render("../templates/index.html", {});
};

export const postIndexController = async (req: Request, res: Response) => {
  const result = validationResult(req);

  if (!result.isEmpty()) {
    const validationService = new ValidationService();
    return res.render(
      "../templates/index.html",
      validationService.validateMessage(req),
    );
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

    return res.render("../templates/index.html", {
      link,
    });
  }
};
