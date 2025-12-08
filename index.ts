import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import path from "path";
import passport from "passport";

const cron = require('node-cron');

import { errorHandler } from "./src/middlewares/error.middleware";
import { connectDb } from "./src/db";
import config from "./src/configs/constants";
import routes from "./src/routes/index";
import { loadConfigVariables } from "./src/helpers/load.config";
import delay from "./src/helpers/helper";

import "./src/utils/passport";
import fs from 'fs';

import { importTours } from './src/controllers/import-tours-api';

const app = express();
app.use(bodyParser.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));
app.use(passport.initialize()); // Initialize Passport middleware
app.use(express.static(path.join(__dirname, "public")));

app.use(cors());
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
loadConfigVariables();

app.get("/api/health-check", async (req, res) => {  
  res.status(config.statusCode.SUCCESS).send();
});

app.get("/api/myhealth", async (req, res) => {  
  res.status(config.statusCode.SUCCESS).send("Welcome to the Adventure Network API: " + new Date().toLocaleString());

  const logDir = path.join("public","logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  const logFile = path.join(logDir, "cron-errors.log");
  const timestamp = new Date().toISOString();
  const message = `Cron Running on: ${timestamp}\n`;

  fs.appendFileSync(logFile, message, { encoding: "utf8" });

  //await importTours();
});

cron.schedule('15 0 * * *', async () => {
  console.log('Running on:', new Date().toLocaleString());

  const logDir = path.join("public","logs");
  if (!fs.existsSync(logDir)) fs.mkdirSync(logDir);

  const logFile = path.join(logDir, "cron-errors.log");
  const timestamp = new Date().toISOString();
  const message = `Cron Running on: ${timestamp}\n`;

  fs.appendFileSync(logFile, message, { encoding: "utf8" });

  await importTours();
});

/* Routes */
app.use("/v1/api", routes);

app.get('/dir_permission', async (req, res) => {  
  let msg = "";
  const dirPath = path.join('public','uploads','banners');
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    msg += "Directory created";
  }

  try {
    fs.chmodSync(dirPath, 777);
    msg += " | Permissions changed to 777";
  } catch (err) {
    msg += " | Failed to change permissions: " + JSON.stringify(err);
  }
  res.status(config.statusCode.SUCCESS).send(msg);
})

/* Error Handler */
app.use(errorHandler);

app.listen(config.config.PORT, async () => {
  const response = await connectDb();
  if (!response) {
    console.error(`✅ Database Failed To Connect!`);
    process.exit(1);
  } else {
    console.info("Connected to database");
  }
  console.info(`✅ shop pluggable up and running on: ${process.env.PORT}`);
});
