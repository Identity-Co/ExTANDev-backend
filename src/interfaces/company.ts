import { Types } from "mongoose";
import { IAddress, IPhone } from "./common";

export interface ICompany {
  _id: Types.ObjectId;
  company_name: string;
  company_address: IAddress;
  user_id: Types.ObjectId;
  status: number;
  company_email: string;
  company_phone: IPhone;
  created_at?: Date;
  updated_at?: Date;
}
