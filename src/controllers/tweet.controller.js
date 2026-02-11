import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
   const userId = req.user._id
   const {content} = req.body

   if(!content || content.trim() === ""){
    throw new ApiError(400, "Content is required")
   }

   const tweet = await Tweet.create({
    content: content,
    owner: userId
    })

    await invalidateCache(`tweets:u:${userId}`)

    return res
    .status(201)
    .json(new ApiResponse(201, tweet, "tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    
   const [tweets, totalTweets] = await Promise.all([
    Tweet.find({owner: userId})
        .sort("-createdAt")
        .skip(skip)
        .limit(limit),
    Tweet.countDocuments({owner: userId})
   ])

   const totalPages = Math.ceil(totalTweets / limit)

    return res
    .status(200)
    .json(new ApiResponse(200,
        {
            tweets, 
            pagination:{
                totalTweets,
                totalPages,
                currentPage: page,
                hasNextPage: page < totalPages,
                hasPrevPage: page > 1
            }
        }, 
        "Tweets fetched Successfully"))
})

const updateTweet = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const {tweetId} = req.params
    const {content} = req.body

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid twwetID")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    if(userId.toString() !== tweet.owner.toString()){
        throw new ApiError(403, "You are not authorized to update this tweet")
    }

    tweet.content = content
    await Tweet.save({validateBeforeSave: false})

    await invalidateCache(`tweets:u:${userId}`)

    return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet updated successfully"))
})

const deleteTweet = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid twwetID")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(404, "Tweet not found")
    }

    if(userId.toString() !== tweet.owner.toString()){
        throw new ApiError(403, "You are not Authorized to delete this tweet")
    }

    await Tweet.findByIdAndDelete(tweet._id)

    await invalidateCache(`tweets:u:${userId}`)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "tweet deleted successfully"))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}