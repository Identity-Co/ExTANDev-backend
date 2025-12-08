import mongoose from "mongoose";
import { IRoyaltyParameters } from "../interfaces/royalty";
import config from "../configs/constants";
const { Schema } = mongoose;

const RoyaltyParametersSchema = new Schema(
  {
    parameter_key: {
      type: String,
      required: true,
    },
    parameter_name: {
      type: String,
      required: true,
    },
    parameter_value: {
      type: Number,
      default: 0,
    },
    order_no: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<IRoyaltyParameters>("RoyaltyParameters", RoyaltyParametersSchema);
