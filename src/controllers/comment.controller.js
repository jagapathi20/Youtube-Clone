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

    const comments = await fetchVideoComments(data)

    return res
    .status(200)
    .json(new ApiResponse(200, comments, "Comments featched successfully"))
})



const addComment = asyncHandler(async(req, res) => {
    const {videoId} = req.params
    const {content} = req.body
    const userId = req.user?._id
    
    const data = { videoId, content, userId}

    const populatedComment = await createComment(data)

    return res
    .status(201)
    .json(new ApiResponse(201, populatedComment, "Comment added Successfully"))
})



const patchComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const { content } = req.body;
    const userId = req.user?._id

    const data = { commentId, content, userId}

    const updatedComment = await updateComment(data)
    
    return res
        .status(200)
        .json(new ApiResponse(200, updatedComment, "Comment updated successfully"));
});


const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user?._id
    const data = { commentId, userId}

    const response_data = await removeComment(data)

    return res
        .status(200)
        .json(new ApiResponse(200, response_data, "Comment deleted successfully"));
});

export {
    getVideoComments,
    addComment,
    patchComment,
    deleteComment
}