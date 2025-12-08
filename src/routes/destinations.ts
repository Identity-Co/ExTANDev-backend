import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as destinationController from "../controllers/destinations";

const router = Router();
const multer = require('multer');

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, 'public/uploads/destinations/'),
  filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

// Admin Route
router.get(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("destination"),
  destinationController.listAll
);

router.get(
  `/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("destination"),
  destinationController.getDestination
);

router.post(
  `/`,
  upload.any(),
  passport.authenticate("jwt", { session: false }),
  checkPermissions("destination"),
  destinationController.createDestination
);

router.post(
  `/update/:id`,
  upload.any(),
  passport.authenticate("jwt", { session: false }),
  destinationController.updateDestination
);

router.delete("/:id", 
  passport.authenticate("jwt", { session: false }),
  checkPermissions("destination"),
  destinationController.deleteDestination
);

router.get(
  `/resorts/list/all`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("destination"),
  destinationController.getAllResortsList
);

// Public Route
router.post("/list", 
  destinationController.homePage
);

router.get(
  `/slug/:slug`,
  destinationController.getDestinationBySlug
);

router.get(
  `/resort/get-by-ids`,
  destinationController.getResortsByIds
);

router.get(
  `/list/location`,
  destinationController.listAll
);

router.post("/filter", 
  destinationController.filterDestinations
);

router.post("/adventure/:id", 
  destinationController.filterDestinationsAdventures
);

router.post("/filter-resorts-by-destination", 
  destinationController.filterResortsByDestination
);

router.post("/filter-destination-by-tags", 
  destinationController.filterDestinationsByTags
);

export default router;
