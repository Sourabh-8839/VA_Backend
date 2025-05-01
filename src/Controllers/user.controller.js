import asyncHandler from "../Utilis/asyncHyndler.js";
import { ApiError } from "../Utilis/apiError.js";
import { ApiResponse } from "../Utilis/apiResponse.js";
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import {SavedPost} from "../Models/savedpost.model.js"
let options = {
  httpOnly: true,
  secure: true,
};

const genreateRefreshTokenAndaccessToken = async (user_id) => {
  try {
    
    const user = await User.findById(user_id);    

    const accessToken = await user.generateAccessToken();

    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;

    
    

    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while genrating refresh and access Token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //step 1 Extract data from req
  //step 2 check validation empty string
  //step 3 user is already exist
  //step 3 check file validation
  //step 4 upload file in cloud and store response
  //step 5 create user object
  //step 6 send response to user

  const {  email, fullName, password } = req.body;
  
  if (
    [ email, fullName, password].some((field) => field?.trim === "")
  ) {
    throw new ApiError(200, "All fields Required");
  
  }

  if (!email.includes("@gmail"))
    throw new ApiError(400, "email must required @gmail");

  const existedEmail = await User.findOne({ email: email });

  if (existedEmail) {
    throw new ApiError(409, "Email is already Existed");
  }

  const user = await User.create({
    fullName,
    email,
    password,
  });

  const createdUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something Went Wrong While registring User");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, createdUser, "User registered Succesfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password, username } = req.body;

  if (!email && !username) {
    throw new ApiError(401, "email or username is required");
  }

  

  const user = await User.findOne({
    $or: [{ email }],
  });


  

  if (!user) {
    throw new ApiError(404, "user does not exist");
  }
  const isValidPassword = await user.isPasswordCorrect(password);

  console.log(isValidPassword);
  
  if (!isValidPassword) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { accessToken, refreshToken } =await genreateRefreshTokenAndaccessToken(user._id);

  const updatedUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const today = new Date().setHours(0, 0, 0, 0); // Start of today
    if (!user.lastLogin || new Date(user.lastLogin).setHours(0, 0, 0, 0) !== today) {
      user.credits += 10; // Reward 10 points for daily login
    }
    user.lastLogin = new Date();
    await user.save();


  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: updatedUser,
          accessToken,
          refreshToken,
        },
        "User login succesfully "
      )
    );
});


const completeProfile = asyncHandler(async(req,res)=>{

  const user = await User.findById(req.user.id);
  
  if (!user.profileCompleted) {
    user.profileCompleted = true;
    user.credits += 50; // Reward 50 points for completing the profile
    await user.save();
  }

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      {
        user:user,
      },
      "Profile Completed"
    )
  );
})

const savedPosts = asyncHandler(async(req,res)=>{
  const { source, postId, postData } = req.body;
  const savedPost = new SavedPost({
    user: req.user.id,
    source,
    postId,
    postData,
  });
  await savedPost.save();

  // Add credits to the user
  const user = await User.findById(req.user.id);
  user.savedPosts.push(savedPost._id);
  user.credits += 5; // Reward 5 points for saving a post
  await user.save();

  return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      "User login succesfully "
    )
  );
})

const reportPost =asyncHandler(async(req,res)=>{

  const { source, postId, reason } = req.body;
  const report = new Report({
    user: req.user.id,
    source,
    postId,
    reason,
  });
  await report.save();

  // Add credits to the user
  const user = await User.findById(req.user.id);
  user.credits += 10; // Reward 10 points for reporting a post
  await user.save();


 return res
  .status(200)
  .json(
    new ApiResponse(
      200,
      "Report submitted"
    )
  );
  
})
const logOutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: { refreshToken: "" },
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(201, {}, "User Logut Successfully"));
});

const accessRefreshToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body?.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Unauthorized user");
  }

  try {
    const decode = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRETKEY
    );

    const user = await User.findById(decode?._id);

    if (!user) {
      throw new ApiError(401, "Invalid refreshToken");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(400, "RefreshToken is expired or used");
    }

    const { accessToken, refreshToken } =
      await genreateRefreshTokenAndaccessToken(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(400, "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;

  if (newPassword !== confirmPassword) {
    throw new ApiError(400, "Password must be same");
  }

  const user = await User.findById(req.user?._id);

  const isPassword = user.isPasswordCorrect(oldPassword);

  if (!isPassword) {
    throw new ApiError(400, "Invalid Old Password");
  }

  user.password = newPassword;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "password Change Succesfully"));
});

// 
const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;

  if (!fullName && !email) {
    throw new ApiError(400, "All Fields required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName: fullName,
        email: email,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account Detail update Succesfully"));
});

const updateAvatar = asyncHandler(async (req, res) => {
  const avatarLocalFilePath = req.file?.path;

  if (!avatarLocalFilePath) {
    throw new ApiError(400, "Avatar file is missing");
  }

  const avatar = await uploadOnCloudinary(avatarLocalFilePath);

  if (!avatar.url) {
    throw new ApiError(500, "Error while uploading on avatar file");
  }
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        avatar: avatar?.url,
      },
    },
    { new: true }
  ).select("-password");

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Update avatar succesfully "));
});

const getMyHistory = asyncHandler(async (req, res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: mongoose.Schema.Types.ObjectId(req.user?._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
          {
            $project: {
              fullName: 1,
              username: 1,
              avatar: 1,
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        user[0].watchHistory,
        "watch History fetched successfully"
      )
    );
});



export {
  registerUser,
  loginUser,
  logOutUser,
  accessRefreshToken,
  changeCurrentPassword,
  updateAccountDetails,
  updateAvatar,
  getMyHistory,
  completeProfile,
  savedPosts
};
