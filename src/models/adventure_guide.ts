import mongoose, { Schema } from "mongoose";
import { IAdventureGuide } from "../interfaces/adventure_guide";

const ContentSectionItemSchema = new Schema(
  {
    type: { type: String, required: true },
    value: { type: String },
    caption: { type: String },
  },
  { _id: false, strict: false }
);

const ContentSectionSchema = new Schema(
  {
    fields: { type: [ContentSectionItemSchema], default: [] },
  },
  { _id: false, strict: false }
);

const AdventureGuideSchema = new Schema<IAdventureGuide>(
  {
    title: { type: String, required: true },

    feature_image: String,
    banner_image: String,
    banner_description: String,
    excerpt: String,
    author_name: String,
    author_testimonial: String,
    author_image: String,
    site_url: String,
    site_logo: String,
    page_url: { type: String, required: true, unique: true },
    posted_user: {
      type: String,
      required: false,
      default: null
    },
    post_visiblility: {
      type: String,
      required: false,
      default: null
    },
    social_engagement: {
      type: String,
      required: false,
      default: null
    },
    // repeater sections
    content_sections: { type: [ContentSectionSchema], default: [] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: false }
);

export default mongoose.model<IAdventureGuide>("AdventureGuide", AdventureGuideSchema);
