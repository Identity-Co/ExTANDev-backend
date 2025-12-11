import mongoose from "mongoose";
import { IBanners } from "../interfaces/banner_sliders";
import config from "../configs/constants";
const { Schema } = mongoose;

const BannerSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    sub_title: {
      type: String,
    },
    content: {
      type: String,
    },
    button_text: {
      type: String,
    },
    button_link: {
      type: String,
    },
    page: {
      type: String,
      enum: [
        'Homepage',
        'OurDestinations',
        'OurAdventures',
        'TotalTravel',
        'FieldNotes',
      ],
    },
    banner_image: {
      type: String,
    },
    location: {
      type: String,
    }
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: false }
);

export default mongoose.model<IBanners>("BannerSliders", BannerSchema);
