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
  getBuddyChatContacts,
} from "../controllers/ChatsController.js";
// import { verifyToken } from "../middlewares/verifyToken.js";
import multer from "multer";

export const chatRoutes = Router();
export const groupChatRouter = Router();

const upload = multer({ dest: "/tmp/uploads/files" });

chatRoutes.get("/:id", getBuddies);
chatRoutes.post("/search/:id", searchBuddies);
chatRoutes.get("/fellow/:id", getFellowBuddy);
chatRoutes.post("/directmessages", getSenderMsg);
chatRoutes.post(
  "/uploadfile",
  upload.single("file"),
  uploadFiles,
  (req, res) => {
    res.send({ filepath: req.file.path });
  }
);
chatRoutes.post("/getchatcontacts", getChatContact);

groupChatRouter.get("/", getGroups);
groupChatRouter.get("/:groupid", getSelectedGroup);
groupChatRouter.post("/addrecipient", addRecipientGroup);
groupChatRouter.post("/getgroupchat", getGroupChats);
groupChatRouter.post("/getbuddies", getBuddyChatContacts);
groupChatRouter.post("/exitgroup", exitGroupChat);
