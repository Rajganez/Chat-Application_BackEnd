import dotenv from "dotenv";
import { MongoClient } from "mongodb";

dotenv.config();
//DB configuration
const dbname = process.env.DB_NAME;
const dbUser = process.env.DB_USER;
const dbPass = process.env.DB_PASSWORD;
const db_Clust = process.env.DB_CLUSTER;
//DB URL
const dbURL = `mongodb+srv://${dbUser}:${dbPass}@${db_Clust}/?retryWrites=true&w=majority&appName=chatapp`;
//Create client instance
const client = new MongoClient(dbURL);

const db = client.db(dbname);
//DB Connection
const connectToDB = async () => {
  try {
    await client.connect();
    console.log("Connected to MongoDB!");
  } catch (error) {
    console.log("Error connecting to MongoDB", error);
    process.exit(1);
  }
};

export default connectToDB;
export { db };
