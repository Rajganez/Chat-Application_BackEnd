import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import usersRoutes from "./server/routes/UsersRouter.js";
import connectToDB from "./server/DB/mongo-db.js";
import path from "path";
import { fileURLToPath } from "url";
import { chatRoutes, groupChatRouter } from "./server/routes/ChatRoutes.js";
import socketSetup from "./server/socket.js";

import fs from 'fs';
import path from 'path';

const createDirectories = () => {
  const directories = [
    "/var/lib/render/uploads/profiles",
    "/var/lib/render/uploads/files"
  ];

  directories.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

// Call the function to create directories
createDirectories();

dotenv.config();

const app = express();
await connectToDB();
app.use(cookieParser());
app.use(
  cors({
    origin: [process.env.ORIGIN],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  "/uploads/profiles",
  express.static(path.join("/var/lib/render", "uploads/profiles"))
);

app.use(
  "/uploads/files",
  express.static(path.join("/var/lib/render", "uploads/files"))
);

app.use(express.json());

app.use("/buddy", usersRoutes);
app.use("/chat", chatRoutes);
app.use("/groups", groupChatRouter);

// Global error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  console.error("Error message:", err.message);
  console.error("Error details:", err);
  res.status(500).send({ error: "Something went wrong!" });
});

const port = 3000;

const server = app.listen(port, () => {
  console.log(`${Date().toString()}--Server is running on port: ${port}`);
});

socketSetup(server);
