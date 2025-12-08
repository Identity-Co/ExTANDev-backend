import mongoose from "mongoose";
import { IPointsHistory } from "../interfaces/royalty";
import config from "../configs/constants";
const { Schema } = mongoose;

const PointsHistorySchema = new Schema(
  {
    member_id: {
      type: String,
      required: true,
    },
    action_id: {
      type: String,
      required: true,
    },
    reference_id: {
      type: String,
      required: false,
    },
    points_earned: {
      type: Number,
      default: 0,
    },
    action_sub_type: {
      type: String,
      required: false,
    },
    share_via: {
      type: String,
      required: false,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<IPointsHistory>("PointsHistory", PointsHistorySchema);
