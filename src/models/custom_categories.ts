import mongoose from "mongoose";
import { ICustomCategories } from "../interfaces/tours";
import config from "../configs/constants";
const { Schema } = mongoose;

const CustomCategorySchema = new Schema(
  {
    category_name: {
      type: String,
      required: true,
    },
    search_pattern: {
      type: String,
      required: true,
    },
    image: { type: String }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" } }
);

export default mongoose.model<ICustomCategories>("CustomCategories", CustomCategorySchema);
