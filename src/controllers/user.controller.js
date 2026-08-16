import { asyncHandler } from "../utils/asynHandler.js";
import {ApiError} from "../utils/APIerror.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import {User} from "../models/user.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"

const registerUser = asyncHandler(async (req, res) => {

    
     // get user details from frontend
    const { fullname, email, username, password } = req.body;
    console.log("fullname:", fullname);
    console.log("email:", email); 


    // validation - not empty
    if(
        [fullname, email, username, password].some((field)=>field?.trim()==="")
    ){
         throw new ApiError(400,"all fields are required")
    }

     // check if user already exists: username, email
    const existedUser=User.findOne({
        $or:[{username} , {email}]
    })
    if(existedUser){
         throw new ApiError(409,"already exists")
    }


     // check for images, check for avatar
    const avatarLocalPath=req.files?.avatar[0]?.path 
    const coverImageLocalPath=req.files?.coverImage[0]?.path 
    
    if(!avatarLocalPath) throw new ApiError(400,"avatar file is required")


    // upload them to cloudinary, avatar
    const avatar=await uploadOnCloudinary(avatarLocalPath)
    const coverImage=await uploadOnCloudinary(coverImageLocalPath)

    if(!avatar) throw new ApiError(400,"avatar file is required")


    // create user object - create entry in db
    const user=await User.create({
        fullname,
        avatar:avatar.url,
        coverImage:coverImage?.url || "",
        email,
        password,
        username:username.toLowerCase()
    })


      // remove password and refresh token field from response
     const createdUser=await User.findById(user._id).select(
        "-password -refreshToken"
     )

       
       // check for user creation
       if(!createdUser) throw new ApiError(500,"something went wrong while creating user")

        // return res
        return res.status(201).json(
            new ApiResponse(200,createdUser,"user register success")
        )

})

export { registerUser }; 