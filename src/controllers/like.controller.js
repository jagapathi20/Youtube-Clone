import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { fetchLikedVideos, updateCommentLike, updateVideoLike } from "../services/like.service.js"

const toggleVideoLike = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const userId = req.user?._id

    if (!userId) throw new ApiError(401, "Unauthorized")

    const data = {videoId, userId}

    const result = await updateVideoLike(data)

    return res
        .status(200)
        .json(new ApiResponse(
            200, 
            result
        ));
})

const toggleCommentLike = asyncHandler(async(req, res) => {
    const {commentId} = req.params
    const userId = req.user?._id

    if (!userId) throw new ApiError(401, "Unauthorized")

    const data = {commentId, userId}

    const result = await updateCommentLike(data)
    
    return res
        .status(200)
        .json(new ApiResponse(200, result))
   
    
})

const toggleTweetLike = asyncHandler(async(req, res) => {
    const {tweetId} = req.params
    const userId = req.user._id

    if (!userId) throw new ApiError(401, "Unauthorized")

    const data = {tweetId, userId}

    const result = await updateTweetLike(data)
    
    return res
        .status(200)
        .json(new ApiResponse(200, result))

})

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id

    if (!userId) throw new ApiError(401, "Unauthorized")

    const data = {userId}

    const result = await fetchLikedVideos(data)
    

    return res
    .status(200)
    .json(new ApiResponse(200, result, "Liked videos fetched successfully"))

})

export {
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getLikedVideos
}