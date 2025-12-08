import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as contactEntryController from "../controllers/contact_form_entries";

const router = Router();

// Admin Route
router.get(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("contactForm"),
  contactEntryController.listAll
);

router.get(
  `/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("contactForm"),
  contactEntryController.getEntry
);

router.delete("/:id", 
  passport.authenticate("jwt", { session: false }),
  checkPermissions("contactForm"),
  contactEntryController.deleteEntry
);

//Public
router.post(
  `/`,
  contactEntryController.createEntry
);

export default router;
