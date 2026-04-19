import mongoose, {isValidObjectId} from "mongoose"
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { asyncHandler } from "../utils/asyncHandler.js"
import {
    makePlaylist,
    fetchPlaylistById,
    fetchUserPlaylist,
    addVideo,
    removePlaylist,
    removeVideo,
    changePlaylist
} from "../services/playlist.service.js"

const createPlaylist = asyncHandler(async(req, res) => {
    const userId = req.user._id
    const {name, description} = req.body

    if(!name?.trim()){
        throw new ApiError(400, "Playlist name required")
    }
    const data = {userId, name, description}

    const playlist = await makePlaylist(data)

    return res
    .status(201)
    .json(new ApiResponse(201, playlist , "playlist created successfully")
)
})

const getUserPlaylists = asyncHandler(async(req, res) => {
    const { userId } = req.params
    const requestingUserId = req.user._id

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID")
    }

    if (userId.toString() !== requestingUserId.toString()) {
        throw new ApiError(403, "You are not authorized to view these playlists")
    }

    const page = parseInt(req.query.page) || 1
    const limit = parseInt(req.query.limit) || 10
    const skip = (page - 1) * limit

    const playlists = await fetchUserPlaylist({ userId, skip, limit })

    return res
        .status(200)
        .json(new ApiResponse(
            200,
            {
                playlists,
                pagination: {
                    currentPage: page,
                    limit,
                    hasNextPage: playlists.length === limit
                }
            },
            "User playlists fetched successfully"
        ))
})


const getPlaylistById = asyncHandler(async(req, res) => {
    const {playlistId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }

    const data = {playlistId, userId}
    const playlist = await fetchPlaylistById(data)

    return res
    .status(200)
    .json(new ApiResponse(200, playlist[0], "Playlist fetched successfully"))

})

const addVideoToPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params

     if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid IDs")
    }

    const data = {playlistId, videoId}

    const playlist = await addVideo(data)

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video added to playlist"))
})

const removeVideoFromPlaylist = asyncHandler(async(req, res) => {
    const {playlistId, videoId} = req.params
    const userId = req.uer._id

    if(!isValidObjectId(playlistId) || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid IDs")
    }
    const data = {playlistId, videoId, userId}

    const playlist = await removeVideo(data)

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "Video removed from playlist"))
})

const deletePlaylist = asyncHandler(async(req, res) => {
    const {playlistId} = req.params
    const userId = req.user._id

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist ID")
    }

    const data = {playlistId, userId}
    await removePlaylist(data)

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

    if(!name && !description){
        throw new ApiError(400, "name or description is required")
    }

    const data = {userId, playlistId, name, description}

    const updatedPlaylist = await changePlaylist(data)

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