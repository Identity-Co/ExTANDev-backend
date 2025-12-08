import { Document, Types } from "mongoose";

export interface IBanners extends Document {
  _id: Types.ObjectId;
  title: string;
  sub_title?: string;
  content?: string;
  button_text?: string;
  button_link?: string;
  page: string;
  banner_image?: string;
  created_at?: Date;
  updated_at?: Date;
}
