import { Document, Types } from "mongoose";

export interface Departure {
  api_departure_id: number;
  start_date: Date;
  finish_date: Date;
  date_cancelled: Date | null;
  availability_status: string;
  availability_total: number;
  lowest_price: number;
  activities: string[];
}

export interface ITours extends Document {
  _id: Types.ObjectId;
  api_resource: string;
  api_tour_id?: number;
  api_category_ids?: number[];
  name: string;
  slug: string;
  site_url: string;
  product_line?: string;
  image?: string;
  description?: string;
  locations?: string[];
  regions?: string;
  start_price?: number;
  tour_days?: number;
  departures: Departure[];
  created_at?: Date;
  updated_at?: Date;
}

export interface ITourCategories extends Document {
  _id: Types.ObjectId;
  api_category_id: number;
  category_name: string;
  description?: string;
  api_parent_id?: number;
  api_resource: string;
  created_at?: Date;
  updated_at?: Date;
}

export interface ITourActivities extends Document {
  _id: Types.ObjectId;
  api_activity_id: number;
  activity_name: string;
  description?: string;
}





export interface SiteLinks {
  checkout?: string;
  download_pdf?: string;
}

export interface Geography {
  start_city?: string;
  finish_city?: string;
}

export interface Introduction {
  intro_id: number;
  label?: string;
  content?: string;
}

export interface MealsIncluded {
  breakfast?: number;
  lunch?: number;
  dinner?: number;
}

export interface DaysComponents {
  type?: string;
  name?: string;
  summary?: string;
}

/* export interface DaysOptionalActivities {
  activity_id: number;
  name?: string;
}
optional_activities?: DaysOptionalActivities[]; */

export interface DaysSummary {
  day?: number;
  label?: string;
  summary?: string;
  instructions?: string;
  start_location?: string;
  end_location?: string;
  meals?: string[];
  components?: DaysComponents[];
  optional_activities?: number[];
}

export interface GalleryImages {
  type?: string;
  url?: string;
  video_url?: string;
}

export interface Promotions {
  promo_id?: number;
  promo_name?: string;
  promotion_code?: string;
  discount_amount?: string;
  discount_percent?: string;
  start_datetime?: Date;
  finish_datetime?: Date;
  terms_and_conditions?: string;
}

export interface Availabilities {
  depart_id?: number;
  start_date?: Date;
  finish_date?: Date;
  status?: string;
  spaces?: number;
  price?: number;
}

export interface ITourDetails extends Document {
  _id: Types.ObjectId;
  ref_tour_id?: string;
  ref_api_resource: string;
  ref_api_tour_id?: number;

  site_links?: SiteLinks;
  map_image?: string;
  geography?: Geography;
  categories?: number[];
  full_details: Introduction[];
  meals_included?: MealsIncluded;
  days_summary?: DaysSummary[];
  gallery_images?: GalleryImages[];
  promotions?: Promotions[];
  availabilities?: Availabilities[];
}




export interface ICustomCategories extends Document {
  _id: Types.ObjectId;
  category_name?: string;
  search_pattern: string;
  image: string;
}
