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
import { verifyToken } from "../middlewares/verifyToken.js";

//Express Router for the userCollection/UsersController
const usersRoutes = Router();

//Middleware to store the media files in the server side
const upload = multer({ dest: "/tmp/uploads/profiles" });

usersRoutes.post("/signup", signup);
usersRoutes.get("/buddyverify/:id", verifyBuddy);
usersRoutes.post("/login", loginBuddy);
usersRoutes.post("/profile/:id",verifyToken, buddyProfile);
//This API is for profile picture upload
usersRoutes.post(
  "/upload/:id",
  upload.single("file"),verifyToken,
  uploadProfile,
  (req, res) => {
    res.send({ filename: req.file.path });
  }
);
//To remove the profile picture
usersRoutes.delete(
  "/remove/:id",
  upload.single("file"),verifyToken,
  removeProfile,
  (req, res) => {
    res.send({ filename: req.file.path });
  }
);
usersRoutes.post("/forgotpassword", forgotPassword);
usersRoutes.post("/resetpassword/:id", resetPassword);
usersRoutes.get("/profile/:id/sendmail", verifyMail);
usersRoutes.post("/logout",verifyToken, logOut);

export default usersRoutes;
