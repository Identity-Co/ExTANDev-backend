import mongoose from "mongoose";
const { Schema, Types } = mongoose;
import { IEmailLog } from "../interfaces/email.log";

const EmailLogSchema = new Schema(
  {
    client_id: { type: Types.ObjectId, ref: "Client", required: true },
    to: { type: Array<String>, required: true },
    cc: { type: Array<String>, required: false },
    subject: { type: String, required: true },
    html: { type: String, required: false },
    description: { type: String, required: false },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model<IEmailLog>("EmailLog", EmailLogSchema);
