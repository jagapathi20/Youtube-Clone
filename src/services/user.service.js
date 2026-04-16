import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import { cleanupLocalFiles } from "../utils/cleanLocalFiles.js"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshTokens = async(user) => {
    try{
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    }catch(error){
        throw new ApiError(500, "access and refresh token method failed")
    }
}


const createUser = async (data) =>{

    const {fullName, email, username, password, avatarLocalPath} = data
    const coverImageLocalPath = data.coverImageLocalPath ?? null
    


    const existingUser = await User.exists({
        $or: [{username}, {email}]
    })
    
    if (existingUser){
        cleanupLocalFiles(avatarLocalPath)
        if(coverImageLocalPath) cleanupLocalFiles(coverImageLocalPath)
        throw new ApiError(409, "User with email or username already exists")
    }

    
    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar){
        cleanupLocalFiles(avatarLocalPath)
        if(coverImageLocalPath) cleanupLocalFiles(coverImageLocalPath)
        throw new ApiError(500, "Failed to upload Avatar to cloudinary")
    }

    let coverImage = null
    if(coverImageLocalPath){
        coverImage = await uploadOnCloudinary(coverImageLocalPath)
        if(!coverImage){
            cleanupLocalFiles(avatarLocalPath)
            cleanupLocalFiles(coverImageLocalPath)
            await deleteFromCloudinary(avatar.public_id)
            throw new ApiError(500, "Failed to upload cover Image to cloudinary")
        }
    }

    cleanupLocalFiles(avatarLocalPath)
    if (coverImageLocalPath) cleanupLocalFiles(coverImageLocalPath)

    let user

    try{
        user = await User.create({
            fullName,
            avatar: avatar.url,
            coverImage: coverImage?.url || "",
            email,
            password,
            username
        })

    }catch(error){

        await deleteFromCloudinary(avatar.public_id)
        if (coverImage) await deleteFromCloudinary(coverImage.public_id)

        throw new ApiError(500, error?.message || "Internal server error during registration")
    }
    const createdUser = await User.findById(user._id).select("-password -refreshToken")
    return createdUser
}

const login = async(data) => {
    const {email, password} = data
    const user = await User.findOne({email})
    if(!user){
        throw new ApiError(404, "User does not exist")
    }
    const isPasswordValid = await user.isPasswordCorrect(password)
    if (!isPasswordValid){
        throw new ApiError(401, "Invalid password")
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")

    return {loggedInUser, accessToken, refreshToken}

}


const logout = async(data) => {
    const {userId} = data
    await User.findByIdAndUpdate(
        userId,
        {
            $unset: {
                refreshToken: 1
            }
        }
    )
}

const AccessToken = async(data) => {
    const {incomingRefreshToken} = data
    let decodedToken
    try {
        decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
    } catch (error) {
        throw new ApiError(401, "Invalid or expired refresh token")
    }
    
    const user = await User.findById(decodedToken?._id)
    
    if (!user) {
        throw new ApiError(401, "Invalid refresh token")
    }
    
    if (incomingRefreshToken !== user.refreshToken) {
        throw new ApiError(401, "Refresh token is expired or used")
            
    }
    
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    
    return {accessToken, refreshToken}
}

const ChangePassword = async(data) => {
    const {oldPassword, newPassword, userId} = data

    const user = await User.findById(userId)

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    const isPasswordValid = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordValid) {
        throw new ApiError(401, "Current password is incorrect")
    }

    user.password = newPassword
    await user.save()
}

const changeAccountDetails = async(data) => {
    const {username, fullName, userId} = data
    const updateFields = {}
    if(fullName) updateFields.fullName = fullName
    if(username) updateFields.username = username
    const user = await User.findByIdAndUpdate(
        userId, 
        {
            $set: updateFields
        }, 
        {new: true}
    ).select("-password")

    await invalidateCache(`c:${user.username}`)
    return user

}

const changeUserAvatar = async(data) => {
    const {avatarLocalPath, userId} = data
    const user = await User.findById(userId);
    const oldAvatarUrl = user?.avatar;


    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        cleanupLocalFiles(avatarLocalPath)
        throw new ApiError(400, "Error while uploading on Cloudinary");
    }

    if (oldAvatarUrl) {
        const publicId = oldAvatarUrl.split("/").slice(-2).join("/").split(".")[0]
        await deleteFromCloudinary(publicId);
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    await invalidateCache(`c:${user.username}`)

    return updatedUser

}

const changeUserCoverImage = async(data) => {
    const {coverImageLocalPath, userId} = data
    const user = await User.findById(userId)
    const oldCoverImageUrl = user?.coverImage

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        cleanupLocalFiles(coverImageLocalPath)
        throw new ApiError(400, "Error while uploading cover image to Cloudinary")
    }

    if (oldCoverImageUrl) {
        const publicId = oldCoverImageUrl.split("/").slice(-2).join("/").split(".")[0]
        await deleteFromCloudinary(publicId)
    }

    const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    await invalidateCache(`c:${user.username}`)

    return updatedUser
}

const fetchUserChannelProfile = async(data) => {
    const {username} = data

     const channel = await User.aggregate([
        {
            $match:{
                username: username?.toLowerCase()
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup:{
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelsSubscribedToCount:{
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond: {
                        if: {$in: [new mongoose.Types.ObjectId(req.user?._id), "$subscribers.subscriber"]},
                        then:true,
                        else: false
                    }
                }

            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelsSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1
            }
        }
    ])

    if(!channel?.length){
        throw new ApiError(404, "channel does not exist")
    }

    return channel
}

const fetchWatchHistory = async(data) => {
    const {userId} = data
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as:"watchHistory",
                pipeline:[
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as:"owner",
                            pipeline:[
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first:"$owner"
                            }
                        }
                    }
                ]
            }
        }
    ])

    if (!user.length){
        throw new ApiError(404, "User not found")
    }
    return user
}


export {
    createUser,
    login,
    logout,
    AccessToken,
    ChangePassword,
    changeAccountDetails,
    changeUserAvatar,
    changeUserCoverImage,
    fetchUserChannelProfile,
    fetchWatchHistory
}