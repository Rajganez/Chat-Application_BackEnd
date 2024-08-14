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
chatRoutes.get("/fellow/:id", getFellowBuddy);
chatRoutes.post("/directmessages", getSenderMsg);
chatRoutes.post("/getchatcontacts", getChatContact);
chatRoutes.post("/getbuddies", getBuddyChatContacts);
//API endpoints for direct messages for media upload
chatRoutes.post(
  "/uploadmedia",
  upload.single("file"),
  uploadFilesinCloudi,
  (req, res) => {
    res.send({ filepath: req.file.path });
  }
);
//API uploadfile is for the media upload in Groups
chatRoutes.post(
  "/uploadfile",
  upload.single("file"),
  uploadFiles,
  (req, res) => {
    res.send({ filepath: req.file.path });
  }
);
chatRoutes.post("/notifymsg", notifyMsg);

//API Endpoints for Group chats
groupChatRouter.get("/", getGroups);
groupChatRouter.get("/:groupid", getSelectedGroup);
groupChatRouter.post("/addrecipient", addRecipientGroup);
groupChatRouter.post("/getgroupchat", getGroupChats);
groupChatRouter.post("/exitgroup", exitGroupChat);
