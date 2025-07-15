import express from "express";
import {
  getMessageController,
  postMesssageController,
} from "../controllers/messageController";
import { body } from "express-validator";
import {
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  PASSWORD_MIN_LENGTH,
} from "../app";
import {
  getIndexController,
  postIndexController,
} from "../controllers/indexController";

const router = express.Router();

/**
 * Routes
 */

/**
 * Index route - main entry point in the app
 *
 * shows a form to send messages optionally password protected.
 */
router.get("/", getIndexController);

/**
 * Index Post route - for sending the message optionally including a password
 */
router.post(
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
  postIndexController,
);

/**
 * password protected route to the message
 */
router.post(
  "/message/:id",
  body("password")
    .matches(/^[^<>&'"\/]+$/)
    .escape()
    .isLength({ min: PASSWORD_MIN_LENGTH }),
  postMesssageController,
);

/**
 *  route to the message without a set password
 */
router.get("/message/:id", getMessageController);

export default router;
