import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import { User } from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"

const fetchChannelStats = async(data) => {
    const {userId} = data
     const totalSubscribers = await User.findById(userId).select("subscribersCount")
        
        const stats = await Video.aggregate([
            {
                $match: { owner: userId}
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
    
        return channelStats
}

const fetchChannelVideos = async(data) => {
    const {userId, page, limit, skip} = data

    const [videos, totalVideos] = await Promise.all([
    Video.find({owner: userId})
        .sort("-createdAt")
        .skip(skip)
        .limit(limit),
    Video.countDocuments({owner: userId})
    ])

    const totalPages = Math.ceil(totalVideos / limit)

    return {videos, totalVideos, totalPages}

}

export {
    fetchChannelStats,
    fetchChannelVideos,
}