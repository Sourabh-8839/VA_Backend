
import { User } from "../models/user.model.js";
import { ApiError } from "../Utilis/apiError.js";
import asyncHandler from "../Utilis/asyncHyndler.js";
import jwt from "jsonwebtoken";

export const jwtVerify = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      throw new ApiError(401, "Unauthorized request");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRETKEY);

    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken"
    );

    if (!user) {
      throw new ApiError(401, "Invalid Access Token");
    }
    req.user = user;

    next();
  } catch (error) {
    throw new ApiError(400, error?.message || "Invalid Access Token");
  }
});
