import mongoose from "mongoose";
import config from "../configs/constants";
const { Schema } = mongoose;

const AdventureSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    sub_title: {
      type: String,
    },
    button_text: {
      type: String,
    },
    button_link: {
      type: String,
    },
    image: {
      type: String,
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model("Adventure", AdventureSchema);
