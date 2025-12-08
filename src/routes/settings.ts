import { Router } from "express";
import passport from "passport";
import * as settingController from "../controllers/settings";
import { checkPermissions } from "../middlewares/middlewares";

const router = Router();

router.post(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("settings"),
  settingController.create
);

router.post(
  `/reload-settings`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("settings"),
  settingController.reloadSetting
);

router.put(
  `/:settingId`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("settings"),
  settingController.update
);

router.delete(
  `/:settingId`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("settings"),
  settingController.deleteData
);

router.get(
  `/get-all-super-admin/:settingType`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("settings"),
  settingController.getAllSuperAdmin
);

router.get(
  `/get-all-company-admin/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("settings"),
  settingController.getAllCompanyAdminSetting
);

router.post(
  `/upsert-settings`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("settings"),
  settingController.upsert
);

export default router;
