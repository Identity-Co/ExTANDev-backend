import mongoose from "mongoose";
import config from "../configs/constants";
const { Schema } = mongoose;

const ReviewsSchema = new Schema(
  {
    rating: {
      type: Number,
      required: true,
    },
    review_text: {
      type: String,
      required: true,
    },
    user_id: {
      type: String,
      ref: 'User',
      required: true,
    },
    review_url:{
      type: String,
    },
    collection_name: {
      type: String,
    },
    collection_id: {
      type: String,
      default: 0,
    },
    status: {
      type: Number,
    },
    ip_address: {
      type: String,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: false }
);

export default mongoose.model("Reviews", ReviewsSchema);