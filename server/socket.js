import { Server } from "socket.io";
import {
  chatCollection,
  groupChatCollection,
} from "./controllers/ChatsController.js";

//Socket Server configuration
const socketSetup = (server) => {
  const io = new Server(server, {
    cors: {
      origin: [process.env.ORIGIN],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  const socketMap = new Map();

  //Emits the logged User in the socketMap
  const emitLoggedUsers = () => {
    const loggedUsers = Array.from(socketMap.keys());
    io.emit("loggedUsers", loggedUsers);
  };

  //Disconnect the socket server
  const disconnect = (socket) => {
    console.log("disconnected', socket: " + socket.id);
    for (const [userId, socketid] of socketMap.entries()) {
      if (socketid === socket.id) {
        socketMap.delete(userId);
        break;
      }
    }
    emitLoggedUsers();
  };
  //Send Direct Message and stored message in the DB - DM functionality
  const sendMsg = async (message) => {
    const senderId = socketMap.get(message.sender);
    const recipientId = socketMap.get(message.recipient);
    //Inserts Each Message into the DB
    await chatCollection.insertOne({
      senderId: message.sender,
      recipientId: message.recipient,
      timestamp: Date.now(),
      content: message.content,
      messageType: message.messageType,
    });

    if (recipientId) {
      io.to(recipientId).emit("receiveMessage", message);
      io.to(recipientId).emit("notification", {
        senderID: `${message.sender}`,
      });
    }
    if (senderId) {
      io.to(senderId).emit("receiveMessage", message);
    }
  };

  //Send Group Message and stored message in the DB  - Group Chat functionality
  const sendGroupMsg = async (message) => {
    const { sender, groupID } = message;
    //Inserts Each Message into already exisisting groups in the DB
    const createGroupChats = await groupChatCollection.findOneAndUpdate(
      {
        $and: [{ groupId: groupID }, { members: sender }],
      },
      { $push: { groupContent: { [sender]: message.content } } },
      { returnDocument: "after" }
    );
    if (createGroupChats) {
      const memberIds = createGroupChats.members;
      const senderId = socketMap.get(message.sender);
      for (const ids of memberIds) {
        const socketIds = socketMap.get(ids);
        if (socketIds) {
          io.to(socketIds).emit("receiveGroupMessage", message);
        }
        io.to(socketIds).emit("groupNotification", {
          groupid: `${groupID}`,
          messageFrom: `${message.sender}`,
        });
      }
      io.to(senderId).emit("receiveGroupMessage", message);
    }
  };

  //Socket Connection
  io.on("connection", (socket) => {
    const userId = socket.handshake.query.userId;
    if (userId) {
      socketMap.set(userId, socket.id);
      console.log(`User connected: ${userId} with socket-id ${socket.id}`);
      emitLoggedUsers();
    } else {
      console.log("Invalid User ID");
    }
    //Event Listeners for sending messages and group messages
    socket.on("sendMessage", sendMsg);
    socket.on("sendGroupMessage", sendGroupMsg);
    socket.on("disconnect", () => disconnect(socket));
  });
};

export default socketSetup;
