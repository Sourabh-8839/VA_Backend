import { Router } from "express";
import {
  accessRefreshToken,
  changeCurrentPassword,
  completeProfile,
  getCurrentUser,
  getMyHistory,
  getUserChannelProfile,
  logOutUser,
  loginUser,
  registerUser,
  savedPosts,
  updateAccountDetails,
  updateAvatar,
  updateCoverImage,
} from "../Controllers/user.controller.js";
import { upload } from "../Middlewares/multer.middleware.js";
import { jwtVerify } from "../Middlewares/auth.middleware.js";

const router = Router();

router.route("/registerUser").post(
  registerUser
);

router.route("/login").post(loginUser);

router.route("/logout").post(jwtVerify, logOutUser);

router.route("/refreshToken").post(accessRefreshToken);

router.route("/change-password").patch(jwtVerify, changeCurrentPassword);

router.route("/current-user").get(jwtVerify, getCurrentUser);

router.route("/update-details").patch(jwtVerify, updateAccountDetails);

router.route("/save-post").post(jwtVerify,savedPosts);

router.route("/complete-profile").post(jwtVerify,completeProfile)

router
  .route("/update-avatar")
  .patch(jwtVerify, upload.single("avatar"), updateAvatar);

router
  .route("/update-coverImage")
  .patch(jwtVerify, upload.single("coverImage"), updateCoverImage);

router.route("/channel/:userName").get(jwtVerify, getUserChannelProfile);

router.route("/history").get(jwtVerify, getMyHistory);
export default router;
