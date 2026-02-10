// import dotenv from "dotenv";
// import "dotenv/config";

// this is no longer required as we are using better-auth insead of using the normal email and password approach. 

import jwt from "jsonwebtoken";
// dotenv.config({ path: "../.env" });

const JWT_SECRET = process.env.JWT_SECRET;

export const generateToken = (user) => {
  // console.log(process.env.JWT_SECRET);
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "1d" },
  );
};

export const verifyToken = (token) => {
  // console.log(process.env.JWT_SECRET)
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (error) {
    // console.log(error);
    return null;
  }
};
