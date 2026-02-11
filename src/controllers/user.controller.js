import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary, deleteFromCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import fs from "fs"
import jwt from "jsonwebtoken"
import mongoose from "mongoose"

const generateAccessAndRefreshTokens = async(userId) => {
    try{
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()

        user.refreshToken = refreshToken
        await user.save({validateBeforeSave: false})

        return {accessToken, refreshToken}
    }catch(error){
        throw new ApiError(500, "access and refresh token method")
    }
}

const registerUser = asyncHandler(async (req, res) =>{

    const avatarLocalpath = req.files?.avatar[0]?.path
    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    const cleanupLocalFiles = () => {
        if (avatarLocalpath && fs.existsSync(avatarLocalpath)) fs.unlinkSync(avatarLocalpath)
        if (coverImageLocalPath && fs.existsSync(coverImageLocalPath)) fs.unlinkSync(coverImageLocalPath)
    }

    const {fullName, email, username, password} = req.body

    if (
        [fullName, email, username, password].some((field) =>
        field?.trim() === "")
    ){
        cleanupLocalFiles()
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if (existingUser){
        cleanupLocalFiles()
        throw new ApiError(409, "User with email or username already exists")
    }

    if(!avatarLocalpath){
        cleanupLocalFiles()
        throw new ApiError(400, "Avatar file missing on server")
    }
    
    const avatar = await uploadOnCloudinary(avatarLocalpath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!avatar){
        cleanupLocalFiles()
        throw new ApiError(400, "Failed to upload Avatar file to cloudinary")
    }

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

        const Usercreated = await User.findById(user._id).select(
        "-password -refreshToken"
        )

        if(!Usercreated){
            throw new ApiError(500, "User not created")
        }

        cleanupLocalFiles()

        return res.status(201).json(
            new ApiResponse(200, Usercreated, "User registered Successfully")
        )

    }catch(error){

        if (avatar) await deleteFromCloudinary(avatar.public_id)
        if (coverImage) await deleteFromCloudinary(coverImage.public_id)
        
       cleanupLocalFiles()

        throw new ApiError(500, error?.message || "Internal server error during registration")
    }

})

const loginUser = asyncHandler(async(req, res) => {
    const {email, password} = req.body
    if (!email || !password){
        throw new ApiError(400, "email or password is not found")
    }

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

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "User logged in Successfully"
        )
    )

})


const logoutUser = asyncHandler(async(req, res) => {
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))
})

const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (!incomingRefreshToken) {
        throw new ApiError(401, "unauthorized request")
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        const user = await User.findById(decodedToken?._id)
    
        if (!user) {
            throw new ApiError(401, "Invalid refresh token")
        }
    
        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used")
            
        }
    
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id)
    
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", refreshToken, options)
        .json(
            new ApiResponse(
                200, 
                {accessToken, refreshToken: refreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {

    const {oldPassword, newPassword} = req.body
    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect){
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})


const updateAccountDetails = asyncHandler(async(req, res) => {
    const {username, fullName} = req.body

    if (!fullName && !username){
        throw new ApiError(400, "any one field is required")
    }

    const updateFields = {}
    if(fullName) updateFields.fullName = fullName
    if(username) updateFields.username = username
    const user = await User.findByIdAndUpdate(
        req.user?._id, 
        {
            $set: updateFields
        }, 
        {new: true}
    ).select("-password")

    await invalidateCache(`c:${user.username}`)

    return res
    .status(200)
    .json(new ApiResponse(
        200,
        user,
        "Account details updated successfully"
    ))
})

const updateUserAvatar = asyncHandler(async(req, res) => {
    const avatarLocalPath = req.file?.path;

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing");
    }

    const user = await User.findById(req.user?._id);
    const oldAvatarUrl = user?.avatar;


    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if (!avatar.url) {
        fs.unlinkSync(avatarLocalPath)
        throw new ApiError(400, "Error while uploading on Cloudinary");
    }

    if (oldAvatarUrl) {
        const publicId = oldAvatarUrl.split("/").slice(-2).join("/").split(".")[0]
        await deleteFromCloudinary(publicId);
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password");

    await invalidateCache(`c:${user.username}`)

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Avatar updated and old file cleaned up"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const user = await User.findById(req.user?._id)
    const oldCoverImageUrl = user?.coverImage

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        fs.unlinkSync(coverImageLocalPath)
        throw new ApiError(400, "Error while uploading cover image to Cloudinary")
    }

    if (oldCoverImageUrl) {
        const publicId = oldCoverImageUrl.split("/").slice(-2).join("/").split(".")[0]
        await deleteFromCloudinary(publicId)
    }

    const updatedUser = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    await invalidateCache(`c:${user.username}`)

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Cover image updated and old file deleted"))
})


const getUserChannelProfile = asyncHandler(async(req, res) =>{
    const {username} = req.params

    if (!username?.trim()){
        throw new ApiError(400, "username is Missing")
    }

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

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )

})


const getWatchHistory = asyncHandler(async(req, res) => {
    const user = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user._id)
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
    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched"
        )
    )
})

export {
    registerUser, 
    loginUser, 
    logoutUser, 
    refreshAccessToken, 
    changeCurrentPassword, 
    getCurrentUser, 
    updateAccountDetails, 
    updateUserAvatar, 
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory
}