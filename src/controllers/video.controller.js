import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query
    
    const pipeline = []

    if(query){
        pipeline.push({
            $match: {
                $or: [
                    {title: {$regex: query, $options: "i"}},
                    {description: {$regrez: query, $options: "i"}}
                ]
            }
        })
    }

    if(userId){
        if(!isValidObjectId(userId)){
            throw new ApiError(400, "Invalid user id")
        }

        pipeline.push({
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        })
    }

    pipeline.push({$match: {isPublished: true}})

    if(sortBy && sortType){
        pipeline.push({
            $sort: {
                [sortBy]: sortType === "asc" ? 1 : - 1
            }
        })
    }else{
        pipeline.push({$sort: {createdAt: - 1}})
    }

    pipeline.push(
        {
            $lookup:{
                from:"users",
                localField:"owner",
                foreignField:"_id",
                as: "ownerDetails",
                pipeline:[
                    {
                        $project:{
                            username: 1,
                            avatar: 1,
                            fullName: 1
                        }
                    }
                ]
            }
        },
        {$unwind: "$ownerDetails"}
    )

    const videoAggreagate = Video.aggregate(pipeline)

    const options = {
        page: parseInt(page, 1),
        limit: parseInt(limit, 10)
    }

    const videoList = await Video.aggregatePaginate(videoAggreagate, options)

    if(!videoList || videoList.docs.length === 0){
        return res
        .status(200)
        .json(new ApiResponse(200, [], "No videoes found"))
    }

    return res
    .status(200)
    .json(new ApiResponse(200, videoList, "videos fetched successfully"))
})

const publishAVideo = asyncHandler(async (req, res) => {
    const { title, description} = req.body
    
    if([title, description].some((field) => field?.trim() === "")){
        throw new ApiError(400, "Title and description are required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path
    const thumbnailLocalPath = req.files?.thumbnail[0]?.path

    if(!videoLocalPath){
        throw new ApiError(400, "Video file is required")
    }

    if(!thumbnailLocalPath){
        throw new ApiError(400, "Thumbnail is required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath, "video")
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile){
        throw new ApiError(400, "video upload failed")
    }

    if(!thumbnail){
        throw new ApiError(400, "thumbnail upload failed")
    }

    const video = await Video.create({
        title,
        description,
        duration: videoFile.duration,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        owner: req.user._id,
        isPublished: true
    })

    if(!video){
        throw new ApiError(500, "something went wrong while publishing")
    }

    return res
    .status(201)
    .json(new ApiResponse(201, createdVideo, "video published successfully"))
})

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    
    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id")
    }

    const video = await Video.findByIdAndUpdate(
        videoId,
        {
            $inc:{views: 1}
        },
        {new: true}
    ).populate("owner", "username, avatar fullName")

    if(!video){
        throw new ApiError(404, "vieo not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, video, "video fetched and view count updated"))
})

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const {title, description} = req.body

    if(isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video ID")
    }

    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400, "Title and description are required")
    }

    const oldvideo = await Video.findById(videoId)

    if(!oldvideo){
        throw new ApiError(404, "video not found")
    }

    const updatedData = {
        title,
        description
    }
    const thumbnailLocalPath = req.file?.path

    let thumbnail
    if(thumbnailLocalPath){
        const newthumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if(!newthumbnail.url){
            throw new ApiError(400, "error while uploading thumbnail")
        }

        const oldThumbnail = oldvideo.thumbnail.split("/").pop().split(".")[0]
        await deleteFromCloudinary(oldThumbnail)
        updatedData.thumbnail = newthumbnail.url
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {$set: updatedData},
        {new: true}
    )

    return res
    .status(200)
    .json(new ApiResponse(200, updateVideo, "video details updated"))
})

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params
    const userId = req.user._id

    if(!isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid videoId")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have permission to perform this action");
    }

    const videoPublicId = video.videoFile.split("/").pop().spli(".")[0]
    const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0]

    await deleteFromCloudinary(videoPublicId)
    await deleteFromCloudinary(thumbnailPublicId)

    await Video.findByIdAndDelete(videoId)

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

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have permission to perform this action");
    }

    video.isPublished = !video.isPublished

    await video.save({vallidateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            {isPublished: video.isPublished},
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