import mongoose from "mongoose";
import config from "../configs/constants";
const { Schema } = mongoose;

const GeneralSettingSchema = new Schema(
  {
    header_logo: {
      type: String,
    },
    footer_logo: {
      type: String,
    },
    admin_email: {
      type: String,
    },
    sendgrid_from_email: {
      type: String,
    },
    sendgrid_api_key: {
      type: String,
    },
    instagram_url: {
      type: String,
    },
    facebook_url: {
      type: String,
    },
    youtube_url: {
      type: String,
    },
    twitter_url: {
      type: String,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: false }
);

export default mongoose.model("GeneralSetting", GeneralSettingSchema);