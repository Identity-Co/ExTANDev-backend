import { IUser } from "../interfaces/user";
import jwt from "jsonwebtoken";
import constants from "../configs/constants";
import bcrypt from "bcrypt";
import { randomBytes } from "crypto";
import { promisify } from "util";
import mongoose from "mongoose";

export const generateJWToken = async (user: IUser) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      first_name: user.first_name,
      last_name: user.last_name,
      role: user.role,
    },
    constants.config.APP_SECRET,
    { expiresIn: "30d" }
  );
};

export const hashPassword = async (password: string) => {
  const hash = await bcrypt.hash(password, 10);
  return hash;
};

export const createHash = async () => {
  const randomBytesPromise = promisify(randomBytes);
  const hash = (await randomBytesPromise(20)).toString("hex");
  return hash;
};

export default function delay(ms:any) {
  console.log("Delay for : ", ms);
  return new Promise(resolve => setTimeout(resolve, ms));
}

export const getdaysDifference = (date1: Date, date2: Date) => {
  const timeDifference = Math.abs(date2.getTime() - date1.getTime());
  const daysDifference = Math.ceil(timeDifference / (1000 * 60 * 60 * 24));
  return daysDifference;
}