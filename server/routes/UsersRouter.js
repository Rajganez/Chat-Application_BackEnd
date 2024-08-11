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

usersRoutes.post("/signup",verifyToken, signup);
usersRoutes.get("/buddyverify/:id",verifyToken, verifyBuddy);
usersRoutes.post("/login",verifyToken, loginBuddy);
usersRoutes.post("/profile/:id",verifyToken, buddyProfile);
//This API is for profile picture upload
usersRoutes.post(
  "/upload/:id",
  upload.single("file"),
  uploadProfile,
  (req, res) => {
    res.send({ filename: req.file.path });
  }
);
//To remove the profile picture
usersRoutes.delete(
  "/remove/:id",
  upload.single("file"),
  removeProfile,
  (req, res) => {
    res.send({ filename: req.file.path });
  }
);
usersRoutes.post("/forgotpassword",verifyToken, forgotPassword);
usersRoutes.post("/resetpassword/:id",verifyToken, resetPassword);
usersRoutes.get("/profile/:id/sendmail",verifyToken, verifyMail);
usersRoutes.post("/logout",verifyToken, logOut);

export default usersRoutes;
