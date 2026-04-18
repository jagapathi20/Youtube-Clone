import { isValidObjectId } from "mongoose"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {
    makeTweet,
    fetchUserTweets,
    changeTweet,
    removeTweet,
} from "../services/tweet.service.js"

const createTweet = asyncHandler(async (req, res) => {

    const userId = req.user._id
    const {content} = req.body

    if(!content?.trim() === ""){
        throw new ApiError(400, "Content is required")
    }
    const data = {userId, content}

    const tweet = await makeTweet(data)
   
    return res
    .status(201)
    .json(new ApiResponse(201, tweet, "tweet created successfully"))
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.user._id

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit
    
    const data = {userId, page, limit, skip}

    const {tweets, totalTweets, totalPages} = await fetchUserTweets(data)

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
        throw new ApiError(400, "Invalid tweetID")
    }

    if(!content?.trim() === ""){
        throw new ApiError(400, "Content is required")
    }

    const data = {userId, tweetId, content}
    const updatedTweet = await changeTweet(data)

    return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "tweet updated successfully"))
})


const deleteTweet = asyncHandler(async (req, res) => {
    const userId = req.user._id
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)){
        throw new ApiError(400, "Invalid tweetID")
    }

    const data = {userId, tweetId}

    await removeTweet(data)

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