import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { cleanupLocalFiles } from "../utils/cleanLocalFiles.js"
import { 
    createUser,
    login,
    logout,
    AccessToken,
    changePassword,
    changeAccountDetails,
    changeUserAvatar,
    changeUserCoverImage,
    fetchUserChannelProfile,
    fetchWatchHistory,
} from "../services/user.service.js"



const registerUser = asyncHandler(async (req, res) =>{

    const {fullName, email, username, password} = req.body

    const avatarLocalPath = req.files?.avatar[0]?.path
    const coverImageLocalPath = req.files?.coverImage[0].path ?? null

    if(!avatarLocalPath){
        if (coverImageLocalPath) cleanupLocalFiles(coverImageLocalPath)
        throw new ApiError(400, "Avatar file missing on server")
    }
    
    const data = {fullName, email, username, password, avatarLocalPath, coverImageLocalPath}

    const userCreated = await createUser(data)

    return res.status(201).json(
            new ApiResponse(200, userCreated, "User registered Successfully")
    )
})


const loginUser = asyncHandler(async(req, res) => {
    const {email, password} = req.body
    if (!email || !password){
        throw new ApiError(400, "email or password is not found")
    }

    const data = {email, password}
    const {user, accessToken, refreshAccessToken} = await login(data)

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user,
                accessToken,
                refreshToken
            },
            "User logged in Successfully"
        )
    )

})


const logoutUser = asyncHandler(async(req, res) => {
    const data = {userId: req.user._id}

    await logout(data)

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
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
    const data = {incomingRefreshToken}
    const {accessToken, refreshToken} = await AccessToken(data)

    const options = {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production"
    }

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

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
    const userId = req.user?._id
    const {oldPassword, newPassword} = req.body

    if (!oldPassword || !newPassword) {
        throw new ApiError(400, "Old and new passwords are required")
    }

    if (oldPassword === newPassword) {
        throw new ApiError(400, "New password must be different from current password")
    }

    await changePassword({ oldPassword, newPassword, userId })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async(req, res) => {
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})


const updateAccountDetails = asyncHandler(async(req, res) => {
    const {username, fullName} = req.body
    const userId = req.user?._id

    if (!fullName && !username){
        throw new ApiError(400, "any one field is required")
    }

    const data = {username, fullName, userId}
    const user = await changeAccountDetails(data)
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
    const userId = req.user?._id
    const data = {avatarLocalPath, userId}
    updatedUser = await changeUserAvatar(data)
    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Avatar updated and old file cleaned up"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }
    const data = {coverImageLocalPath, userId}
    const updatedUser = await changeUserCoverImage(data)

    return res
        .status(200)
        .json(new ApiResponse(200, updatedUser, "Cover image updated and old file deleted"))
})


const getUserChannelProfile = asyncHandler(async(req, res) =>{
    const {username} = req.params

    if (!username?.trim()){
        throw new ApiError(400, "username is Missing")
    }
    const data = {username}

    const channel = await fetchUserChannelProfile(data)

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully")
    )

})


const getWatchHistory = asyncHandler(async(req, res) => {
    const data = {userId: req.user._id}
    const user = await fetchWatchHistory(data)
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