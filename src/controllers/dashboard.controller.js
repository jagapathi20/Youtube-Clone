import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"

const getChannelStats = asyncHandler(async (req, res) => {
    // total video views,total videos, total subscribers, total likes etc.
    const userId = req.user._id
    const totalSubscribers = await User.findById(userId).select("subscriberCount")
    
    const stats = await Video.aggregate([
        {
            $match: { owner: new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup:{
                from:"likes",
                localField:"_id",
                foreignField:"video",
                as:"likes"
            }
        },
        {
            $group:{
                _id: null,
                totalViews: {$sum: "$views"},
                totalVideos: {$sum: 1},
                totalLikes: {$sum: {$size: "$likes"}}
            }
        }
    ])

    const channelStats = {
        totalSubscribers: totalSubscribers || 0,
        totalViews: stats[0]?.totalViews || 0,
        totalVideos: stats[0]?.totalVideos || 0,
        totalLikes: stats[0]?.totalLikes || 0

    }

    return res
    .status(200)
    .json(new ApiResponse(200, channelStats, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    // TODO: Get all the videos uploaded by the channel
    const userId = req.user._id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const [videos, totalVideos] = await Promise.all([
    Video.find({owner: userId})
        .sort("-createdAt")
        .skip(skip)
        .limit(limit),
    Video.countDocuments({owner: userId})
    ])

    const totalPages = Math.ceil(totalVideos / limit)

    return res
    .status(200)
    .json(new ApiResponse(200,
        {
            videos,
            pagination:{
                totalVideos,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPages: page > 1
            }
        },
        "Videos fetched Successfully"
    ))
})

export {
    getChannelStats, 
    getChannelVideos
    }