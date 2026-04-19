import mongoose, {isValidObjectId} from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {
    changeSubscription,
    fetchUserChannelSubscribers,
    fetchSubscribedChannels,
} from "../services/subscription.service.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    const data = {channelId, userId}

    const isSubscribedNow = await changeSubscription(data)

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            { isSubscribedNow }, 
            isSubscribedNow ? "Subscribed successfully" : "Unsubscribed successfully"
        ));
})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id");
    }

    const data = {channelId, userId, page, limit, skip} 

    const {subscribers, totalSubscribers} = await fetchUserChannelSubscribers(data)

    return res
    .status(200)
    .json( new ApiResponse(
        200, 
        {
            subscribers,
            pagination:{
                totalSubscribers,
                totalPages: Math.ceil(totalSubscribers / limit),
                currentPage: page,
                limit
            }
        },
        "subscribers fetched successfully"))
})


const getSubscribedChannels = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const data = {userId, skip, limit}

    const channels = await fetchSubscribedChannels(data)

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                channels,
                pagination: {
                    currentPage: page,
                    limit,
                    hasNextPage: channels.length === limit
                }
            },
            "Channels fetched successfully"
        ))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}