import { IUser } from "./../interfaces/user";
import { Types } from "mongoose";
import mongoose from "mongoose";
import config from "../configs/constants";
const GeneralSetting = mongoose.model("GeneralSetting");

export async function getSettingData(key: string = '') {
  try {
    const settings = await GeneralSetting.findOne();
    return settings ? settings[key] : null;
  } catch (error) {
    throw error;
  }
}
