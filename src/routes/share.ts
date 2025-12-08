import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as shareController from "../controllers/share";

const router = Router();

router.post(
  `/collection/get`,
  shareController.getCollectionData
);

export default router;