import mongoose from "mongoose";
import config from "../configs/constants";
const { Schema } = mongoose;

const PageDataSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    status: {
      type: Number,
    },
    is_delete: {
      type: Number,
    },
    page_url: { 
      type: String,
      unique: true
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: false }
);

export default mongoose.model("PageData", PageDataSchema);
