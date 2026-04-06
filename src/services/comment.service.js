import mongoose from "mongoose"
import { Comment } from "../models/comment.model.js"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {invalidateCache} from "../utils/cacheInvalidator.js"

const fetchVideoComments = async(data) => {
    const { videoId, page = 1, limit = 10} = data

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID format");
    }

    const aggregateQuery = Comment.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
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
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                owner: {$first: "$owner"}
            }
        }
    ])

    const options = {
        page: parseInt(page),
        limit: parseInt(limit)
    }

    const comments = await Comment.aggregatePaginate(aggregateQuery, options)

    if (!comments?.docs?.length) {
        throw new ApiError(404, "No comments found for this video");
    }

    return comments
}



const createComment = async(data) => {
    const {videoId, content, userId} = data
    
    if (!content?.trim()){
        throw new ApiError(400, "Comment content is required")
    }

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid Video ID format")
    }

    const videoExists = await Video.findById(videoId).select("_id")
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: userId
    })

    const populatedComment = await comment.populate("owner", "username fullName avatar");

    if (!populatedComment) {
        throw new ApiError(500, "Comment created but failed to fetch details")
    }
    
    await invalidateCache(`comments:${videoId}`)
    return populatedComment
}



const updateComment = async (data) => {
    const {commentId, content, userId} = data

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

    
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have permission to edit this comment");
    }

    
    comment.content = content;
    const updatedComment = await comment.save({ validateBeforeSave: false });

    await invalidateCache(`comments:${comment.video}`)
    
    return updatedComment
        
};


const removeComment = async (data) => {
    const { commentId, userId } = data;

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid Comment ID format");
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(404, "Comment not found");
    }

  
    if (comment.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have permission to delete this comment");
    }

   
    await comment.deleteOne();
    await invalidateCache(`comments:${comment.video}`)

    return { success: true, commentId }
};

export {
    fetchVideoComments,
    createComment,
    updateComment,
    removeComment
}