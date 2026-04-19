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


/**
 * @swagger
 * tags:
 *   name: Comments
 *   description: Video comment operations
 */

/**
 * @swagger
 * /comments/{videoId}:
 *   get:
 *     summary: Get comments for a video
 *     tags: [Comments]
 *     description: >
 *       Returns a paginated list of comments for the given video.
 *       Responses are cached for **60 seconds**.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: ID of the video to fetch comments for.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number (1-indexed).
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of comments per page.
 *     responses:
 *       200:
 *         description: Paginated list of comments fetched successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/PaginatedComments'
 *             example:
 *               statusCode: 200
 *               message: Comments fetched successfully
 *               success: true
 *               data:
 *                 docs:
 *                   - _id: "64b8f3e2a1c2d3e4f5a6b7c8"
 *                     content: "Amazing content!"
 *                     video: "64b8f3e2a1c2d3e4f5a6b700"
 *                     owner: "64b8f3e2a1c2d3e4f5a6b711"
 *                     createdAt: "2024-06-01T10:30:00.000Z"
 *                     updatedAt: "2024-06-01T10:30:00.000Z"
 *                 totalDocs: 42
 *                 limit: 10
 *                 page: 1
 *                 totalPages: 5
 *                 hasPrevPage: false
 *                 hasNextPage: true
 *                 prevPage: null
 *                 nextPage: 2
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *
 *   post:
 *     summary: Add a comment to a video
 *     tags: [Comments]
 *     description: >
 *       Creates a new comment on the specified video.
 *       The authenticated user is automatically set as the comment owner.
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: ID of the video to comment on.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 example: This tutorial is incredibly well-explained!
 *     responses:
 *       201:
 *         description: Comment created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Comment'
 *             example:
 *               statusCode: 201
 *               message: Comment added Successfully
 *               success: true
 *               data:
 *                 _id: "64b8f3e2a1c2d3e4f5a6b7c9"
 *                 content: "This tutorial is incredibly well-explained!"
 *                 video: "64b8f3e2a1c2d3e4f5a6b700"
 *                 owner: "64b8f3e2a1c2d3e4f5a6b711"
 *                 createdAt: "2024-06-02T09:15:00.000Z"
 *                 updatedAt: "2024-06-02T09:15:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 */
router.route("/:videoId").get(cacheMiddleware(60, false), getVideoComments).post(addComment)


/**
 * @swagger
 * /comments/c/{commentId}:
 *   patch:
 *     summary: Update a comment
 *     tags: [Comments]
 *     description: >
 *       Updates the content of an existing comment.
 *       Only the **owner** of the comment can perform this action.
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: ID of the comment to update.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 example: "Updated: Even better than I first thought!"
 *     responses:
 *       200:
 *         description: Comment updated successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       $ref: '#/components/schemas/Comment'
 *             example:
 *               statusCode: 200
 *               message: Comment updated successfully
 *               success: true
 *               data:
 *                 _id: "64b8f3e2a1c2d3e4f5a6b7c9"
 *                 content: "Updated: Even better than I first thought!"
 *                 video: "64b8f3e2a1c2d3e4f5a6b700"
 *                 owner: "64b8f3e2a1c2d3e4f5a6b711"
 *                 createdAt: "2024-06-02T09:15:00.000Z"
 *                 updatedAt: "2024-06-02T11:45:00.000Z"
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 *
 *   delete:
 *     summary: Delete a comment
 *     tags: [Comments]
 *     description: >
 *       Permanently deletes the specified comment.
 *       Only the **owner** of the comment can perform this action.
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema:
 *           $ref: '#/components/schemas/ObjectId'
 *         description: ID of the comment to delete.
 *     responses:
 *       200:
 *         description: Comment deleted successfully.
 *         content:
 *           application/json:
 *             schema:
 *               allOf:
 *                 - $ref: '#/components/schemas/ApiResponse'
 *                 - type: object
 *                   properties:
 *                     data:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           $ref: '#/components/schemas/ObjectId'
 *             example:
 *               statusCode: 200
 *               message: Comment deleted successfully
 *               success: true
 *               data:
 *                 _id: "64b8f3e2a1c2d3e4f5a6b7c9"
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.route("/c/:commentId").delete(deleteComment).patch(patchComment)
