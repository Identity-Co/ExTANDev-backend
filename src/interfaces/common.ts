import { Types } from "mongoose";

export interface IFindByIdQuerySchema {
  _id: Types.ObjectId;
}

export interface IAddress {
  address: string;
  address2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
}

export interface IPhone {
  country_code: string;
  number: string;
  extension?: string;
}

export interface ISendEmailInterface {
  to: Array<string>;
  cc?: Array<string>;
  subject: String;
  html?: string;
  text?: string;
  attachments?: any;
}
