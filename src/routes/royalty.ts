import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as royaltyController from "../controllers/royalty";

const router = Router();
const multer = require('multer');

// Admin Route
router.get(
  `/get-royalty-parameters`,
  passport.authenticate("jwt", { session: false }),
  royaltyController.getRoyaltyParameters
);

router.post(
  `/update-royalty-parameter/:key`,
  passport.authenticate("jwt", { session: false }),
  royaltyController.updateRoyaltyParameters
);


router.get(
  `/get-action-list`,
  passport.authenticate("jwt", { session: false }),
  royaltyController.getActionList
);

router.get(
  `/get-total-earned`,
  passport.authenticate("jwt", { session: false }),
  royaltyController.getTotalEarned
);

router.get(
  `/get-total-redeemed`,
  passport.authenticate("jwt", { session: false }),
  royaltyController.getTotalRedeemed
);

router.get(
  `/get-current-balance`,
  passport.authenticate("jwt", { session: false }),
  royaltyController.getCurrentBalance
);

/*router.post(
  `/get-action-by-code`,
  passport.authenticate("jwt", { session: false }),
  royaltyController.getActionByCode
);*/

router.get(
  `/get-points-by-code/:code`,
  royaltyController.getPointsByCode
);

router.get(
  `/get-points-history`,
  passport.authenticate("jwt", { session: false }),
  royaltyController.getPointsHistory
);

router.post(
  `/save-point-history`,
  royaltyController.savePointsHistory
);

router.post(
  `/remove-point-history`,
  royaltyController.removePointsHistory
);

router.post(
  `/check-points-history-exist`,
  royaltyController.checkPointsHistoryExist
);


export default router;
