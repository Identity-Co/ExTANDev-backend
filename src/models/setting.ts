import mongoose from "mongoose";
import { ISettings } from "../interfaces/settings";
import config from "../configs/constants";
const { Schema } = mongoose;

const SettingSchema = new Schema(
  {
    company_id: {
      type: Schema.Types.ObjectId,
      ref: "Company",
    },
    key: {
      type: String,
      required: true,
      maxlength: 100,
    },
    value: {
      type: String,
    },
    description: {
      type: String,
    },
    setting_type: {
      type: String,
      enum: [
        config.valueConstants.SETTING_TYPE.ADMIN,
      ],
      default: config.valueConstants.SETTING_TYPE.ADMIN,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<ISettings>("Setting", SettingSchema);
