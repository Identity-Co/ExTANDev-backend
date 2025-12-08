import { Types } from "mongoose";
import constants from "../configs/constants";
import { IAddress, IPhone, ISocialMediaUrls } from "./common";

interface IResetQuestions {
  question: string;
  answer: string;
}

export interface IUser {
  _id?: Types.ObjectId;
  first_name: string;
  last_name: string;
  email: string;
  password: string;
  profile_picture?: string;
  status: number;
  role: string;
  permissions: string[];
  address?: IAddress;
  phone: IPhone;
  is_email_verified: boolean;
  theme_mode: "light" | "dark";
  two_factor_enabled?: boolean;
  two_factor_auth_code?: string;
  two_factor_auth_code_expiry?: Date;
  reset_questions_available?: boolean;
  reset_questions?: IResetQuestions[];
  send_email_2fa?: boolean;
  reset_token?: string;
  reset_token_expiry?: Date;
  created_at?: Date;
  updated_at?: Date;
  ambassador_status: number;
  socialmedia_urls: ISocialMediaUrls;

  membership_level?: number;
  travel_interests?: string[];
  preferred_destinations?: string[];
  travel_frequency?: string;
  budget?: string;
  opt_in?: boolean;
  access_uid?: string;
  wp_user_id?: number;
}
