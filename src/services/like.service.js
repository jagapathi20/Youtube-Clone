import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { invalidateCache } from "../utils/cacheInvalidator.js"

const updateVideoLike = async(data) => {
    const {videoId, userId} = data

    if(!isValidObjectId(videoId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Id format")
    }

    const video = await Video.findById(videoId).select(owner)
    if (!video) {
        throw new ApiError(404, "Video not found");
    }
    
    const deletedLike = await Like.findOneAndDelete({
        video: videoId,
        likedBy: userId
    })

    const isLikedNow = !deletedLike

    if(isLikedNow){
        await Like.create({
            video: videoId,
            likedBy: userId
        })
    }

    await invalidateCache(`stats:u:${video.owner}`)

    const response_message = {
        isLikedNow: isLikedNow,
        message: isLikedNow? "Liked successfully" : "Unliked successfully",
    }

    return response_message
}

const updateCommentLike = async(data) => {
    const {commentId, userId} = data

    if(!isValidObjectId(commentId) || !isValidObjectId(userId)){
        throw new ApiError(400, "Invalid Id format")
    }

    const comment = await Comment.exists({_id: commentId});
    if (!comment) {
        throw new ApiError(404, "comment not found");
    }
    
    const deletedLike = await Like.findOneAndDelete({
        comment: commentId,
        likedBy: userId
    })

    const isLikedNow  = !deletedLike
    if (isLikedNow){
        await Like.create({
            comment: commentId,
            likedBy: userId
        })
    }

    const response_message = {
        isLikedNow: isLikedNow,
        message: isLikedNow ? "Liked successfully" : "Unliked successfully",
    }
    
    return response_message
}

const updateTweetLike = async(data) => {
    const {tweetId, userId} = data
    

    if(!isValidObjectId(tweetId) || !isValidObjectId(userId)){
        throw new ApiError(400, "Invalid Id format")
    }

    const tweetExists = await Tweet.exists({_id: tweetId});

    if (!tweetExists) {
        throw new ApiError(404, "tweet not found");
    }
    
    const deletedLike = await Like.findOneAndDelete({
        tweet: tweetId,
        likedBy: userId
    })

    const isLikedNow = !deletedLike
    if (isLikedNow) {
        await Like.create({
            tweet: tweetId,
            likedBy: userId
        })
    }

    const response_message = {
        isLikedNow: isLikedNow,
        message: isLikedNow ? "Liked successfully" : "Unliked successfully",
    }
    
    return response_message

}

const fetchLikedVideos = async (data) => {
    const {userId} = data

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid Id format")
    }

    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true, $ne: null}
            }
        },
        {
            $lookup:{
                from: "vidos",
                localField: "video",
                foreignField: "_id",
                as: "videoDetails",
                pipeline:[
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "ownerDetails",
                            pipeline:[
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
                            owner: {$first: "$ownerDetails"}
                        }
                    }
                ]
            }
        },
        {
            $unwind:"$videoDetails"
        },
        {
            $replaceRoot: {newRoot: "$videoDetails"}
        }
    ])

   return likedVideos

}

export {
    updateCommentLike,
    updateVideoLike,
    updateTweetLike,
    fetchLikedVideos
}