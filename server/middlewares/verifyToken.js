import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = async (req, res, next) => {
  const token = req.cookies.jwt;
  console.log(req.Id)
  if (!token) {
    return res.status(403).send({ msg: "Not authorized" });
  }
  jwt.verify(token, process.env.JWT_KEY, async (err, result) => {
    if (err) {
      return res.status(403).send({ msg: "Token not valid or Expired!" });
    }
    req.Id = result.Id;
    next();
  });
};
