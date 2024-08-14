import { Router } from "express";
import {
  getBuddies,
  getFellowBuddy,
  getSenderMsg,
  searchBuddies,
  getChatContact,
  getGroups,
  getSelectedGroup,
  addRecipientGroup,
  getGroupChats,
  exitGroupChat,
  getBuddyChatContacts,
  uploadFilesinCloudi,
  uploadFiles,
  notifyMsg,
} from "../controllers/ChatsController.js";
import { verifyToken } from "../middlewares/verifyToken.js";
import multer from "multer";

//Express Router for chatCollection
export const chatRoutes = Router();
//Express Router for groupChatCollection
export const groupChatRouter = Router();

//Middleware for media upload in the server side
const upload = multer({ dest: "/tmp/uploads/files" });

//API endpoints for direct messages
chatRoutes.get("/:id",verifyToken, getBuddies);
chatRoutes.post("/search/:id",verifyToken, searchBuddies);
chatRoutes.get("/fellow/:id",verifyToken, getFellowBuddy);
chatRoutes.post("/directmessages",verifyToken, getSenderMsg);
chatRoutes.post("/getchatcontacts",verifyToken, getChatContact);
chatRoutes.post("/getbuddies",verifyToken, getBuddyChatContacts);
//API endpoints for direct messages for media upload
chatRoutes.post(
  "/uploadmedia",
  upload.single("file"),verifyToken,
  uploadFilesinCloudi,
  (req, res) => {
    res.send({ filepath: req.file.path });
  }
);
//API uploadfile is for the media upload in Groups
chatRoutes.post(
  "/uploadfile",
  upload.single("file"),verifyToken,
  uploadFiles,
  (req, res) => {
    res.send({ filepath: req.file.path });
  }
);
chatRoutes.post("/notifymsg",verifyToken, notifyMsg);

//API Endpoints for Group chats
groupChatRouter.get("/",verifyToken, getGroups);
groupChatRouter.get("/:groupid",verifyToken, getSelectedGroup);
groupChatRouter.post("/addrecipient",verifyToken, addRecipientGroup);
groupChatRouter.post("/getgroupchat",verifyToken, getGroupChats);
groupChatRouter.post("/exitgroup",verifyToken, exitGroupChat);
