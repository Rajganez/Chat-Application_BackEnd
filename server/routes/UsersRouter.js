import { Router } from "express";
import {
  buddyDP,
  buddyProfile,
  loginBuddy,
  logOut,
  removeBuddyDP,
  signup,
  verifyBuddy,
  verifyMail,
} from "../controllers/UsersController.js";
import multer from "multer";
import { verifyToken } from "../middlewares/verifyToken.js";

const usersRoutes = Router();

const upload = multer({ dest: "uploads/profiles/" });

usersRoutes.post("/signup", signup);
usersRoutes.get("/buddyverify/:id", verifyBuddy);
usersRoutes.post("/login", loginBuddy);
usersRoutes.post("/profile/:id", buddyProfile);
usersRoutes.post(
  "/profile/:id/uploaddp",
  upload.single("profile-image"),
  buddyDP
);
usersRoutes.delete("/profile/:id/removedp", removeBuddyDP);
usersRoutes.get("/profile/:id/sendmail", verifyMail);
usersRoutes.post("/logout", logOut);

export default usersRoutes;
