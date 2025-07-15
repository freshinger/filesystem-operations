require("dotenv").config();

import express from "express";
import nunjucks from "nunjucks";
import { logger } from "./middlewares/loggerMiddleware";
import { readFileSync } from "node:fs";
import https from "node:https";
import http from "node:http";
import helmet from "helmet";
import publicRoutes from "./routes/publicRoutes";

const pathToKey = process.env.PRIVATE_KEY || "";
const pathToCert = process.env.SERVER_CERT || "";
export const PASSWORD_MIN_LENGTH = 8;
export const MESSAGE_MAX_LENGTH = 1024;
export const MESSAGE_MIN_LENGTH = 3;
export let domain = process.env.DOMAIN || "localhost";
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
export const credentials = { key: pKey, cert: crt };

const app = express();
nunjucks.configure("src/templates", {
  autoescape: true,
  express: app,
});
export const https_port = process.env.HTTPS_PORT || 8443;
export const http_port = process.env.HTTP_PORT || 8080;

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
app.use(publicRoutes);

if (credentials.cert !== "" && credentials.key !== "") {
  const httpsServer = https.createServer(credentials, app);
  httpsServer.listen(https_port);
  console.log(`running on https://${domain}:${https_port}`);
} else {
  const httpServer = http.createServer(app);
  httpServer.listen(http_port);
  console.log(`running on http://${domain}:${http_port}`);
}
