import { ObjectId } from "mongodb";
import { db } from "../DB/mongo-db.js";
import { userCollection } from "./UsersController.js";
import { mkdirSync, renameSync } from "fs";

export const chatCollection = db.collection("Messages");
export const groupChatCollection = db.collection("GroupMessages");

//----------------Get Logged Buddy Details from the DB-----------//

export const getBuddies = async (req, res) => {
  const { id } = req.params;
  try {
    const objectId = ObjectId.createFromHexString(id);
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
  }
};

//----------------Search Buddies in the database----------------//

export const searchBuddies = async (req, res) => {
  const { searchBuddy } = req.body;
  const { id } = req.params;
  try {
    const objectId = ObjectId.createFromHexString(id);
    if (searchBuddy === undefined || searchBuddy === null) {
      return res.status(400).send({ msg: "Buddy nickname can't be empty." });
    }
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
    const objectId = ObjectId.createFromHexString(id);
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
    const newChat = await chatCollection.findOne({ senderId: buddyId });
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

//---------------Upload files in DB-------------------//

export const uploadFiles = async (req, res) => {
  try {
    const date = Date.now();
    let fileDir = `/uploads/files/${date}`;
    let filename = `${fileDir}/${req.file.originalname}`;
    mkdirSync(fileDir, { recursive: true });
    renameSync(req.file.path, filename);
    return res
      .status(200)
      .json({ filepath: filename, fileType: req.file.filename });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: "Internal Server Error" });
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
      const getMsg = await chatMsgs.groupContent;
      return res.status(200).json({ getMsg });
    }
  } catch (error) {
    res.status(500).send({ msg: "Internal Server Error" });
  }
};

//---------Get Messages from Group--------------------//

export const exitGroupChat = async (req, res) => {
  const { id } = req.body;
  try {
    const group = await groupChatCollection.findOne({ members: id });
    if (group) {
      const updatedMembers = group.members.filter(
        (memberId) => memberId !== id
      );
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
