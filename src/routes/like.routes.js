import { Router } from "express"
import {
    toggleCommentLike,
    toggleVideoLike,
    toggleTweetLike,
    getLikedVideos,
} from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

/**
 * @swagger
 * /likes/toggle/v/{videoId}:
 *   post:
 *     tags: [Likes]
 *     summary: Toggle like on a video
 *     parameters:
 *       - in: path
 *         name: videoId
 *         required: true
 *         schema: { type: string }
 *         example: 64vid789abc
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Video liked successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked: { type: boolean, example: true }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/toggle/v/:videoId").post(toggleVideoLike)

/**
 * @swagger
 * /likes/toggle/t/{tweetId}:
 *   post:
 *     tags: [Likes]
 *     summary: Toggle like on a tweet
 *     parameters:
 *       - in: path
 *         name: tweetId
 *         required: true
 *         schema: { type: string }
 *         example: 64twt123abc
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Tweet liked successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked: { type: boolean, example: true }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/toggle/t/:tweetId").post(toggleTweetLike)

/**
 * @swagger
 * /likes/toggle/c/{commentId}:
 *   post:
 *     tags: [Likes]
 *     summary: Toggle like on a comment
 *     parameters:
 *       - in: path
 *         name: commentId
 *         required: true
 *         schema: { type: string }
 *         example: 64cmt456xyz
 *     responses:
 *       200:
 *         description: Like toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Comment liked successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     liked: { type: boolean, example: false }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/toggle/c/:commentId").post(toggleCommentLike)

/**
 * @swagger
 * /likes/likedVideos:
 *   get:
 *     tags: [Likes]
 *     summary: Get all liked videos
 *     description: Returns all videos the authenticated user has liked.
 *     responses:
 *       200:
 *         description: Liked videos fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Liked videos fetched successfully }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Video'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/likedVideos").get(getLikedVideos)

export default router
