import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"

const changeSubscription = async(data) => {
    const {channelId, userId} = data

    if (channelId.toString() === userId.toString()) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }
    
    const channel = await User.findById(channelId)
    if(!channel){
        throw new ApiError(404, "channel not found")
    }
    
    const session = mongoose.startSession()
    let isSubscribedNow
    try{
        session.startTransaction()
        const existingSubscription = await Subscription.findOne({
            subscriber: userId,
            channel: channelId
        }).session(session)

        if(existingSubscription){
            await existingSubscription.deleteOne()
        
            await User.findByIdAndUpdate(channelId,
                {$inc: {subscribersCount: - 1}}
            )
            isSubscribedNow = false
        
        }else{
            await Subscription.create({
                subscriber: userId,
                channel: channelId
            })
        
            await User.findByIdAndUpdate(channelId,
                {$inc: {subscribersCount: 1}}
            )
            isSubscribedNow = true  
        }

        session.commitTransaction()

    }catch(error){
        await session.abortTransaction()
        throw new ApiError(500, error?.message || "Subscription operation failed")
    }finally{
        session.endSession()
    }
    
    await invalidateCache(`c:${channel.username}`); 
    await invalidateCache(`stats:u:${channelId}`);
    await invalidateCache(`subscribers:u:${channelId}`);

    return isSubscribedNow
    
}

const fetchUserChannelSubscribers = async(data) => {
    const {channelId, userId, page, limit, skip} = data

    if(channelId.toString() !== userId.toString()){
        throw new ApiError(403, "You do not have access to get subscribers of this channel")
    }
    const user = await User.findById(channelId).select("subscribersCount")
    const totalSubscribers = user.subscribersCount || 0
    
    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(channelId)
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
    
    return {subscribers, totalSubscribers}

}

const fetchSubscribedChannels = async(data) => {
    const {userId, skip, limit} = data

     const channels = await Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(userId)
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
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

    return channels
}

export {
    changeSubscription,
    fetchUserChannelSubscribers,
    fetchSubscribedChannels,
}