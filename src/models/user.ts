import mongoose from "mongoose";
import { IUser } from "../interfaces/user";
import constants from "../configs/constants";
import { addressSchema, phoneSchema, socialMediaSchema } from "./common";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    first_name: {
      type: String,
      required: true,
    },
    last_name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
    profile_picture: String,
    status: {
      type: Number,
      default: constants.statusConstants.USER_STATUS.ACTIVE,
      enum: [
        constants.statusConstants.USER_STATUS.ACTIVE,
        constants.statusConstants.USER_STATUS.INACTIVE,
        constants.statusConstants.USER_STATUS.DELETED,
      ],
    },
    role: {
      type: String,
      required: true,
      enum: [
        constants.ROLE.USER.ADMIN,
        constants.ROLE.USER.USER,
        constants.ROLE.USER.AMBASSADOR,
        constants.ROLE.USER.TRAVEL_SUPPLIER,
        constants.ROLE.USER.PROPERTY_OWNER,
      ],
    },
    permissions: {
      type: [String],
      required: true,
      // enum: constants.PERMISSIONS,
    },
    address: {
      type: addressSchema,
      required: false,
    },
    phone: {
      type: phoneSchema,
      required: false,
    },
    is_email_verified: { type: Boolean, default: false },
    reset_token: String,
    reset_token_expiry: Date,
    theme_mode: {
      type: String,
      enum: ["light", "dark"],
      default: "light",
    },
    ambassador_status: {
      type: Number,
      required: false,
      default: 0
    },
    socialmedia_urls: {
      type: socialMediaSchema,
      required: false,
    },

    membership_level: {
      type: Number,
      required: false,
      default: 0
    },
    travel_interests: {
      type: [String],
      required: false
    },
    preferred_destinations: {
      type: [String],
      required: false
    },
    travel_frequency: {
      type: String,
      required: false
    },
    budget: {
      type: String,
      required: false
    },
    opt_in: {
      type: Boolean,
      required: false,
      default: false
    },
    access_uid: {
      type: String,
      required: false
    },
    wp_user_id: {
      type: Number,
      required: false,
      default: 0
    },
    googleId: {
      type: String,
      required: false,
      default: null
    },
    fbId: {
      type: String,
      required: false,
      default: null
    },
    provider: {
      type: String,
      required: false,
      default: null
    },
    referance_id:{
      type: String,
      required: false,
    },
    verification_token: {
      type: String,
      required: false,
      default: null
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<IUser>("User", UserSchema);
