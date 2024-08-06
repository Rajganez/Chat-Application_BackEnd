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
import fs from "fs";
// import helmet from "helmet";

dotenv.config();

const createDirectories = () => {
  const directories = ["/tmp/uploads/profiles", "/tmp/uploads/files"];

  directories.forEach((dir) => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  });
};

//Function to create directories for Render Instances
createDirectories();

const app = express();
await connectToDB();

//Helmet set security-related HTTP headers without this is not working in Edge browser
// app.use(helmet());
// app.use(helmet.noSniff());

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
  })
);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(
  "/uploads/profiles",
  express.static(path.join("/tmp", "uploads", "profiles"))
);

app.use(
  "/uploads/files",
  express.static(path.join("/tmp", "uploads", "files"))
);

// Middleware to set cache-control headers for other routes

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
