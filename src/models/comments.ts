import mongoose from "mongoose";
import config from "../configs/constants";
const { Schema } = mongoose;

const reportSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    reason: {
      type: String,
      required: true,
      enum: ['Spam', 'Harassment', 'Hate speech', 'Inappropriate content', 'False information', 'Other']
    },
    description: {
      type: String,
      default: ''
    },
    created_at: {
      type: Date,
      default: Date.now
    },
    status: {
      type: String,
      enum: ['pending', 'reviewed', 'resolved', 'dismissed'],
      default: 'pending'
    }
  },
  { strict: false }
);

const CommentSchema = new Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
    },
    collection_name: {
      type: String,
    },
    collection_id: {
      type: String,
      default: 0,
    },
    comment:{
      type: String,
    },
    parent_id: {
      type: String,
    },
    upvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: []
    }],
    upvoteCount: {
      type: Number,
      default: 0
    },
    helpfules: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: []
    }],
    helpfulCount: {
      type: Number,
    },
    reports: [reportSchema],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, strict: false }
);

export default mongoose.model("Comments", CommentSchema);
