import mongoose from "mongoose";
import { ITourDetails } from "../interfaces/tours";
import config from "../configs/constants";
const { Schema } = mongoose;

const SiteLinksSchema = new Schema(
  {
    checkout: { type: String, default: "" },
    download_pdf: { type: String, default: "" },
  },
  { _id: false }
);

const GeographySchema = new Schema(
  {
    start_city: { type: String, default: "" },
    finish_city: { type: String, default: "" },
  },
  { _id: false }
);

const IntroductionSchema = new Schema(
  {
    intro_id: { type: Number, default: 0 },
    label: { type: String, default: "" },
    content: { type: String, default: "" },
  },
  { _id: false }
);

const MealsIncludedSchema = new Schema(
  {
    breakfast: { type: Number, default: 0 },
    lunch: { type: Number, default: 0 },
    dinner: { type: Number, default: 0 },
  },
  { _id: false }
);

const DaysComponentsSchema = new Schema(
  {
    type: { type: String, default: "" },
    name:{ type: String, default: "" },
    summary: { type: String, default: "" },
  },
  { _id: false }
);

const DaysSummarySchema = new Schema(
  {
    day: { type: Number, default: 0 },
    label: { type: String, default: "" },
    summary: { type: String, default: "" },
    instructions: { type: String, default: "" },
    start_location: { type: String, default: "" },
    end_location: { type: String, default: "" },
    meals: { type: [String], default: [] },
    components: [DaysComponentsSchema],
    optional_activities: { type: [Number], default: 0 },
  },
  { _id: false }
);

const GalleryImagesSchema = new Schema(
  {
    type: { type: String, default: "" },
    url:{ type: String, default: "" },
    video_url:{ type: String, default: "" },
  },
  { _id: false }
);

const PromotionsSchema = new Schema(
  {
    promo_id: { type: Number, default: 0 },
    promo_name: { type: String, default: "" },
    promotion_code: { type: String, default: "" },
    discount_amount: { type: Number, default: 0 },
    discount_percent: { type: Number, default: 0 },
    start_datetime: { type: Date },
    finish_datetime: { type: Date },
    terms_and_conditions:{ type: String, default: "" },
  },
  { _id: false }
);

const AvailabilitySchema = new Schema(
  {
    depart_id: { type: Number, default: 0 },
    start_date: { type: Date },
    finish_date: { type: Date },
    status: { type: String, default: "" },
    spaces: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
  },
  { _id: false }
);

const TourDetailsSchema = new Schema(
  {
    ref_tour_id: { type: String, },
    ref_api_resource: { type: String, },
    ref_api_tour_id: { type: Number, default: 0 },

    site_links: SiteLinksSchema,
    map_image: { type: String },
    geography: GeographySchema,
    categories: { type: [Number], default: [] },
    full_details: [IntroductionSchema],
    meals_included: MealsIncludedSchema,
    days_summary: [DaysSummarySchema],
    gallery_images: [GalleryImagesSchema],
    promotions: [PromotionsSchema],
    availabilities: [AvailabilitySchema],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<ITourDetails>("TourDetails", TourDetailsSchema);
