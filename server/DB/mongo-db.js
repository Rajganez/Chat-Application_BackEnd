import dotenv from "dotenv";
import { MongoClient } from 'mongodb';

dotenv.config();

const dbname = process.env.DB_NAME
const dbUser  = process.env.DB_USER 
const dbPass = process.env.DB_PASSWORD
const db_Clust = process.env.DB_CLUSTER


const dbURL = `mongodb+srv://${dbUser}:${dbPass}@${db_Clust}/?retryWrites=true&w=majority&appName=chatapp`;

const client = new MongoClient(dbURL);

const db = client.db(dbname);

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
export {db};
