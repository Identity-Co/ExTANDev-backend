import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as adventureGuideController from "../controllers/adventure_guide";

const router = Router();
const multer = require('multer');

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, 'public/uploads/adventure_guide/'),
  filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

const uploadFields = upload.fields([
  { name: "feature_image", maxCount: 1 },
  { name: "banner_image", maxCount: 1 },
  { name: "author_image", maxCount: 1 },
  { name: "site_logo", maxCount: 1 },
  { name: "section_images", maxCount: 100 }, // repeater images
]);


// Admin Route
router.get(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("adventure_guide"),
  adventureGuideController.listAll
);

router.get(
  `/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("adventure_guide"),
  adventureGuideController.getAdventureGuide
);

router.post(
  `/create`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("adventure_guide"),
  uploadFields,
  adventureGuideController.createAdventureGuide
);

router.post(
  `/update/:id`,
  passport.authenticate("jwt", { session: false }),
  uploadFields,
  adventureGuideController.updateAdventureGuide
);

router.delete("/:id", 
  passport.authenticate("jwt", { session: false }),
  checkPermissions("adventure_guide"),
  adventureGuideController.deleteAdventureGuide
);

router.get(
  `/public/user`,
  passport.authenticate("jwt", { session: false }),
  adventureGuideController.listByCurrentUser
);

// Public Route
router.post("/list", 
  adventureGuideController.homePage
);

router.post(`/public/page`,
  adventureGuideController.adv_guide
);

router.post(
  `/slug/`,
  adventureGuideController.getAdventureGuideBySlug
);

export default router;
