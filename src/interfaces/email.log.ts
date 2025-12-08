import { Types } from "mongoose";

export interface IEmailLog {
  _id: Types.ObjectId;
  client_id: Types.ObjectId;
  to: Array<string>;
  cc?: Array<string>;
  subject: string;
  html?: string;
  description?: string;
  createdAt?: Date;
  updatedAt?: Date;
}
