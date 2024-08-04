import jwt from "jsonwebtoken";
import { db } from "../DB/mongo-db.js";
import { transporter, mailOptions } from "../utils/mailer.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import { renameSync, unlinkSync } from "fs";

dotenv.config();

export const userCollection = db.collection("Chatters");

const maxAge = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

const createToken = (email, userId) => {
  return jwt.sign({ mail: email, Id: userId }, process.env.JWT_KEY, {
    expiresIn: "3d",
  });
};

// -------------Sign Up Function--------------//

export const signup = async (req, res) => {
  const payload = req.body;
  const pass = req.body.signUpPassword;
  try {
    const user = await userCollection.findOne({
      signUpEmail: payload.signUpEmail,
    });
    if (user) {
      return res.status(409).send({ msg: "Buddy already exists" });
    }
    bcrypt.hash(pass, 10, async (err, hash) => {
      if (err) {
        return res.status(400).send({ message: err.message });
      }
      const tempUser = {
        ...payload,
        signUpPassword: hash,
        confirmSignUpPassword: hash,
      };
      const data = await userCollection.insertOne({
        ...tempUser,
        isVerified: false,
      });
      const token = jwt.sign({ id: data._id }, process.env.JWT_KEY, {
        expiresIn: "15m",
      });
      const userData = await userCollection.findOne(
        { signUpEmail: payload.signUpEmail },
        { projection: { _id: 1 } }
      );
      const verifyLink = `${process.env.ORIGIN}/buddy/buddyverify/${userData._id}`;
      await transporter.sendMail({
        ...mailOptions,
        to: [payload.signUpEmail],
        subject: "Hibuddy your Email Verification link",
        html: `Hi! Buddy Your Email Verification Link Expires in 15 minutes:<br/><br/>
        <a href=${verifyLink}>${verifyLink}</a>`,
      });
      res.cookie("jwt", createToken(userData.signUpEmail, userData._id), {
        maxAge,
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });

      return res.status(201).json({ userToken: token, userId: userData._id });
    });
  } catch (error) {
    console.log(error);
    return res.status(500).send({ msg: "Server Error" });
  }
};

// -------------Email Verification Function--------------//

export const verifyBuddy = async (req, res) => {
  const { id } = req.params;
  const userToken = req.header("Authorization");
  try {
    const objectId = ObjectId.createFromHexString(id);
    jwt.verify(userToken, process.env.JWT_KEY, async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).send({ error: "Token Expired" });
        }
        return res.status(400).send({ error: "Invalid Token" });
      }
      const data = await userCollection.findOneAndUpdate(
        { _id: objectId },
        { $set: { isVerified: true } }
      );
      return res.status(200).json({ emailVerifed: data.isVerified });
    });
  } catch (error) {
    console.log(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: error.message });
    }
  }
};

// -------------Login Function--------------//

export const loginBuddy = async (req, res) => {
  const email = req.body.loginEmail;
  const pass = req.body.LoginPassword;
  try {
    const user = await userCollection.findOne({ signUpEmail: email });
    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }
    const result = await bcrypt.compare(pass, user.signUpPassword);
    if (result) {
      const token = createToken(user.signUpEmail, user._id);
      res.cookie("jwt", token, {
        maxAge,
        httpOnly: true,
        secure: true,
        sameSite: "None",
      });
      return res.status(200).json({
        userID: user._id,
        emailVerifed: user.isVerified,
        imageStr: user.image,
        profiling: user.profileComplete,
      });
    } else {
      return res.status(401).send({ msg: "Incorrect credentials" });
    }
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: "Internal server error" });
    }
  }
};

// -------------Profile Function--------------//

export const buddyProfile = async (req, res) => {
  const { id } = req.params;
  const first = req.body.firstName;
  const last = req.body.lastName;
  const nick = req.body.nickName;
  try {
    const objectId = ObjectId.createFromHexString(id);
    const data = await userCollection.findOne({ _id: objectId });
    const uniqueNick = await userCollection.findOne({ nickName: nick });
    if (data && !uniqueNick) {
      await userCollection.updateOne(
        { _id: objectId },
        {
          $set: {
            firstName: first,
            lastName: last,
            nickName: nick,
            profileComplete: true,
          },
        }
      );
      return res.status(200).json({
        verified: data.isVerified,
        firstname: data.firstName,
        lastname: data.lastName,
        nick: data.nickName,
        profiling: data.profileComplete,
      });
    }
    return res.status(409).json({ msg: "Nick name is Available" });
  } catch (error) {
    console.log(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: error.message });
    }
  }
};

// -------------VerifyMail Function--------------//

export const verifyMail = async (req, res) => {
  const { id } = req.params;
  try {
    const objectId = ObjectId.createFromHexString(id);
    const data = await userCollection.findOne({ _id: objectId });
    if (data) {
      const token = jwt.sign({ Userid: data._id }, process.env.JWT_KEY, {
        expiresIn: "15m",
      });
      const verifyLink = `${process.env.ORIGIN}/buddy/buddyverify/${id}`;
      await transporter.sendMail({
        ...mailOptions,
        to: [data.signUpEmail],
        subject: "Hibuddy your Email Verification link",
        html: `Hi! Buddy Your Email Verification Link Expires in 15 minutes:<br/><br/>
        <a href=${verifyLink}>${verifyLink}</a>`,
      });
      return res.status(201).json({ userToken: token });
    }
  } catch (error) {
    console.log(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: error.message });
    }
  }
};

// -------------Add Profile-image Function--------------//

export const buddyDP = async (req, res) => {
  const { id } = req.params;
  try {
    const objectId = ObjectId.createFromHexString(id);
    if (!req.file) {
      return res.status(404).json({ msg: "Error updating Image" });
    }
    const date = Date.now();
    let fileName = "tmp/uploads/profiles/" + date + req.file.originalname;
    renameSync(req.file.path, fileName);
    const updatedUser = await userCollection.findOneAndUpdate(
      {
        _id: objectId,
      },
      { $set: { image: fileName } }
    );
    return res
      .status(200)
      .json({ userImage: updatedUser.image, filename: fileName });
  } catch (error) {
    console.log(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: error.message });
    }
  }
};

// -------------Remove Profile-image Function--------------//

export const removeBuddyDP = async (req, res) => {
  const { id } = req.params;
  try {
    const objectId = ObjectId.createFromHexString(id);
    const user = await userCollection.findOne({ _id: objectId });
    if (user.image !== null) {
      unlinkSync(user.image);
      const updatedUser = await userCollection.findOneAndUpdate(
        {
          _id: objectId,
        },
        { $set: { image: null } }
      );
      return res.status(200).json({ userImage: updatedUser.image });
    }
    return res.status(400).send({ msg: "Server Error" });
  } catch (error) {
    console.log(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: error.message });
    }
  }
};

// -------------VerifyMail Function--------------//

export const logOut = async (req, res) => {
  try {
    res.clearCookie("jwt", {
      secure: true,
      sameSite: "None",
    });
    return res.status(200).send({ msg: "Buddy Logged Out Successfully" });
  } catch (error) {
    console.log(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: error.message });
    }
  }
};
