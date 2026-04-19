import {Playlist} from "../models/playlist.model.js"
import { ApiError } from "../utils/ApiError.js"
import { invalidateCache } from "../utils/cacheInvalidator.js"

const makePlaylist = async(data) => {
    const {userId, name, description} = data

    const playlist = await Playlist.create({
        name: name,
        description: description || "",
        owner: userId,
        video: []
    })    
    return playlist
}

const fetchUserPlaylist = async(data) => {
    const {userId, skip, limit} = data

    const playlists = await Playlist.aggregate([
        {
            $match:{
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        { $sort: { createdAt: -1 } },
        { $skip: skip },
        { $limit: limit },
        {
            $addFields: {
                totalVideos: { $size: "$video" }
            }
        }
    ])

    return playlists
}

const fetchPlaylistById = async(data) => {
    const {playlistId, userId} = data

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
                as: "videos",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            thumbnail: 1,
                            duration: 1,
                            views: 1,
                            owner: 1
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                totalVideos: { $size: "$videos"}
            }
        }
    ])
    
    if(!playlist?.length){
        throw new ApiError(404, "playlist not found")
    }

    if (playlist[0].owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to view this playlist")
    }
    
    return playlist
}

const addVideo = async (data) => {
    const { playlistId, videoId, userId } = data

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")

    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist")
    }

    const updatedPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        { $addToSet: { video: videoId } },
        { new: true }
    )

    await invalidateCache(`playlist:${playlistId}`)
    await invalidateCache(`playlists:u:${userId}`)  

    return updatedPlaylist
}

const removeVideo = async(data) => {
    const {playlistId, videoId, userId} = data

    const video = await Video.findById(videoId)
    if (!video) throw new ApiError(404, "Video not found")

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) throw new ApiError(404, "Playlist not found")

    if (playlist.owner.toString() !== userId.toString()) {
        throw new ApiError(403, "You are not authorized to modify this playlist")
    }

    playlist.video = playlist.video.filter(id => id.toString() !== videoId.toString())
    await playlist.save()

    await invalidateCache(`playlist:${playlistId}`)
    await invalidateCache(`playlists:u:${userId}`)

    return playlist

}

const removePlaylist = async(data) => {
    const {playlistId, userId} = data

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) throw new ApiError(404, "Playlist not found")

    if(playlist.owner.toString() !== userId.toString()){
        throw new ApiError(403, "You do not have permission to delete this playlist");
    }
    
    await playlist.deleteOne() 

    await invalidateCache(`playlist:${playlistId}`)
    await invalidateCache(`playlists:u:${userId}`)
}

const changePlaylist = async(data) => {
    const {userId, playlistId, name, description} = data

    const playlist = await Playlist.findById(playlistId)

    if (!playlist) throw new ApiError(404, "Playlist not found")

    if(playlist.owner.toString() !== userId.toString()){
        throw new ApiError(403, "You do not have permission to update this playlist");
    }

    if(name) playlist.name = name
    if(description) playlist.description = description
    const updatedPlaylist = await playlist.save()
    await invalidateCache(`playlist:${playlistId}`)
    await invalidateCache(`playlists:u:${userId}`)

    return updatedPlaylist

}

export {
    makePlaylist,
    fetchPlaylistById,
    fetchUserPlaylist,
    addVideo,
    removeVideo,
    removePlaylist,
    changePlaylist,
}