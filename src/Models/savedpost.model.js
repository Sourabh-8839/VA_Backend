import mongoose from "mongoose";

const savedPostSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  source: { type: String, enum: ['twitter', 'reddit', 'linkedin'], required: true },
  postId: { type: String, required: true }, // ID from external API
  postData: { type: Object }, // Flexible to store entire fetched post JSON
  
  savedAt: { type: Date, default: Date.now }
});


export const SavedPost = mongoose.model("SavedPost", savedPostSchema);