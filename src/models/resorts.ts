import mongoose from "mongoose";
import config from "../configs/constants";
const { Schema } = mongoose;

/* OVERVIEW TAB START */

const overviewSchemaBanners = new Schema(
  {
    title: {type: String},
    content: {type: String},
    image: {type: String},
  },
  { _id: false }
);

const overviewSchemaPropertyHighlights = new Schema(
  {
    title: {type: String},
    description: {type: String},
    image: {type: String},
  },
  { _id: false }
);

const overviewSchemaMapContentBoxes = new Schema(
  {
    title: {type: String},
    content: {type: String},
  },
  { _id: false }
);

const overviewSchemaMapInfoBoxes = new Schema(
  {
    title: {type: String},
    content: {type: String},
  },
  { _id: false }
);

const overviewSchemaMap = new Schema(
  {
    map_latitude: {type: String},
    map_longitude: {type: String},
    content_boxes: [{ type: overviewSchemaMapContentBoxes }],
    info_boxes: [{ type: overviewSchemaMapInfoBoxes }],
  },
  { _id: false }
);

const overviewSchema = new Schema(
  {
    banners: [{type: overviewSchemaBanners}],
    about_title: {type: String},
    about_content: {type: String},
    about_button_text: {type: String},
    about_button_link: {type: String},
    property_highlights: [{ type: overviewSchemaPropertyHighlights }],
    slider_images: [{type: String}],
    map: {type: overviewSchemaMap, required: false},
    adventure_posts: [{ type: mongoose.Schema.Types.ObjectId }],
  },
  { _id: false }
);

/* OVERVIEW TAB END */

/* ROOMS TAB START */

const roomsSchemaBanners = new Schema(
  {
    title: {type: String},
    image: {type: String},
  },
  { _id: false }
);

const overviewSchemaRoomLists = new Schema(
  {
    title: {type: String},
    description: {type: String},
    gallery: [{type: String}],
    feature_description: {type: String},
    features_lists: [{type: String}],
  },
  { _id: true }
);

const roomsSchema = new Schema(
  {
    banners: [{type: roomsSchemaBanners}],
    about_button_text: {type: String},
    about_button_link: {type: String},
    room_lists: [{ type: overviewSchemaRoomLists, required: false }],
    review_background: {type: String},
    selected_review: {type: String},
  },
  { _id: false }
);

/* ROOMS TAB END */

/* SERVICES & AMENITIES TAB START */

const servicesamenitiesSchemaBanners = new Schema(
  {
    title: {type: String},
    image: {type: String},
  },
  { _id: false }
);

const servicesamenitiesSectionsList = new Schema(
  {
    section_type: {type: String},
    title: {type: String},
    content: {type: String},
    image: {type: String},
    review_text: {type: String},
    rating: {type: String},
    reviewer_name: {type: String},
  },
  { _id: false }
);

const servicesamenitiesSchema = new Schema(
  {
    banners: [{type: servicesamenitiesSchemaBanners}],
    about_title: {type: String},
    about_button_text: {type: String},
    about_button_link: {type: String},
    services_sections: [{ type: servicesamenitiesSectionsList, required: false }],
  },
  { _id: false }
);

/* SERVICES & AMENITIES TAB END */

/* OFFERS TAB START */

const offersSchemaBanners = new Schema(
  {
    title: {type: String},
    image: {type: String},
  },
  { _id: false }
);

const offersSectionsList = new Schema(
  {
    title: {type: String},
    content: {type: String},
    image: {type: String},
    from_date: {type: String},
    to_date: {type: String},
    button_text: {type: String},
    button_url: {type: String},
  },
  { _id: false }
);

const offersSchema = new Schema(
  {
    banners: [{type: offersSchemaBanners}],
    about_button_text: {type: String},
    about_button_link: {type: String},
    offers_lists: [{ type: offersSectionsList, required: false }],
    bottom_image: {type: String},
  },
  { _id: false }
);

/* OFFERS TAB END */

/* STORIES TAB START */

const storiesSchemaBanners = new Schema(
  {
    title: {type: String},
    image: {type: String},
  },
  { _id: false }
);

const storiesSchemaList = new Schema(
  {
    userprofile: {type: String},
    name: {type: String},
    date: {type: String},
    username: {type: String},
    location: {type: String},
    content: {type: String},
    gallery: [String]
  }
);

const storiesSchema = new Schema(
  {
    banners: [{type: storiesSchemaBanners}],
    about_title: {type: String},
    stories_lists: [{ type: storiesSchemaList, required: false }],
  },
  { _id: false }
);

/* STORIES TAB END */

const ResortSchema = new Schema(
  {
    name: { type: String, required: true },
    image: String,
    location: String,
    country: String,
    short_description: String,
    tags: [{type: String}],
    posted_user: {
      type: String,
      ref: 'User'
    },
    overview: {type: overviewSchema, required: false},
    rooms: {type: roomsSchema, required: false},
    services_amenities: {type: servicesamenitiesSchema, required: false},
    offers: {type: offersSchema, required: false},
    stories: {type: storiesSchema, required: false},
    meta_description: { type: String, },
    meta_keywords: { type: String, },
    meta_title: { type: String, },
    page_url: { type: String, required: true, unique: true },
    author: { type: String, },
    publisher: { type: String, },
    copyright: { type: String, },
    rating: { type: String, },
    revisit_after: { type: String, },
    robots: { type: String, },
    classification: { type: String, },
    share_button_link: { type: String, },
    share_button_text: { type: String, },
    share_sub_title: { type: String, },
    share_title: { type: String, },
    subscribe_button_link: { type: String, },
    subscribe_button_text: { type: String, },
    subscribe_sub_title: { type: String, },
    subscribe_title: { type: String, },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: false }
);

export default mongoose.model("Resorts", ResortSchema);