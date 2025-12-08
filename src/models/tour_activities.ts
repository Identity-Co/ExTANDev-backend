import mongoose from "mongoose";
import { ITourActivities } from "../interfaces/tours";
import config from "../configs/constants";
const { Schema } = mongoose;

const TourActivitySchema = new Schema(
  {
    api_activity_id: {
      type: Number,
    },
    activity_name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<ITourActivities>("TourActivities", TourActivitySchema);
