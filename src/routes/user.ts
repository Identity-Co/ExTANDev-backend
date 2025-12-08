import { Router } from "express";
import passport from "passport";
import { checkPermissions } from "../middlewares/middlewares";
import * as userController from "../controllers/user";

const router = Router();
const multer = require('multer');

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => cb(null, 'public/uploads/'),
  filename: (req: any, file: any, cb: any) => cb(null, `${Date.now()}-${file.originalname}`)
});

const upload = multer({ storage });

router.get(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("users"),
  userController.listAll
);

router.get("/list/:limit", 
  passport.authenticate("jwt", { session: false }),
  checkPermissions("users"),
  userController.listLimited
);

router.get(
  `/:id`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("single_users"),
  userController.getUser
);

router.post(
  `/`,
  passport.authenticate("jwt", { session: false }),
  checkPermissions("users"),
  userController.createUser
);

router.post(
  `/update/:id`,
  upload.single('file'),
  passport.authenticate("jwt", { session: false }),
  userController.updateUser
);

router.delete("/:id", 
  passport.authenticate("jwt", { session: false }),
  // checkPermissions("roles", "deleteUser"),
  userController.deleteUser
);

router.post(
  "/signup",
  userController.createUser
);

router.post(
  `/change_pass`,
  passport.authenticate("jwt", { session: false }),
  userController.changePassword
);

export default router;
