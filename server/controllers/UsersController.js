import jwt from "jsonwebtoken";
import { db } from "../DB/mongo-db.js";
import { transporter, mailOptions } from "../utils/mailer.js";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import { ObjectId } from "mongodb";
import path from "path";
import { v2 as cloudinary } from "cloudinary";

dotenv.config();

//Collection to store the Users
export const userCollection = db.collection("Chatters");

//Cookie middleware MaxAge creation
const maxAge = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);

//JWT token for Cookie
const createToken = (email, userId) => {
  return jwt.sign({ mail: email, Id: userId }, process.env.JWT_KEY, {
    expiresIn: "3d",
  });
};
const cookieOptions = {
  expires: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
  httpOnly: true,
  secure: true, // enable it when your development in production
  // sameSite: true, // enable it when your development in production
};
// -------------Sign Up Function--------------//

export const signup = async (req, res) => {
  const payload = req.body;
  const pass = req.body.signUpPassword;
  try {
    //Intial Step to Add the User to the DB
    const user = await userCollection.findOne({
      signUpEmail: payload.signUpEmail,
    });
    if (user) {
      return res.status(409).send({ msg: "Buddy already exists" });
    }
    //Password Hashing using bcrypt
    bcrypt.hash(pass, 10, async (err, hash) => {
      if (err) {
        return res.status(400).send({ message: err.message });
      }
      //Adding the User to the DB with hashed password
      const tempUser = {
        ...payload,
        signUpPassword: hash,
        confirmSignUpPassword: hash,
      };
      const data = await userCollection.insertOne({
        ...tempUser,
        isVerified: false,
      });
      //Sending Verification Email to the User using JWT Token Header-Authorization
      const token = jwt.sign({ id: data._id }, process.env.JWT_KEY, {
        expiresIn: "15m",
      });
      const userData = await userCollection.findOne(
        { signUpEmail: payload.signUpEmail },
        { projection: { _id: 1 } }
      );
      //Sending Verification Email to the User
      const verifyLink = `${process.env.ORIGIN}/buddy/buddyverify/${userData._id}`;
      await transporter.sendMail({
        ...mailOptions,
        to: [payload.signUpEmail],
        subject: "Hibuddy your Email Verification link",
        html: `Hi! Buddy Your Email Verification Link Expires in 15 minutes:<br/><br/>
        <a href=${verifyLink}>${verifyLink}</a>`,
      });
      //Cookie Generated during the SignUp
      res.cookie(
        "jwt",
        createToken(userData.signUpEmail, userData._id),
        cookieOptions
      );

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
    //Used to create an ObjectId instance from a hexadecimal string.
    const objectId = ObjectId.createFromHexString(id);
    //Verify the Token to verify the Email of the user
    jwt.verify(userToken, process.env.JWT_KEY, async (err, decoded) => {
      if (err) {
        if (err.name === "TokenExpiredError") {
          return res.status(401).send({ error: "Token Expired" });
        }
        return res.status(400).send({ error: "Invalid Token" });
      }
      //Set a Status of the Email Verified User in DB
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
    //Check if the user has signed up already
    const user = await userCollection.findOne({ signUpEmail: email });
    if (!user) {
      return res.status(404).send({ msg: "User not found" });
    }
    //Password Matching
    const result = await bcrypt.compare(pass, user.signUpPassword);
    //Login Cookie created for security
    if (result) {
      // Cookie Config

      res.cookie("jwt", createToken(user.signUpEmail, user._id), cookieOptions);
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

// ---------Profile Function and Unique Nickname--------------//

export const buddyProfile = async (req, res) => {
  const { id } = req.params;
  const first = req.body.firstName;
  const last = req.body.lastName;
  const nick = req.body.nickName;
  try {
    //Used to create an ObjectId instance from a hexadecimal string.
    const objectId = ObjectId.createFromHexString(id);
    const data = await userCollection.findOne({ _id: objectId });
    //Query to find the Existence of the Nickname in the DB
    const uniqueNick = await userCollection.findOne({ nickName: nick });
    //Nick name set in the DB are Unique
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
  //When the user not verified Email during Signup then in Profile page to verify Email
  const { id } = req.params;
  try {
    const objectId = ObjectId.createFromHexString(id);
    const data = await userCollection.findOne({ _id: objectId });
    //Creates a another Token with Expiration and sent Mail
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
      //This Token then Follows the `verifyBuddy` API endpoint for verification
      return res.status(201).json({ userToken: token });
    }
  } catch (error) {
    console.log(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: error.message });
    }
  }
};

// -------------LogOut Function--------------//

export const logOut = async (req, res) => {
  const { id } = req.body;
  try {
    const objectId = ObjectId.createFromHexString(id);
    //Find the User in the DB and set the logout timestamp
    const date = Date.now();
    await userCollection.findOneAndUpdate(
      { _id: objectId },
      { $set: { logoutTime: date } }
    );
    //Clearing the JWT Token for Logout
    res.clearCookie("jwt", cookieOptions);
    return res.status(200).send({ msg: "Buddy Logged Out Successfully" });
  } catch (error) {
    console.log(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: error.message });
    }
  }
};

//--------------Forgot Password Function--------------//

export const forgotPassword = async (req, res) => {
  //Endpoint for forgotpassword
  const { forgotEmail } = req.body;
  try {
    //Creates a token with Expiration
    const token = jwt.sign({ email: forgotEmail }, process.env.JWT_KEY, {
      expiresIn: "15m",
    });
    //Sets the token in the DB to validate the User
    const findBuddy = await userCollection.findOneAndUpdate(
      { signUpEmail: forgotEmail },
      { $set: { resetToken: token } }
    );
    //Mail sent with the Link to Password Reset Page
    if (findBuddy) {
      const verifyLink = `${process.env.ORIGIN}/resetpassword/${findBuddy._id}`;
      await transporter.sendMail({
        ...mailOptions,
        to: [forgotEmail],
        subject: "Hibuddy your Password Reset link",
        html: `Hi! Buddy Your Password Reset link Expires in 15 minutes:<br/><br/>
        <a href=${verifyLink}>${verifyLink}</a>`,
      });
      return res
        .status(200)
        .json({ msg: "Reset Password Link Sent Successfully" });
    } else {
      return res.status(404).json({ msg: "User Not Found" });
    }
  } catch (error) {
    return res.status(500).send({ error: error.message });
  }
};

//--------------Password Reset Function--------------//

export const resetPassword = async (req, res) => {
  //In this Endpoint User can set the new password
  const { id } = req.params;
  try {
    const objectId = ObjectId.createFromHexString(id);
    const findBuddy = await userCollection.findOne({ _id: objectId });
    //Verifies the Stores Token in the DB
    if (findBuddy) {
      jwt.verify(
        findBuddy.resetToken,
        process.env.JWT_KEY,
        async (err, decoded) => {
          if (err) {
            if (err.name === "TokenExpiredError") {
              return res.status(401).send({ error: "Token Expired" });
            }
          } //If decoded then New Hashed Password is replaced in the DB
          else {
            const newPassword = req.body.newPassword;
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            await userCollection.findOneAndUpdate(
              { _id: objectId },
              {
                $set: {
                  signUpPassword: hashedPassword,
                  confirmSignUpPassword: hashedPassword,
                },
              }
            );
            return res.status(200).json({ msg: "Password Reset Successfully" });
          }
        }
      );
    }
  } catch (error) {
    return res.status(500).send({ msg: "Error: " + error.message });
  }
};

//--------------Upload Profile picture in Cloudinary--------------//

export const uploadProfile = async (req, res) => {
  const { id } = req.params;
  try {
    //Cloudinary is used to store the profile picture of the user
    const objectId = ObjectId.createFromHexString(id);
    if (!req.file) {
      return res.status(404).json({ msg: "Error updating Image" });
    }
    cloudinary.config({
      cloud_name: `${process.env.CLOUD_NAME}`,
      api_key: `${process.env.API_KEY}`,
      api_secret: `${process.env.API_SECRET}`,
    });
    //For Uniqueness in Files
    const date = Date.now();
    const fileExtension = path.extname(req.file.originalname);
    const fileNameWithoutExt = path.basename(
      req.file.originalname,
      fileExtension
    );
    const fileName = `${fileNameWithoutExt}_${date}`;
    //Images Uploaded in the File
    const result = await cloudinary.uploader.upload(req.file.path, {
      public_id: fileName,
      folder: "Home/profiles",
    });
    //Optimized with the cloudinary options
    let optimizeUrl = cloudinary.url(result.public_id, {
      fetch_format: "auto",
      quality: "auto",
      crop: "auto",
      gravity: "auto",
    });
    // Remove the query parameter using a regex
    optimizeUrl = optimizeUrl.replace(/(\?_a=[^&]*)$/, "");
    await userCollection.findOneAndUpdate(
      { _id: objectId },
      { $set: { image: `${optimizeUrl}${fileExtension}` } }
    );
    return res.status(200).json({ file: `${optimizeUrl}${fileExtension}` });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: error.message });
    }
  }
};

//--------------Remove Profile picture in Cloudinary--------------//

export const removeProfile = async (req, res) => {
  //To replace the profile picture in the cloudinary
  const { id } = req.params;
  try {
    const objectId = ObjectId.createFromHexString(id);
    const user = await userCollection.findOne({ _id: objectId });

    if (!user || !user.image) {
      return res.status(404).json({ msg: "User or profile image not found" });
    }
    // Extract public ID from the image URL
    const imageUrl = user.image;
    const publicId = imageUrl.substring(
      imageUrl.lastIndexOf("/") + 1,
      imageUrl.lastIndexOf(".")
    );
    cloudinary.config({
      cloud_name: `${process.env.CLOUD_NAME}`,
      api_key: `${process.env.API_KEY}`,
      api_secret: `${process.env.API_SECRET}`,
    });
    // Delete the image from Cloudinary
    await cloudinary.uploader.destroy(`Home/profiles/${publicId}`);
    // Update the user's document to remove the image URL
    await userCollection.findOneAndUpdate(
      { _id: objectId },
      { $set: { image: null } }
    );
    return res.status(200).json({ msg: "Profile image removed successfully" });
  } catch (error) {
    console.error(error);
    if (!res.headersSent) {
      return res.status(500).send({ error: error.message });
    }
  }
};
