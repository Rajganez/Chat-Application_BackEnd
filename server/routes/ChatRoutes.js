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

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = path.join('/tmp/uploads');
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage: storage });
// const upload = multer({ dest: "/tmp/uploads/files" });

chatRoutes.get("/:id", getBuddies);
chatRoutes.post("/search/:id", searchBuddies);
chatRoutes.get("/fellow/:id", getFellowBuddy);
chatRoutes.post("/directmessages", getSenderMsg);
chatRoutes.post("/uploadfile", upload.single("file"), uploadFiles, (req, res) => {
  try {
    console.log(req.file);
    const filePath = `/uploads/${req.file.filename}`;
    res.status(200).send({ filepath: filePath });
  } catch (error) {
    console.error('Error handling file upload:', error);
    res.status(500).send({ error: 'File upload failed' });
  }
});
chatRoutes.post("/getchatcontacts", getChatContact);

groupChatRouter.get("/", getGroups);
groupChatRouter.get("/:groupid", getSelectedGroup);
groupChatRouter.post("/addrecipient", addRecipientGroup);
groupChatRouter.post("/getgroupchat", getGroupChats);
groupChatRouter.post("/exitgroup", exitGroupChat);


