import mongoose from "mongoose";
import configs from "./configs/constants";

export async function connectDb() {
  mongoose.set("strictQuery", true);
  return new Promise((resolve, reject) => {
    mongoose
      .connect(configs.config.DATABASE_URL)
      .then(() => {
        resolve(true);
      })
      .catch((err) => {
        console.log(err);
        reject(false);
      });
  });
}

import "./models/user";
import "./models/setting";
import "./models/banner_slider";
import "./models/home_page_section";
import "./models/field_notes";
import "./models/pages";
import "./models/destinations";
import "./models/page_data";
import "./models/adventure_guide";
import "./models/tours";
import "./models/tour_categories";
import "./models/tour_activities";
import "./models/tour_details";
import "./models/custom_categories";
import "./models/contact_form_entries";
import "./models/reviews";
import "./models/likes";
import "./models/saved";
import "./models/comments";
import "./models/follows";
import "./models/general_setting";
import "./models/resorts";

import "./models/royalty_parameters";
import "./models/action_list";
import "./models/points_history";
