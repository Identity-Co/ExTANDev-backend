import mongoose from "mongoose";
import { IActionList } from "../interfaces/royalty";
import config from "../configs/constants";
const { Schema } = mongoose;

const ActionListSchema = new Schema(
  {
    action_name: {
      type: String,
      required: true,
    },
    action_code: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<IActionList>("ActionList", ActionListSchema);
