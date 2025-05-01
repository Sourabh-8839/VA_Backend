import mongoose, { Schema } from "mongoose";

import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true },
  password: { type: String, required: true }, // Hashed password
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  
  profileCompleted: { type: Boolean, default: false },
  lastLogin: { type: Date },
  credits: { type: Number, default: 0 },

  savedPosts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'SavedPost' }],

  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});


userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);

  next();
});

userSchema.methods.isPasswordCorrect = async function (password) {
  return await bcrypt.compare(password, this.password);
};

userSchema.methods.generateAccessToken = async function () {
  
  return jwt.sign(
    {
      _id: this._id,
      userName: this.userName,
      email: this.email,
      fullName: this.fullName,
    },
    process.env.ACCESS_TOKEN_SECRET_KEY,
    { expiresIn: process.env.ACCESS_TOKEN_TIME_DURATION }
  );
};

userSchema.methods.generateRefreshToken = async function () {
  return await jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET_KEY,
    { expiresIn: process.env.REFRESH_TOKEN_TIME_DURATION }
  );
};

export const User = mongoose.model("User", userSchema);
