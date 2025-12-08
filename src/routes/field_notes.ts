import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as fieldNoteController from "../controllers/field_notes";

const router = Router();
const multer = require('multer');

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, 'public/uploads/field_notes/'),
  filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

// Admin Route
router.get(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("field_notes"),
  fieldNoteController.listAll
);

router.get(
  `/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("field_notes"),
  fieldNoteController.getFieldNote
);

router.post(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("field_notes"),
  fieldNoteController.createFieldNote
);

router.post(
  `/update/:id`,
  upload.single('file'),
  passport.authenticate("jwt", { session: false }),
  fieldNoteController.updateFieldNote
);

router.delete("/:id", 
  passport.authenticate("jwt", { session: false }),
  checkPermissions("field_notes"),
  fieldNoteController.deleteFieldNote
);

// Public Route
router.post("/list", 
  fieldNoteController.homePage
);

export default router;
