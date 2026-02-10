import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID format");
    }

    const aggregate = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            username: {
                                username: 1,
                                fullName: 1,
                                avatar: 1
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {$first: "owner"}
            }
        }
    ])

    const options = {
        page: page,
        limit: limit
    }

    const comments = await Comment.aggregatePaginate(aggregate, options)

    if(!comments){
        throw new ApiError(404, "No comments found for this video")
    }

    if (!comments || comments.docs.length === 0) {
        throw new ApiError(404, "No comments found for this video");
    }

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments featched successfully"))
})



const addComment = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    const userId = req.user._id
    
    if (!content?.trim()){
        throw new ApiError(400, "Comment content is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID format")
    }

    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })

    const populatedComment = await Comment.findById(comment._id)
    .populate("owner", "username fullName avatar");

    if (!populatedComment) {
        throw new ApiError(500, "Comment created but failed to fetch details")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, populatedComment, "Comment added Successfully"))
})

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;

    if (!content?.trim()) {
        throw new ApiError(400, "Content is required to update comment");
    }

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment ID format");
    }

    
    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

    
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to edit this comment");
    }

    
    comment.content = content;
    const updatedComment = await comment.save({ validateBeforeSave: false });

    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});


const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment ID format");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

  
    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "You do not have permission to delete this comment");
    }

   
    await Comment.findByIdAndDelete(commentId);

    return res
        .status(200)
        .json(new ApiResponse(200, { commentId }, "Comment deleted successfully"));
});

export {
    getVideoComments,
    addComment,
    updateComment,
    deleteComment
}