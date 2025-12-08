import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as savedController from "../controllers/saved";

const router = Router();

//Public
router.post(
  `/add-saved`,
  savedController.addSaved
);

router.post(
  `/remove-saved`,
  savedController.removeShaved
);

router.post(
  `/saved-status`,
  savedController.getSavedStatus
);

router.post(
  `/user/saved-list`,
  savedController.getUserSaved
);

export default router;
