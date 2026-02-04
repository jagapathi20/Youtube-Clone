import {asyncHandler} from "../utils/asyncHandler.js"
import {ApiError} from "../utils/ApiError.js"
import {User} from "../models/user.model.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js"

const registerUser = asyncHandler(async (req, res) =>{
    console.log("Files: ", req.files)
    console.log("Body: ", req.body)

    const {fullName, email, username, password} = req.body

    if (
        [fullName, email, username, password].some((field) =>
        field?.trim() === "")
    ){
        throw new ApiError(400, "All fields are required")
    }

    const existingUser = await User.findOne({
        $or: [{username}, {email}]
    })
    if (existingUser){
        throw new ApiError(409, "User with email or username already exists")
    }

    const avatarLocalpath = req.files?.avatar[0]?.path
    if(!avatarLocalpath){
        throw new ApiError(400, "Avatar file missing on server")
    }
    let coverImageLocalPath
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }

    const avatar = await uploadOnCloudinary(avatarLocalpath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)
    if (!avatar){
        throw new ApiError(400, "Failed to upload Avatar file to cloudinary")
    }

    const user = await User.create({
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

    return res.status(201).json(
        new ApiResponse(200, Usercreated, "User registered Successfully")
    )

})

export {registerUser}