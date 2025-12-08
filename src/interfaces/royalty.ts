import { Document, Types } from "mongoose";

export interface IRoyaltyParameters extends Document {
  _id: Types.ObjectId;
  parameter_key: string;
  parameter_name: string;
  parameter_value: number;
  order_no: number;
  created_at?: Date;
  updated_at?: Date;
}

export interface IActionList extends Document {
  _id: Types.ObjectId;
  action_name: string;
  action_code: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface IPointsHistory extends Document {
  _id: Types.ObjectId;
  member_id: string;
  action_id: string;
  reference_id: string;
  points_earned: number;
  action_sub_type?: string;
  share_via?: string;
  created_at?: Date;
  updated_at?: Date;
}
