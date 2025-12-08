import { Document, Types } from "mongoose";

export interface ISettings extends Document {
  _id: Types.ObjectId;
  company_id?: Types.ObjectId;
  key: string;
  value?: string;
  setting_type: string;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
}
