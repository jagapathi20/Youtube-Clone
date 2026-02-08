import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid Channel ID");
    }

    if (channelId.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }

    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404, "channel not found")
    }

    const existingSubscription = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id)

        return res
        .status
        .json(new ApiResponse(200,
            {isSubscribed: false},
            "Unsubscribed successfully"
        ))
    }else{
        await Subscription.create({
            subscriber: userId,
            channel: channelId
        })

        return res
        .status(200)
        .json(new ApiResponse(200, 
            {isSubscribed: true},
            "Subscribed Successfully"
        ))
    }
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id");
    }

    if(channelId.toString() !== userId.toString()){
        throw new ApiError(403, "You do not have access to get subscribers of this channel")
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "subscriber",
                foreignField:"_id",
                as: "subscriberDetails",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {$unwind: "$subscriberDetails"}
    ])

    return res
    .status(200)
    .json( new ApiResponse(200, subscribers, "subscribers fetched successfully"))
})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const channels = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup:{
                from: "users",
                localField: "channel",
                foreignField:"_id",
                as: "channels",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            fullName: 1,
                            avatar: 1
                        }
                    }
                ]
            }
        },
        {$unwind: "$channels"}
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, channels, "channels fetched successfully"))
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}