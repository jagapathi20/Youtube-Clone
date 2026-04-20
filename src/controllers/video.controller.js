import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {
    fetchAllVideos,
    fetchVideoById,
    uploadAVideo,
    changeVideo,
    removeVideo,
    changePublishStatus,
} from "../services/video.service.js"
import { isValidObjectId } from "mongoose"

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query

    if (userId && !isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id")
    }
    
    const data = {page, limit, query, sortBy, sortType, userId} 

    const videoList = await fetchAllVideos(data)

    if(videoList?.docs.length === 0){
        return res
        .status(200)
        .json(new ApiResponse(200, [], "No vidoes found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videoList, "videos fetched successfully"))
})


const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    
    if ([title, description].some(field => !field?.trim())) {
        cleanupLocalFiles(req.files?.videoFile?.[0]?.path)
        cleanupLocalFiles(req.files?.thumbnail?.[0]?.path)
        throw new ApiError(400, "Title and description are required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if (!videoLocalPath) {
        if (thumbnailLocalPath) cleanupLocalFiles(thumbnailLocalPath)
        throw new ApiError(400, "Video file is required")
    }

    if (!thumbnailLocalPath) {
        cleanupLocalFiles(videoLocalPath)
        throw new ApiError(400, "Thumbnail is required")
    }

    const userId = req.user._id

    const data = {title, description, videoLocalPath, thumbnailLocalPath, userId}

    const createdVideo = await uploadAVideo(data)

    return res
    .status(201)
    .json(new ApiResponse(201, createdVideo, "video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const data = {videoId}

    const video = await fetchVideoById(data)

    return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched successfully"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body
    const userId = req.user._id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    if(!title?.trim() && !description?.trim()){
        throw new ApiError(400, "Atleast one of the Title and description is required")
    }
    const thumbnailLocalPath = req.file?.path

    const data = {videoId, title, description, thumbnailLocalPath} = data

    const updatedVideo = await changeVideo(data)

    return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "video details updated"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const data = {videoId, userId}
    await removeVideo(data)

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "video deleted successfully"))
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid video Id")
    }

    const data = {videoId, userId}

    const isPublished = await changePublishStatus(data)
    
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {isPublished},
            "video publish status toggled successfully"
        )
    )
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}