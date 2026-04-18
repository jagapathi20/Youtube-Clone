import {Video} from "../models/video.model.js"
import mongoose, {isValidObjectId} from "mongoose"
import {deleteFromCloudinary, uploadOnCloudinary} from "../utils/cloudinary.js"
import {redisClient} from "../config/redis.js"
import {invalidateCache} from "../utils/cacheInvalidator.js"

const fetchAllVideos = async(data) => {
    const { page, limit, query, sortBy, sortType, userId } = data


        const pipeline = []
    
        if(query){
            pipeline.push({
                $match: {
                    $or: [
                        {title: {$regex: query, $options: "i"}},
                        {description: {$regex: query, $options: "i"}}
                    ]
                }
            })
        }
    
        if(userId){
            pipeline.push({
                $match: {
                    owner: iuserId
                }
            })
        }
    
        pipeline.push({$match: {isPublished: true}})
    
        pipeline.push({
            $sort: sortBy && sortType
                ? { [sortBy]: sortType === "asc" ? 1 : -1 }
                : { createdAt: -1 }
        })
    
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
            page: parseInt(page),
            limit: parseInt(limit)
        }
    
        const videoList = await Video.aggregatePaginate(videoAggreagate, options)

        return videoList
}

const uploadAVideo = async(data) => {
    const {title, description, videoLocalPath, thumbnailLocalPath, userId} = data
    const videoFile = await uploadOnCloudinary(videoLocalPath, "video")

    if (!videoFile) {
        cleanupLocalFiles(videoLocalPath)
        cleanupLocalFiles(thumbnailLocalPath)
        throw new ApiError(500, "Video upload failed")
    }

    cleanupLocalFiles(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if (!thumbnail) {
        cleanupLocalFiles(thumbnailLocalPath)
        await deleteFromCloudinary(videoFile.public_id, "video")
        throw new ApiError(500, "Thumbnail upload failed")
    }

    cleanupLocalFiles(thumbnailLocalPath)

    let video
    try {
        video = await Video.create({
            title,
            description,
            duration: videoFile.duration,
            videoFile: videoFile.url,
            thumbnail: thumbnail.url,
            owner: userId,              // was req.user._id — req doesn't exist in service
            isPublished: true
        })
    } catch (error) {
        await deleteFromCloudinary(videoFile.public_id, "video")
        await deleteFromCloudinary(thumbnail.public_id)
        throw new ApiError(500, "Something went wrong while publishing")
    }

    return video
}

const fetchVideoById = async(data) => {
    const {videoId} = data
    await redisClient.hincrby("video:view:buffer", videoId, 1)

    const video = await Video.findById(videoId).populate("owner", "username avatar fullName")

    if(!video){
        throw new ApiError(404, "video not found")
    }

    return video
}

const changeVideo = async(data) => {
    const {videoId, title, description, thumbnailLocalPath} = data

    const oldvideo = await Video.findById(videoId)

    if(!oldvideo){
        throw new ApiError(404, "video not found")
    }

    if (oldVideo.owner.toString() !== userId.toString()) {
        if (thumbnailLocalPath) cleanupLocalFiles(thumbnailLocalPath)
        throw new ApiError(403, "You are not authorized to update this video")
    }

    const updatedData = {}
    if (title?.trim())       updatedData.title = title
    if (description?.trim()) updatedData.description = description


    if(thumbnailLocalPath){
        const newthumbnail = await uploadOnCloudinary(thumbnailLocalPath)

        if(!newthumbnail){
            cleanupLocalFiles(thumbnailLocalPath)
            throw new ApiError(400, "error while uploading thumbnail")
        }
        cleanupLocalFiles(thumbnailLocalPath)

        const oldThumbnail = oldvideo.thumbnail.split("/").pop().split(".")[0]
        await deleteFromCloudinary(oldThumbnail)
        updatedData.thumbnail = newthumbnail.url
    }

    const updatedVideo = await Video.findByIdAndUpdate(
        videoId,
        {$set: updatedData},
        {new: true}
    )

    await invalidateCache(`v/${videoId}`)
    await invalidateCache(`all-videos`)

    return updatedVideo
}

const removeVideo = async(data) => {
    const {videoId, userId} = data
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "video not found")
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have permission to perform this action");
    }

    const videoPublicId = video.videoFile.split("/").pop().split(".")[0]
    const thumbnailPublicId = video.thumbnail.split("/").pop().split(".")[0]

    await deleteFromCloudinary(videoPublicId, "video")
    await deleteFromCloudinary(thumbnailPublicId)

    await video.deleteOne()

    await invalidateCache(`v/${videoId}`)
    await invalidateCache(`all-videos`)

    return 
}

const changePublishStatus = async(data) => {
    const {videoId, userId} = data
    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video not found")
    }

    if (video.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You do not have permission to perform this action");
    }

    video.isPublished = !video.isPublished

    await video.save()

    await invalidateCache(`v/${videoId}`)
    await invalidateCache(`all-videos`)

    return video.isPublished
}

export {
    fetchAllVideos,
    uploadAVideo,
    fetchVideoById,
    changeVideo,
    removeVideo,
    changePublishStatus,
}