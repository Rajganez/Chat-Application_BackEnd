import { ObjectId } from "mongodb";
import { db } from "../DB/mongo-db.js";
import { userCollection } from "./UsersController.js";
import fs from "fs";
import path from "path";
import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

//Collection for Direct Messages
export const chatCollection = db.collection("Messages");

//Collection for Group/Channel Messages
export const groupChatCollection = db.collection("GroupMessages");

//----------------Get Logged Buddy Details from the DB-----------//

export const getBuddies = async (req, res) => {
  const { id } = req.params;
  try {
    //used to create an ObjectId instance from a hexadecimal string.
    const objectId = ObjectId.createFromHexString(id);
    //find the user in the database using the ObjectId instance.
    const user = await userCollection.findOne(
      { _id: objectId },
      { projection: { signUpEmail: 0 } }
    );
    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }
    return res.status(201).json({
      first: user.firstName,
      last: user.lastName,
      nick: user.nickName,
      imgStr: user.image,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: "Error", err: error });
  }
};

//----------------Search Buddies in the database----------------//

export const searchBuddies = async (req, res) => {
  const { searchBuddy } = req.body;
  const { id } = req.params;
  try {
    const objectId = ObjectId.createFromHexString(id);
    // Check if the searchBuddy parameter is provided
    if (searchBuddy === undefined || searchBuddy === null) {
      // Return a 400 Bad Request response if searchBuddy is empty
      return res.status(400).send({ msg: "Buddy nickname can't be empty." });
    }
    // Query the userCollection to find users with nickName or firstName matching the searchBuddy
    const users = await userCollection
      .find(
        {
          _id: { $ne: objectId },
          $or: [
            { nickName: { $regex: new RegExp(searchBuddy), $options: "i" } },
            { firstName: { $regex: new RegExp(searchBuddy), $options: "i" } },
          ],
        },
        { projection: { nickName: 1, image: 1 } }
      )
      .toArray();
    if (users.length > 0) {
      return res.status(201).json(users);
    }
    return res.status(404).send({ msg: "Buddy not found" });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

//----------------Get recipient from the database------------//

export const getFellowBuddy = async (req, res) => {
  const { id } = req.params;
  try {
    //Used to create an ObjectId instance from a hexadecimal string.
    const objectId = ObjectId.createFromHexString(id);
    //Query to find the recipient from the search
    const buddy = await userCollection.findOne({ _id: objectId });
    if (!buddy) {
      return res.status(404).send({ msg: "Buddy not found" });
    }
    return res
      .status(200)
      .json({ nickname: buddy.nickName, image: buddy.image });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: error.msg });
  }
};

//---------------Get Messages from the DB-------------------//

export const getSenderMsg = async (req, res) => {
  const { buddyId, fellowId } = req.body;
  try {
    //If Either message sender is buddy/Logged or fellow/Recipient
    const newChat = await chatCollection.findOne({
      $or: [{ senderId: buddyId }, { senderId: fellowId }],
    });
    //Query to get the DM of the logged and selected recipient
    if (newChat) {
      const messages = await chatCollection
        .find({
          $or: [
            { senderId: buddyId, recipientId: fellowId },
            { senderId: fellowId, recipientId: buddyId },
          ],
        })
        .sort({ timestamp: 1 })
        .toArray();
      if (messages.length > 0) {
        return res.status(200).json({ messages });
      }
      return res.status(404).send({ msg: "No messages found" });
    }
  } catch (error) {
    return res.status(500).send({ msg: error.msg });
  }
};

//------------Get chat of the logged buddy-------------//

export const getChatContact = async (req, res) => {
  const { buddyid } = req.body;
  try {
    const contact = await chatCollection.findOne({ buddyId: buddyid });
    if (contact) {
      const contactInfo = await chatCollection
        .find(
          { senderId: { $eq: buddyid } },
          { recipientId: 1, content: 0, _id: 0, timestamp: 0 }
        )
        .toArray();
      if (contactInfo.length > 0) {
        return res.status(200).json({ contactInfo });
      }
    }
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

//------------Add recipient in Groups----------------//

export const addRecipientGroup = async (req, res) => {
  const { recipientId, groupid } = req.body;
  try {
    //For Channels Message Query to add member in the group
    const getOldMember = await groupChatCollection.findOne(
      { groupId: groupid },
      { members: recipientId }
    );
    const checkBuddy = getOldMember.members.includes(recipientId);
    if (!checkBuddy) {
      await groupChatCollection.findOneAndUpdate(
        { groupId: groupid },
        { $push: { members: recipientId } }
      );
      return res.status(200).json({ msg: "Recipient added successfully" });
    } else if (getOldMember.members.length > 0) {
      return res.status(201).json({ msg: "Recipient already added" });
    } else {
      return res.status(404).send({ msg: "Group not found" });
    }
  } catch (error) {
    return res
      .status(500)
      .send({ msg: "Internal Server Error" + error.message });
  }
};

//------------Get Default Groups from DB------------//

export const getGroups = async (req, res) => {
  try {
    //Query to get the default groups from the database
    const groups = await groupChatCollection.find({}).toArray();
    if (groups.length > 0) {
      return res.status(200).json({ groups });
    } else {
      return res.status(404).send({ msg: "No groups found" });
    }
  } catch (error) {
    return res.status(500).send({ msg: "Group not found" });
  }
};

//---------Get Selected Group--------------------//

export const getSelectedGroup = async (req, res) => {
  const { groupid } = req.params;
  try {
    //Query to get the selected group from the database by the user
    const group = await groupChatCollection.findOne({ groupId: groupid });
    if (group) {
      return res.status(200).json({ group });
    } else {
      return res.status(404).send({ msg: "Group not found" });
    }
  } catch (error) {
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

//---------Get Messages from Group--------------------//

export const getGroupChats = async (req, res) => {
  const { buddyId, groupid } = req.body;
  try {
    const chatMsgs = await groupChatCollection.findOne(
      { groupId: groupid },
      { members: buddyId }
    );
    if (chatMsgs) {
      const getMsg = chatMsgs.groupContent;
      // Extract unique sender IDs
      const senderIds = Array.from(
        new Set(getMsg.map((msg) => Object.keys(msg)[0]))
      );
      // Fetch nicknames from userCollection
      const nicknamesData = await userCollection
        .find(
          {
            _id: {
              $in: senderIds.map((id) => ObjectId.createFromHexString(id)),
            },
          },
          { projection: { nickName: 1 } }
        )
        .toArray();
      // Create a map of senderId to nickname
      const nicknamesMap = {};
      nicknamesData.forEach((user) => {
        nicknamesMap[user._id.toString()] = user.nickName;
      });
      // Attach nicknames to messages
      const messagesWithNicknames = getMsg.map((msg) => {
        const senderId = Object.keys(msg)[0];
        return {
          senderId,
          nickname: nicknamesMap[senderId],
          message: msg[senderId],
        };
      });
      return res.status(200).json({ getMsg, nickName: messagesWithNicknames });
    } else {
      return res.status(404).send({ msg: "Group not found" });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

//------------Leave from the Group--------------------//

export const exitGroupChat = async (req, res) => {
  const { id } = req.body;
  try {
    //Find User is the member of the group
    const group = await groupChatCollection.findOne({ members: id });
    if (group) {
      //Remove the user from the members array
      const updatedMembers = group.members.filter(
        (memberId) => memberId !== id
      );
      //Update the group document in the database with the updated members array
      await groupChatCollection.findOneAndUpdate(
        { _id: group._id },
        { $set: { members: updatedMembers } },
        { returnDocument: "after" }
      );
      return res.status(200).send({ msg: "Exited successfully" });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Server error" });
  }
};

//------------Get Logged user chat buddies-----------------//

export const getBuddyChatContacts = async (req, res) => {
  const { id } = req.body;
  try {
    const objectId = ObjectId.createFromHexString(id);
    //Find the sender of a message,
    const buddyContacts = await userCollection.findOne({ _id: objectId });
    return res.status(200).json({
      [id]: {
        id: buddyContacts._id,
        nick: buddyContacts.nickName,
        img: buddyContacts.image,
      },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(404)
      .json({ message: "Server error or Not Found", error: error });
  }
};

//---------------Upload files in DB-------------------//

export const uploadFiles = async (req, res) => {
  //This API is created only for the Group Message
  try {
    const date = Date.now();
    //In the Render Directory for unique files Date.now() is added
    const fileDir = path.join("uploads/files", date.toString());
    //Joined with the filename
    const filename = path.join(fileDir, req.file.originalname);
    fs.mkdirSync(path.join("/tmp", fileDir), { recursive: true });
    fs.renameSync(req.file.path, path.join("/tmp", filename));
    //Response generated from the server
    return res
      .status(200)
      .json({ filepath: filename, fileType: req.file.mimetype });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

//---------------Upload files in Cloudinary-------------------//

export const uploadFilesinCloudi = async (req, res) => {
  //This API is created only for the Direct Message to expirience the various concepts
  try {
    //Initialize Cloudinary SDK
    cloudinary.config({
      cloud_name: `${process.env.CLOUD_NAME}`,
      api_key: `${process.env.API_KEY}`,
      api_secret: `${process.env.API_SECRET}`,
    });
    //For Unique Files
    const date = Date.now();
    const fileExtension = path.extname(req.file.originalname);
    const fileNameWithoutExt = path.basename(
      req.file.originalname,
      fileExtension
    );
    const fileName = `${fileNameWithoutExt}_${date}`;
    //Cloudinary Upload
    const result = await cloudinary.uploader.upload(req.file.path, {
      public_id: fileName,
      folder: "Home/files",
    });
    //Resultant URL
    let optimizeUrl = cloudinary.url(result.public_id, {
      fetch_format: "auto",
      quality: "auto",
    });
    // Remove the query parameter using a regex to handle it in the frontend
    optimizeUrl = optimizeUrl.replace(/(\?_a=[^&]*)$/, "");
    return res.status(200).json({ file: `${optimizeUrl}${fileExtension}` });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};

//---------------Notification when User log's in-----------------//

export const notifyMsg = async (req, res) => {
  const { id } = req.body;
  try {
    const objectId = ObjectId.createFromHexString(id);
    //Get the log out time of the user
    const user = await userCollection.findOne(
      { _id: objectId },
      { projection: { logoutTime: 1 } }
    );
    //In chat collection, find if the user had received message after the logout time
    if (user) {
      const findDM = await chatCollection
        .find(
          {
            recipientId: id,
            $and: [{ timestamp: { $gt: user.logoutTime } }],
          },
          { projection: { senderId: 1 } }
        )
        .toArray();
      //If yes, return the sender details along with the sender details
      if (findDM.length > 0) {
        const senderid = findDM.map((ids) => ids.senderId);
        const updatedMembers = senderid.filter((Id) => Id !== id);
        const uniqueSender = [...new Set(updatedMembers)];
        const sender = await userCollection
          .find(
            {
              _id: {
                $in: uniqueSender.map((id) => ObjectId.createFromHexString(id)),
              },
            },
            { projection: { nickName: 1, image: 1, _id: 1 } }
          )
          .toArray();
        return res.status(201).json({ sender });
      }
    }
    return res.status(404).send({ msg: "No New Message" });
  } catch (error) {
    console.error(error);
    return res.status(500).send({ msg: "Internal Server Error" });
  }
};
