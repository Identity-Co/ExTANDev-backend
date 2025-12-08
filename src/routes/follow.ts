import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as followController from "../controllers/follows";

const router = Router();

//Public
router.post(
  `/add`,
  followController.addFollow
);

router.post(
  `/remove`,
  followController.removeFollow
);

router.post(
  `/follow-status`,
  followController.getFollowStatus
);

export default router;