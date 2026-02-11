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

    let isSubscribedNow

    if(existingSubscription){
        await Subscription.findByIdAndDelete(existingSubscription._id)

        await User.findByIdAndUpdate(channelId,
            {$inc: {subscribersCount: - 1}}
        )

    
    }else{
        await Subscription.create({
            subscriber: userId,
            channel: channelId
        })

        await User.findByIdAndUpdate(channelId,
            {$inc: {subscribersCount: 1}}
        )
        
    }

    await invalidateCache(`c:${channel.username}`); 
    await invalidateCache(`stats:u:${channelId}`);
    await invalidateCache(`subscribers:u:${channelId}`);

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            { isSubscribed: isSubscribedNow }, 
            isSubscribedNow ? "Subscribed successfully" : "Unsubscribed successfully"
        ));
})


const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user._id

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel Id");
    }

    if(channelId.toString() !== userId.toString()){
        throw new ApiError(403, "You do not have access to get subscribers of this channel")
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const user = await User.findById(channelId).select("subscribersCount")
    const totalSubscribers = user.subscriberCount || 0

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort: {createdAt: - 1}
        },
        {
            $skip: skip
        },
        {
            $limit: limit
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
    .json( new ApiResponse(
        200, 
        {
            subscribers,
            pagnation:{
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