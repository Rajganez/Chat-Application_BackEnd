import { Router } from "express";
import {
  buddyProfile,
  forgotPassword,
  loginBuddy,
  logOut,
  removeProfile,
  resetPassword,
  signup,
  uploadProfile,
  verifyBuddy,
  verifyMail,
} from "../controllers/UsersController.js";
import multer from "multer";
// import { verifyToken } from "../middlewares/verifyToken.js";

const usersRoutes = Router();

const upload = multer({ dest: "/tmp/uploads/profiles" });

usersRoutes.post("/signup", signup);
usersRoutes.get("/buddyverify/:id", verifyBuddy);
usersRoutes.post("/login", loginBuddy);
usersRoutes.post("/profile/:id", buddyProfile);
usersRoutes.post(
  "/upload/:id",
  upload.single("file"),
  uploadProfile,
  (req, res) => {
    res.send({ filename: req.file.path });
  }
);
usersRoutes.delete(
  "/remove/:id",
  upload.single("file"),
  removeProfile,
  (req, res) => {
    res.send({ filename: req.file.path });
  }
);
usersRoutes.post("/forgotpassword", forgotPassword);
usersRoutes.post("/resetpassword/:id", resetPassword);
usersRoutes.get("/profile/:id/sendmail", verifyMail);
usersRoutes.post("/logout", logOut);

export default usersRoutes;
