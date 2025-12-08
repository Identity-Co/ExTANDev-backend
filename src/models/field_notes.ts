import mongoose from "mongoose";
import { IFieldNotes } from "../interfaces/field_notes";
import config from "../configs/constants";
const { Schema } = mongoose;

const FieldNoteSchema = new Schema(
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
    },
    logo: {
      type: String,
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<IFieldNotes>("FieldNotes", FieldNoteSchema);
