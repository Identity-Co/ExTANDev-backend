import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as toursController from "../controllers/tours";

const router = Router();
const multer = require('multer');

// Admin Route
router.get(`/get-locations`,
  toursController.getUniqueLocations
);

router.get(`/get-activities`,
  toursController.getUniqueActivities
);

router.get(`/get-destinations-by-activity`,
  toursController.getDestinationsByActivity
);

router.get(`/get-categories`,
  toursController.getUsedCategories
);

router.get(`/get-destinations-by-category`,
  toursController.getDestinationsByCategory
);

router.get(`/list-all`,
  toursController.listAll
);




router.get(`/get-custom-categories`,
  toursController.getCustomCategories
);

router.get(`/get-destinations-by-custom-category`,
  toursController.getDestinationsByCustomCategory
);

router.get(`/get-custom-category-by-destination`,
  toursController.getCustomCategoryByDestination
);

router.get(`/filter-tours`,
  toursController.filterTours
);

router.get(`/filter-count`,
  toursController.filterToursCount
);

// Details Screen Routes
router.get(`/get-all-categories`,
  toursController.getAllCategories
);
router.get(`/get-tour-by-slug`,
  toursController.getTourBySlug
);
router.get(`/get-tour-by-id/:tour_id`,
  toursController.getTourById
);
router.get(`/get-activities-by-ids`,
  toursController.getActivitiesByIds
);
router.get(`/get-tours-by-ids`,
  toursController.getToursByIds
);
router.get(`/get-tour-activities`,
  passport.authenticate("jwt", { session: false }),
  toursController.getTourActivities
);

router.post(
  `/get/by-location`,
  toursController.getToursByLocation
);

// Property Owner Routes
router.get(`/get-user-tours/:id`,
  passport.authenticate("jwt", { session: false }),
  toursController.getUserProperties
);


export default router;
