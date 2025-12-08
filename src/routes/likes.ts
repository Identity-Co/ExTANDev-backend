import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as likesController from "../controllers/likes";

const router = Router();

//Public
router.post(
  `/add-like`,
  likesController.addLike
);

router.post(
  `/remove-like`,
  likesController.removeLike
);

router.post(
  `/likes-count-status`,
  likesController.getLikesCountAndStatus
);

router.post(
  `/user/liked-list`,
  likesController.getUserLikes
);

export default router;
