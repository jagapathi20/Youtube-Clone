import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import { Video } from "../models/video.model.js"
import { Comment } from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(videoId)){
        throw new ApiError(400, "Invalid video Id format")
    }

    const video = await Video.findById(videoId);
    if (!video) {
            throw new ApiError(404, "Video not found");
    }
    
    const existingLike = await Like.findOne({
        video: video,
        likedBy: userId
    })

    if(existingLike){
        await Like.findByIdAndDelete(existingLike._id)

        return res
        .status(200)
        .json(new ApiResponse(200,
            {isLiked: false},
            "Unliked successfully"
        ))
    }else{
        await Like.create({
            video: videoId,
            likedBy: userId
        })

        return res
        .status(200)
        .json(new ApiResponse(200,
            {isLiked: true},
            "Liked successfully"
        ))
    }

})

const toggleCommentLike = asyncHandler(async(req, res) => {
    const {commentId} = req.params
    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(commentId)){
        throw new ApiError(400, "Invalid comment Id format")
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
            throw new ApiError(404, "comment not found");
    }
    
    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: userId
    })

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Unliked successfully"));
    } else {
        await Like.create({
            comment: commentId,
            likedBy: userId
        });

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: true }, "Liked successfully"));
    }
    
})

const toggleTweetLike = asyncHandler(async(req, res) => {
    const {tweetId} = req.params
    const userId = req.user._id

    if(!mongoose.Types.ObjectId.isValid(tweetId)){
        throw new ApiError(400, "Invalid tweet Id format")
    }

    const tweetExists = await Tweet.findById(tweetId);
    if (!tweetExists) {
            throw new ApiError(404, "tweet not found");
    }
    
    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    });

    if (existingLike) {
        await Like.findByIdAndDelete(existingLike._id);
        
        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: false }, "Unliked successfully"));
    } else {
        await Like.create({
            tweet: tweetId,
            likedBy: userId
        });

        return res
            .status(200)
            .json(new ApiResponse(200, { isLiked: true }, "Liked successfully"));
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const likedVideos = await Like.aggregate([
        {
            $match:{
                likedBy: new mongoose.Types.ObjectId(userId),
                video: { $exists: true, $ne: null}
            }
        },
        {
            $lookup:{
                from: "vidoes",
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
                            owner: {$first: "ownerDetails"}
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

    return res
    .status(200)
    .json(new ApiResponse(200, likedVideos, "Liked videos fetched successfully"))

})

export {
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getLikedVideos
}