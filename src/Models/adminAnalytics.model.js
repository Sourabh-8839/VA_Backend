const mongoose = require('mongoose');

const adminAnalyticsSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  totalUsers: { type: Number, default: 0 },
  totalCreditsAwarded: { type: Number, default: 0 },
  totalPostsSaved: { type: Number, default: 0 },
  totalReports: { type: Number, default: 0 }
});

module.exports = mongoose.model('AdminAnalytics', adminAnalyticsSchema);