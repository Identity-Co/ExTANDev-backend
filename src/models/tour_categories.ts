import mongoose from "mongoose";
import { ITourCategories } from "../interfaces/tours";
import config from "../configs/constants";
const { Schema } = mongoose;

const TourCategorySchema = new Schema(
  {
    api_category_id: {
      type: Number,
    },
    category_name: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    api_parent_id: {
      type: Number,
    },
    api_resource: {
      type: String,
      required: true,
    },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<ITourCategories>("TourCategories", TourCategorySchema);
