import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as reviewsController from "../controllers/reviews";

const router = Router();

// Admin Route
router.get(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("reviewEntry"),
  reviewsController.listAll
);

router.get(
  `/:id`,
  reviewsController.getEntry
);

router.post(
  `/update_status/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("reviewEntry"),
  reviewsController.updateStatus
);

router.post(
  `/review/collection/id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("reviewEntry"),
  reviewsController.getReviewsByCollectionId
);

router.delete("/:id", 
  passport.authenticate("jwt", { session: false }),
  checkPermissions("reviewEntry"),
  reviewsController.deleteEntry
);

//Public
router.post(
  `/`,
  reviewsController.createEntry
);

router.post("/public/list", 
  reviewsController.getReviews
);

export default router;
