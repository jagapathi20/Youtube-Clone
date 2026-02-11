import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import { invalidateCache } from "../utils/cacheInvalidator.js"

const createPlaylist = asyncHandler(async(req, res) => {
    const userId = req.user._id
    const {name, description} = req.body

    if(!name,trim()){
        throw new ApiError(400, "Playlist name required")
    }

    const playlist = await Playlist.create({
        name: name,
        description: description || "",
        owner: userId,
        video: []
    })

    return res
    .status(201)
    .json(new ApiResponse(200,{}, "playlist created successfully")
)
})

const getUserPlaylists = asyncHandler(async(req, res) => {
    const {userId} = req.params

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid User ID")
    }

    const playlists = await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $addFields: {
                totalVideos: { $size: "$video" }
            }
        }
    ])

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "User playlists fetched"))
})


const getPlaylistById = asyncHandler(async(req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = await Playlist.aggregate([
        {
            $match:{
                _id: new mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "video",
                foreignField: "_id",
                as: "videos"
            }
        }
    ])

    if(!playlist.length){
        throw new ApiError(404, "playlist not found")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"))

})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params

     if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid IDs")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $addToSet: {video: videoId}
        },
        {new: true}
    )

    if (!playlist) throw new ApiError(404, "Playlist not found")

    await invalidateCache(`playlist:${playlistId}`)

    await invalidateCache(`playlists:u:${req.user._id}`)

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video added to playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid IDs")
    }

    const playlist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {video: videoId}
        }, 
        {new: true}
    )

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video removed from playlist"))
})

const deletePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }

    const playlist = Playlist.findById(playlistId)

    if(playlist.owner.toString() !== userId.toString()){
        throw new ApiError(403, "You do not have permission to delete this playlist");
    }
    
    Playlist.findByIdAndDelete(playlistId)

    return res
    .status(200)
    .json( new ApiResponse(200, {}, "Playlist Deleted Successfully"))

})

const updatePlaylist = asyncHandler(async(req, res) => {
    const userId = req.user._id
    const {playlistId} = req.params
    const {name, description} = req.body

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }

    if(!name || !description){
        throw new ApiError(400, "name or description is required")
    }

    const playlist = Playlist.findById(playlistId)

    if(playlist.owner.toString() !== userId.toString()){
        throw new ApiError(403, "You do not have permission to update this playlist");
    }

    if(name) playlist.name = name
    if(description) playlist.description = description
    const updatedPlaylist = await playlist.schemaLevelProjections({validateBeforeSave: false})
    await invalidateCache(`playlist:${playlistId}`)
    await invalidateCache(`playlist:u:${userId}`)

    return res
        .status(200)
        .json(new ApiResponse(200, updatedPlaylist, "Playlist updated"))
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}