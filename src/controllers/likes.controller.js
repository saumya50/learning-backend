import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asynHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id,
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        return res
            .status(200)
            .json(new ApiResponse(200, "Video unliked successfully", { isLiked: false }));
    } else {
        await Like.create({
            video: videoId,
            likedBy: req.user?._id,
        });
        return res
            .status(200)
            .json(new ApiResponse(200, "Video liked successfully", { isLiked: true }));
    }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const user = req.user?._id;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }


    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: user
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, "Comment unliked successfully", { isLiked: false }))
    }
    else {

        await Like.create({
            comment: commentId,
            likedBy: user
        })

        return res
            .status(200)
            .json(new ApiResponse(200, "Comment liked successfully", { isLiked: true }));

    }

});

const toggleTweetLike = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const user = req.user?._id;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID")
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: user
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id)
        return res.status(200).json(new ApiResponse(200, "tweet unliked successfully", { isLiked: false }))
    }
    else {
        await Like.create({
            tweet: tweetId,
            likedBy: user
        })

        return res
            .status(200)
            .json(new ApiResponse(200, "tweet liked successfully", { isLiked: true }));
    }

});

const getLikedVideos = asyncHandler(async (req, res) => {
    const user = req.user?._id;

    if (!user) {
        throw new ApiError(400, "Invalid user")
    }

    const likedvideos = await Like.aggregate([

        {
            $match: {
                likedBy: new mongoose.Types.ObjectId(user),
                video: { $exists: true }
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "video"
            }
        },
        {
            $unwind: "$video"
        },
        {
            $lookup: {
                from: "users",
                localField: "video.owner",
                foreignField: "_id",
                as: "owner"
            }
        },
        {
            $unwind: "$owner"
        },
        {
            $project: {
                _id:0,
                video:1,
                owner:1
            }
        }

    ]);

    return res
        .status(200)
        .json(new ApiResponse(200, "Liked videos fetched successfully", { likedvideos }));

});

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
};