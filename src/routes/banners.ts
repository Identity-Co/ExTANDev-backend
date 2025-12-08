import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as bannerController from "../controllers/banner";

const router = Router();
const multer = require('multer');

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, 'public/uploads/banners/'),
  filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

// Admin Route
router.get(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("banners"),
  bannerController.listAll
);

router.get(
  `/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("banners"),
  bannerController.getBanner
);

router.post(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("banners"),
  bannerController.createBanner
);

router.post(
  `/update/:id`,
  upload.single('file'),
  passport.authenticate("jwt", { session: false }),
  bannerController.updateBanner
);

router.delete("/:id", 
  passport.authenticate("jwt", { session: false }),
  checkPermissions("banners"),
  bannerController.deleteBanner
);

// Public Route
router.get("/list/:pg", 
  bannerController.listAllByPage
);

export default router;
