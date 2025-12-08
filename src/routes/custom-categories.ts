import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as categoryController from "../controllers/custom-categories";

const router = Router();
const multer = require('multer');

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, 'public/uploads/custom_category/'),
  filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

// Admin Route
router.get(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("custom-categories"),
  categoryController.listAll
);

router.get(
  `/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("custom-categories"),
  categoryController.getCustomCategory
);

router.post(
  `/`,
  upload.single('file'),
  passport.authenticate("jwt", { session: false }),
  checkPermissions("custom-categories"),
  categoryController.createCustomCategory
);

router.post(
  `/update/:id`,
  upload.single('file'),
  passport.authenticate("jwt", { session: false }),
  checkPermissions("custom-categories"),
  categoryController.updateCustomCategory
);

router.delete("/:id", 
  passport.authenticate("jwt", { session: false }),
  checkPermissions("custom-categories"),
  categoryController.deleteCustomCategory
);

export default router;
