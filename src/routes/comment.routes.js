import { Router } from "express"
import {
    getVideoComments,
    addComment,
    patchComment,
    deleteComment
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { cacheMiddleware } from "../middlewares/cache.middleware.js"

const router = Router()

router.use(verifyJWT)

router.route("/:videoId").get(cacheMiddleware(60, false), getVideoComments).post(addComment)

router.route("/c/:commentId").delete(deleteComment).patch(patchComment)

export default router
