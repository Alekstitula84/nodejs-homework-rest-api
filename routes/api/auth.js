const express = require("express");
const ctrl = require("../../controllers/auth");

const { validateBody, authenticate, upload } = require("../../middleWares");
const { schemas } = require("../../models/users");

const router = express.Router();

router.post("/register", validateBody(schemas.registerSchema), ctrl.register);

router.get("/verify/:verificationCode", ctrl.verifyEmail);

router.post("/login", validateBody(schemas.loginSchema), ctrl.login);

router.get("/current", authenticate, ctrl.getCurrent);

router.post("/verify", validateBody(schemas.emailSchena), ctrl.resendVerifyEmail);

router.post("/logout", authenticate, ctrl.logout);

router.patch(
    "/avatars",
    authenticate,
    upload.single("avatar"),
    ctrl.updateAvatar
);
module.exports = router;