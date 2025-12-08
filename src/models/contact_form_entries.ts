import mongoose from "mongoose";
import config from "../configs/constants";
const { Schema } = mongoose;

const ContactFormEntriesSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    email_address: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: false }
);

export default mongoose.model("ContactFormEntries", ContactFormEntriesSchema);