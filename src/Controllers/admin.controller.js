import asyncHandler from "../Utilis/asyncHyndler.js";
import { ApiError } from "../Utilis/apiError.js";
import { ApiResponse } from "../Utilis/apiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
let options = {
  httpOnly: true,
  secure: true,
};



const getUsers =asyncHandler( async (req, res) => {
  try {
    const users = await User.find().select('username email credits role');
    return res
    .status(200)
    .json(new ApiResponse(200, users, "fetched all ussers succesfully"));
  } catch (err) {
    res.status(401).json(new ApiError(401));
  }
});

const updateCredits = asyncHandler(async (req, res) => {
  const { userId, credits } = req.body;
  try {
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.credits = credits; // Update the credit balance
    await user.save();

    res.json({ message: 'Credits updated successfully', user });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const getAnalytics = asyncHandler(async (req, res) => {
  try {
    const analytics = await AdminAnalytics.find().sort({ date: -1 }).limit(30);
    res.json(analytics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


export{
    getUsers,
getAnalytics,
updateCredits,
}