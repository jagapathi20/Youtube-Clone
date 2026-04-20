import { Router } from "express"
import {
    getVideoComments,
    addComment,
    patchComment,
    deleteComment,
} from "../controllers/comment.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { cacheMiddleware } from "../middlewares/cache.middleware.js"

const router = Router()
router.use(verifyJWT)

/**
 * @swagger
 * /comments/{videoId}:
 *   get:
 *     tags: [Comments]
 *     summary: Get comments for a video
 *     description: Returns paginated comments for the given video. Cached 60 seconds.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *         example: 64vid789abc
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *     responses:
 *       200:
 *         description: Comments fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Comments fetched successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     docs:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Comment'
 *                     totalDocs: { type: integer, example: 45 }
 *                     page: { type: integer, example: 1 }
 *                     totalPages: { type: integer, example: 5 }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 *   post:
 *     tags: [Comments]
 *     summary: Add a comment to a video
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *         example: 64vid789abc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: Great video, really helpful!
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 201 }
 *                 message: { type: string, example: Comment added successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Comment content is empty
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/:videoId").get(cacheMiddleware(60, false), getVideoComments).post(addComment)

/**
 * @swagger
 * /comments/c/{commentId}:
 *   patch:
 *     tags: [Comments]
 *     summary: Update a comment
 *     description: Edits comment content. Owner only.
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *         example: 64cmt456xyz
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content:
 *                 type: string
 *                 example: Updated comment text
 *     responses:
 *       200:
 *         description: Comment updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Comment updated successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Comment'
 *       403:
 *         description: Forbidden — not the comment owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 *   delete:
 *     tags: [Comments]
 *     summary: Delete a comment
 *     description: Permanently removes a comment. Owner only.
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *         example: 64cmt456xyz
 *     responses:
 *       200:
 *         description: Comment deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Comment deleted successfully }
 *       403:
 *         description: Forbidden — not the comment owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Comment not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/c/:commentId").delete(deleteComment).patch(patchComment)

export default router