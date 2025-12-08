import { Router } from "express";
import passport from "passport";

const router = Router();

import * as authController from "../controllers/auth";

router.post("/login", authController.login);

router.post(
  "/set-security-questions",
  passport.authenticate("jwt", { session: false }),
  authController.setSecurityQuestions
);

router.get("/get-security-questions", authController.getSecurityQuestions);

router.post("/forget-password-request", authController.forgetPasswordRequest);

router.post("/forget-password", authController.forgetPassword);

// alias login route
router.post("/login-as-user", authController.loginAsUser);

router.post('/google-login', authController.glogin);

router.post('/facebook-login', authController.flogin);

export default router;
