import mongoose from "mongoose";
import { ITours } from "../interfaces/tours";
import config from "../configs/constants";
const { Schema } = mongoose;

const DepartureSchema = new Schema(
  {
    api_departure_id: { type: Number, required: true },
    start_date: { type: Date, required: true },
    finish_date: { type: Date, required: true },
    date_cancelled: { type: Date, default: null },
    availability_status: { type: String, default: "" },
    availability_total: { type: Number, default: 0 },
    lowest_price: { type: Number, default: 0 },
    activities: { type: [String], default: [] },
  },
  { _id: false }
);

const TourSchema = new Schema(
  {
    api_resource: {
      type: String,
    },
    api_tour_id: {
      type: Number,
    },
    api_category_ids: {
      type: [Number],
    },
    api_departure_id: {
      type: Number,
    },
    name: {
      type: String,
      required: true,
    },
    slug: {
      type: String,
    },
    site_url: {
      type: String,
    },
    product_line: {
      type: String,
    },
    image: {
      type: String,
    },
    description: {
      type: String,
    },
    locations: {
      type: [String],
      default: [],
    },
    regions: {
      type: String
    },
    start_price: {
      type: Number,
      default: 0,
    },
    tour_days: {
      type: Number,
      default: 0,
    },
    departures: [DepartureSchema],
    user_id: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<ITours>("Tours", TourSchema);
