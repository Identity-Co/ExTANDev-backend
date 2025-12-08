import mongoose from "mongoose";
import config from "../configs/constants";
const { Schema } = mongoose;

const SavedSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    collection_name: {
      type: String,
    },
    collection_id: {
      type: String,
      default: 0,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Saved", SavedSchema);
