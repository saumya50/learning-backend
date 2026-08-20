import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { User } from "../models/user.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// this is a method to generate access and refresh tokens
const generateAccessAndRefereshTokens = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken /* added refresh token in user object */

        await user.save({ validateBeforeSave: false }) /* since adding info in user requires validation(password) so to avoid it used this*/

        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating referesh and access token")
    }
}

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

const loginUser = asyncHandler(async (req, res) => {
    // req body -> data
    // username or email
    //find the user
    //password check

    //send cookie

    const { password, email, username } = req.body

    if (!username && !email) {
        throw new ApiError(400, "username or email is required")
    }

    const user = User.findOne({
        $or: [{ username }, { email }]
    })

    if (!user) {
        throw new ApiError(404, "user does not exist")
    }

    const isPassValid = await user.isPasswordCorrect(password)

    if (!isPassValid) {
        throw new ApiError(401, "invalid user credentials")
    }

    // generate and store accessToken and refreshToken
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(user._id)

    const loggedInUser = await User.findOne(user._id).select("-password -refreshToken")

    // sending cookies
    const options = {
        httpOnly: true,
        secure: true
    }

    return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(200, {
                user: loggedInUser, accessToken, refreshToken
            }, "user logged in")
        )

})

const logoutUser = asyncHandler(async (req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            /* set is an mongoDB operator which give functionality to update objects  */
            $set: {
                refreshToken: undefined
            }
        },
        {
            new:true
        }
    )
      const options = {
        httpOnly: true,
        secure: true
    }
    return res.status(200)
    .clearcookie("accessToken",options)
    .clearcookie("refreshToken",options)
    .json(new ApiResponse(200,{},"User logged out"))
})


export {
    registerUser,
    loginUser,
    logoutUser
}