import { Document, Types } from "mongoose";

export interface IFieldNotes extends Document {
  _id: Types.ObjectId;
  title: string;
  description?: string;
  button_text?: string;
  button_link?: string;
  image?: string;
  logo?: string;
  created_at?: Date;
  updated_at?: Date;
}
