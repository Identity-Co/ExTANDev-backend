import mongoose from "mongoose";
import config from "../configs/constants";
const { Schema } = mongoose;

const aboutSectionSchema = new Schema(
  {
    content: {type: String},
    direction: {type: String},
    image: {type: String},
  },
  { _id: false }
);

const factSchema = new Schema(
  {
    label: {type: String},
    content: {type: String},
  },
  { _id: false }
);

const faqSchema = new Schema(
  {
    question: {type: String},
    answer: {type: String},
  },
  { _id: false }
);

const fresortSchema = new Schema(
  {
    title: {type: String},
    resorts: [String],
  },
  { _id: false }
);

const overviewSchemaBanners = new Schema(
  {
    title: {type: String},
    content: {type: String},
    location: {type: String},
    image: {type: String},
  },
  { _id: false }
);

const overviewSchema = new Schema(
  {
    banners: [{type: overviewSchemaBanners}],
    about_title: {type: String},
    about_content: {type: String},
    button_text: {type: String},
    button_link: {type: String},
    sections: [{ type: aboutSectionSchema }],
    slider_images: [{type: String}],
    quick_facts_background: {type: String},
    quick_facts_title: {type: String},
    facts: [{type: factSchema}],
    faq: [{type: faqSchema}],
    adventure_posts: [{ type: mongoose.Schema.Types.ObjectId }],
    feature_resorts: {type: fresortSchema}
  },
  { _id: false }
);

const resortSchema = new Schema(
  {
    title: {type: String},
    content: {type: String},
    location: {type: String},
    image: {type: String},
  },
  { _id: true, immutable: true }
);

const resortTabSchema = new Schema(
  {
    banner_image: {type: String},
    about_title: {type: String},
    about_content: {type: String},
    button_text: {type: String},
    button_link: {type: String},
    resort_heading: {type: String},
    resort_tags: [String],
    resorts: [{ type: resortSchema }],
    adventure_posts: [{ type: mongoose.Schema.Types.ObjectId }],
    feature_destinations_title: {type: String},
    feature_destinations: [String],
  },
  { _id: false }
);

const adventureListsContentList = new Schema(
  {
    image: {type: String},
    heading: {type: String},
    content: {type: String},
  },
  { _id: false }
);

const adventureLists = new Schema(
  {
    title: {type: String},
    feature_image: {type: String},
    banner_image: {type: String},
    suitable_for: [String],
    seasons_time: [String],
    about_title: {type: String},
    about_content: {type: String},
    about_button_text: {type: String},
    about_button_link: {type: String},
    selected_review: {type: String},
    content_title: {type: String},
    content_list: [{ type: adventureListsContentList }],
    map_image: {type: String},
  },
  { _id: true }
);

const AdventureTabSchema = new Schema(
  {
    banner_image: {type: String},
    about_title: {type: String},
    about_content: {type: String},
    button_text: {type: String},
    button_link: {type: String},
    adventure_lists: [{type: adventureLists}],
    adventure_posts: [{ type: mongoose.Schema.Types.ObjectId }],
    feature_resorts: {type: fresortSchema}
  },
  { _id: false }
);

const Stories = new Schema(
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

const StoryTabSchema = new Schema(
  {
    banner_image: {type: String},
    about_title: {type: String},
    about_content: {type: String},
    button_text: {type: String},
    button_link: {type: String},
    stories:[{ type: Stories }]
  },
  { _id: false }
);


const DestinationSchema = new Schema(
  {
    title: { type: String, required: true  },
    sub_title: { type: String },
    image: { type: String, required: true },
    button_text: { type: String, },
    button_link: { type: String, },
    overview: {type: overviewSchema, required: false},
    resorts:{type: resortTabSchema, required: false},
    adventures:{type: AdventureTabSchema, required: false},
    stories:{type: StoryTabSchema, required: false},
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
    destination_location: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: false }
);

export default mongoose.model("Destination", DestinationSchema);
