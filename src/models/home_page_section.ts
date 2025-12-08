import mongoose from "mongoose";
import config from "../configs/constants";
const { Schema } = mongoose;

const HomePageSchema = new Schema(
  {
    section_name: {
      type: String,
    },
    section_key: {
      type: String,
    },
    status: {
      type: Number,
    },
    adventure_posts: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: false }
);

export default mongoose.model("HomePage", HomePageSchema);
