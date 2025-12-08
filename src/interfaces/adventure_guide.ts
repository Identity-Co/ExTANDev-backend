import { Document, Types } from "mongoose";

export interface IContentSectionItem {
  type: string;
  value?: string;
  caption?: string;
}

export interface IContentSection {
  fields: IContentSectionItem[];
}

export interface IAdventureGuide extends Document {
  // Required field (matches schema)
  title: string;
  
  // Optional fields
  feature_image?: string;
  banner_image?: string;
  banner_description?: string;
  excerpt?: string;
  author_name?: string;
  author_testimonial?: string;
  author_image?: string;
  site_url?: string;
  site_logo?: string;
  page_url?: string;
  posted_user?: string;
  post_visiblility?: string;
  social_engagement?: string;

  // Array with default value (always exists)
  content_sections: IContentSection[];

  // Timestamps (managed by Mongoose, always exist after save)
  created_at: Date;
  updated_at: Date;
}