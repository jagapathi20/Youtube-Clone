import {Tweet} from "../models/tweet.model.js"

const makeTweet = async(data) => {
    const {userId, content} = data
    const tweet = await Tweet.create({
        content,
        owner: userId
    })

    await invalidateCache(`tweets:u:${userId}`)

    return tweet
}

const fetchUserTweets = async(data) => {
    const {userId, page, limit, skip} = data

    const [tweets, totalTweets] = await Promise.all([
    Tweet.find({owner: userId})
        .sort("-createdAt")
        .skip(skip)
        .limit(limit),
    Tweet.countDocuments({owner: userId})
   ])

   const totalPages = Math.ceil(totalTweets / limit)

   return {tweets, totalTweets, totalPages}
}

const changeTweet = async(data) => {
    const {userId, tweetId, content} = data
    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    if(userId.toString() !== tweet.owner.toString()){
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        { $set: { content } },
        { new: true }
    )

    await invalidateCache(`tweets:u:${userId}`)

    return updatedTweet
    
}

const removeTweet = async(data) => {
    const {userId, tweetId} = data

    const tweet = await Tweet.findById(tweetId)
    
    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }
    
    if(userId.toString() !== tweet.owner.toString()){
        throw new ApiError(403, "You are not Authorized to delete this tweet")
    }
    
    await tweet.deleteOne() 
    
    await invalidateCache(`tweets:u:${userId}`)

    
}

export {
    makeTweet,
    fetchUserTweets,
    changeTweet,
    removeTweet,
}