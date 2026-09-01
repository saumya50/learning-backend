import { asyncHandler } from "../utils/asynHandler.js";
import { ApiError } from "../utils/APIerror.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { Comment } from "../models/comment.js";
import mongoose from "mongoose";

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const comments = await Comment.find({
        video: videoId,
    })
        .populate("owner", "username fullName avatar")
        .sort({ createdAt: -1 });

    return res
        .status(200)
        .json(new ApiResponse(200, comments, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const user = req.user?._id;
    const { content } = req.body;

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: user,
    });

    if (!comment) {
        throw new ApiError(500, "Failed to add comment, please try again");
    }
    return res
        .status(201)
        .json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    // 1. Validation: check if commentId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    // 2. Validation: check if new content is provided
    if (!content?.trim()) {
        throw new ApiError(400, "Comment content is required");
    }

    // 3. Find the comment in the database
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    // 4. Authorization check: only the comment owner can edit it
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this comment");
    }

    // 5. Update the comment content
    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {
                content,
            },
        },
        { new: true } // Returns the updated document
    );

    // 6. Return response
    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});

export { getVideoComments, addComment, updateComment };