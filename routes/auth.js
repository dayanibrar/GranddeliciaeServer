import express from "express";

const router = express.Router();

// middleware
import { requireSignin } from "../middlewares";

// controllers
import {
  register,
  login,
  logout,
  currentUser,
  forgotPassword,
  resetPassword,
  updateProfileAuth,
  updateprofile,
} from "../controllers/auth";

router.post("/register", register);
router.post("/login", login);
router.get("/logout", logout);
router.get("/current-user", requireSignin, currentUser);
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);
router.post("/update-profile-auth", updateProfileAuth);
router.post("/update-profile", updateprofile);
 

module.exports = router;
