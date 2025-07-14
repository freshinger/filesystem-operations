import { Request } from "express";
import { FormValidationResponse } from "../classes/FormValidationResponse";
import {
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "../app";
import type { validatedMessageInfo } from "../types";

export class ValidationService {
  validateMessage(req: Request): validatedMessageInfo {
    const messageResult = new FormValidationResponse();
    const passwordResult = new FormValidationResponse();
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
    return {
      message: req.body.message,
      messageResult,
      passwordResult,
      passwordProtection,
    };
  }
}
