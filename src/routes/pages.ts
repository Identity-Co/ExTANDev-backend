import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as pagesController from "../controllers/pages";

const router = Router();
const multer = require('multer');

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, 'public/uploads/pages/'),
  filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

// Admin Route
router.get(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("pages"),
  pagesController.listAll
);

router.get(
  `/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("pages"),
  pagesController.getPage
);

router.post(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("pages"),
  pagesController.createPage
);

router.get(
  `/data/:pg`,
  pagesController.getPageData
);
  // passport.authenticate("jwt", { session: false }),

router.post(
  `/update_data/:pg`,
  upload.any(),
  passport.authenticate("jwt", { session: false }),
  pagesController.updatePageData
);

router.post(
  `/update/:id`,
  upload.single('file'),
  passport.authenticate("jwt", { session: false }),
  pagesController.updatePage
);

router.post(
  `/create/static_page`,
  upload.any(),
  passport.authenticate("jwt", { session: false }),
  pagesController.createStaticPageData
);

router.post(
  `/update/static_page/:id`,
  upload.any(),
  passport.authenticate("jwt", { session: false }),
  pagesController.updateStaticPageData
);

router.get(
  `/static_page/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("pages"),
  pagesController.getStaticPageData
);

router.get(
  `/get/static_page/:pg`,
  //passport.authenticate("jwt", { session: false }),
  //checkPermissions("pages"),
  pagesController.getStaticPage
);

router.delete("/:id", 
  passport.authenticate("jwt", { session: false }),
  checkPermissions("pages"),
  pagesController.deletePage
);

// Public Route
router.get("/list", 
  pagesController.listAll
);

router.get(
  `/slug/:slug`,
  pagesController.getPageBySlug
);

export default router;
