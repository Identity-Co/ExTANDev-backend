import mongoose from "mongoose";
import config from "../configs/constants";
const { Schema } = mongoose;

const FollowSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    follow_type: {
      type: String,
    },
    follow_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Follows", FollowSchema);
