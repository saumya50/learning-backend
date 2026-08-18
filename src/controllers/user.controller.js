import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const registerUser = asyncHandler(async (req, res) => {
  

    const fullname = req.body?.fullname || req.body?.fullName;
    const email = req.body?.email;
    const username = req.body?.username;
    const password = req.body?.password;

    console.log("Extracted fields:", { fullname, email, username, password });

    // Validation 1: Check text fields
    if (!fullname || !email || !username || !password || 
        fullname.trim() === "" || email.trim() === "" || username.trim() === "" || password.trim() === "") {
        console.log("❌ FAILED VALIDATION: One or more text fields are missing/empty");
        throw new ApiError(400, "All fields (fullname, email, username, password) are required");
    }

    // Check user existence
    const existedUser = await User.findOne({
        $or: [{ username }, { email }],
    });

    if (existedUser) {
        console.log("❌ FAILED VALIDATION: User already exists in DB");
        throw new ApiError(409, "User with email or username already exists");
    }

    // Validation 2: Check avatar file
    const avatarLocalPath = req.files?.avatar?.[0]?.path;
    const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

    console.log("avatarLocalPath:", avatarLocalPath);
    console.log("coverImageLocalPath:", coverImageLocalPath);

    if (!avatarLocalPath) {
        console.log("❌ FAILED VALIDATION: Avatar file is missing from req.files");
        throw new ApiError(400, "Avatar file is required");
    }

    // Upload to Cloudinary
    console.log("Uploading avatar to Cloudinary...");
    const avatar = await uploadOnCloudinary(avatarLocalPath);
    let coverImage = null;

    if (coverImageLocalPath) {
        console.log("Uploading cover image to Cloudinary...");
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    if (!avatar) {
        console.log("❌ FAILED VALIDATION: Cloudinary avatar upload returned null");
        throw new ApiError(400, "Avatar file upload failed on Cloudinary");
    }

    console.log("Avatar uploaded successfully:", avatar.url);

    // Create User in DB
    const user = await User.create({
        fullname,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase(),
    });

    const createdUser = await User.findById(user._id).select("-password -refreshToken");

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while creating user");
    }

    console.log("✅ USER REGISTERED SUCCESSFULLY!");

    return res.status(201).json(new ApiResponse(200, createdUser, "User registered successfully"));
});

export { registerUser };