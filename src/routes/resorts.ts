import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as resortsController from "../controllers/resorts";

const router = Router();
const multer = require('multer');

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, 'public/uploads/resorts/'),
  filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

// Admin Routes

router.get(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("resorts"),
  resortsController.listAll
);

router.get(
  `/by/user`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("resorts"),
  resortsController.listAllByUser
);

router.post(
  `/create`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("resorts"),
  upload.any(),
  resortsController.createResort
);

router.get(
  `/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("resorts"),
  resortsController.getResort
);

router.post(
  `/update/:id`,
  upload.any(),
  passport.authenticate("jwt", { session: false }),
  checkPermissions("resorts"),
  resortsController.updateResort
);

router.delete(
  "/:id", 
  passport.authenticate("jwt", { session: false }),
  checkPermissions("resorts"),
  resortsController.deleteResorts
);

router.get(
  `/tags/unique`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("resorts"),
  resortsController.getAllUniqueTags
);

// Public Routes

router.get(
  `/slug/:slug`,
  resortsController.getResortBySlug
);

router.post(
  `/get/by-tag`,
  resortsController.getResortsByTag
);

export default router;