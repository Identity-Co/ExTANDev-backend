import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as settingsController from "../controllers/general_settings";

const router = Router();

router.post(
  `/update`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("generalSettings"),
  settingsController.updateGeneralSettings
);

router.get(
  `/get/all`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("generalSettings"),
  settingsController.getGeneralSettings
);

router.post(
  `/auth/get/by-keys`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("generalSettings"),
  settingsController.getSettingsByKeysAuth
);

router.get(
  `/public/get/by-keys`,
  settingsController.getPublicSettings
);


export default router;
