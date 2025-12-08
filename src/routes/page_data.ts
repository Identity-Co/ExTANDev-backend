import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as homepgController from "../controllers/home_page";

const router = Router();
const multer = require('multer');

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, 'public/uploads/homepage/'),
  filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

// Admin Route
router.post(
  `/update`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("cms-home"),
  homepgController.updateSection
);

router.get("/:section",
  passport.authenticate("jwt", { session: false }),
  checkPermissions("cms-home"), 
  homepgController.getSection
);

router.post(
  `/update/:id`,
  upload.fields([
    { name: "about_file", maxCount: 1 },
    { name: "adventure_file", maxCount: 1 },
  ]),
  passport.authenticate("jwt", { session: false }),
  homepgController.updateSection
);

// Public Route
router.get("/", 
  homepgController.pageData
);

export default router;
