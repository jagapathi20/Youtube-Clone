import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { 
    fetchVideoComments ,
    createComment,
    updateComment,
    removeComment,
} from "../services/comment.service.js"


const getVideoComments = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const page = req.query.page
    const limit = req.query.limit

    const data = { videoId: videoId, page: page, limit: limit}

    const result = await fetchVideoComments(data)

    return res
    .status(200)
    .json(new ApiResponse(200, result, "Comments featched successfully"))
})



const addComment = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    const userId = req.user?._id
    
    if (!userId) throw new ApiError(401, "Unauthorized")

    const data = { videoId, content, userId}

    const result = await createComment(data)

    return res
    .status(201)
    .json(new ApiResponse(201, result, "Comment added Successfully"))
})



const patchComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id

    if (!userId) throw new ApiError(401, "Unauthorized");

    const data = { commentId, content, userId}

    const result = await updateComment(data)
    
    return res
        .status(200)
        .json(new ApiResponse(200, result, "Comment updated successfully"));
});


const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user?._id
    const data = { commentId, userId}

    if (!userId) throw new ApiError(401, "Unauthorized");

    const result = await removeComment(data)

    return res
        .status(200)
        .json(new ApiResponse(200, result, "Comment deleted successfully"));
});

export {
    getVideoComments,
    addComment,
    patchComment,
    deleteComment
}