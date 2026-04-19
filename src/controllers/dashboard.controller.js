import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { 
    fetchChannelStats, 
    fetchChannelVideos 
} from "../services/dashboard.service.js"

const getChannelStats = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const data = {userId}

    const channelStats = await fetchChannelStats(data)

    return res
    .status(200)
    .json(new ApiResponse(200, channelStats, "Channel stats fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const data = {userId, page, limit, skip}

    const {videos, totalVideos, totalPages} = await fetchChannelVideos(data)

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
                hasPrevPage: page > 1
            }
        },
        "Videos fetched Successfully"
    ))
})

export {
    getChannelStats, 
    getChannelVideos
    }