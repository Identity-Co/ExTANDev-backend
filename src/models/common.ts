import { Schema } from "mongoose";

export const addressSchema = new Schema(
  {
    address: { type: String, required: true },
    address2: { type: String, required: false },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zip: { type: String, required: true },
    country: { type: String, required: true },
  },
  { _id: false }
);

export const phoneSchema = new Schema(
  {
    country_name: { type: String, required: true },
    country_code: { type: String, required: true },
    number: { type: String, required: true }
  },
  { _id: false }
);

export const socialMediaSchema = new Schema(
  {
    instagram_url: { type: String, required: false },
    facebook_url: { type: String, required: false },
    pinterest_url: { type: String, required: false },
    twitterx_url: { type: String, required: false },
    whatsapp_url: { type: String, required: false },
    tiktok_url: { type: String, required: false },
  },
  { _id: false }
);
