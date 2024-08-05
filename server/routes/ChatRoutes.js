import { Router } from "express";
import {
  getBuddies,
  getFellowBuddy,
  getSenderMsg,
  searchBuddies,
  uploadFiles,
  getChatContact,
  getGroups,
  getSelectedGroup,
  addRecipientGroup,
  getGroupChats,
  exitGroupChat,
} from "../controllers/ChatsController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import multer from "multer";

export const chatRoutes = Router();
export const groupChatRouter = Router();

const upload = multer({ dest: "/tmp/uploads/files" });

chatRoutes.get("/:id",verifyToken, getBuddies);
chatRoutes.post("/search/:id",verifyToken, searchBuddies);
chatRoutes.get("/fellow/:id",verifyToken, getFellowBuddy);
chatRoutes.post("/directmessages",verifyToken, getSenderMsg);
chatRoutes.post("/uploadfile", upload.single("file"), uploadFiles, (req, res) => {
  res.send({ filepath: req.file.path });
});
chatRoutes.post("/getchatcontacts",verifyToken, getChatContact);

groupChatRouter.get("/",verifyToken, getGroups);
groupChatRouter.get("/:groupid",verifyToken, getSelectedGroup);
groupChatRouter.post("/addrecipient", addRecipientGroup);
groupChatRouter.post("/getgroupchat", getGroupChats);
groupChatRouter.post("/exitgroup", exitGroupChat);


