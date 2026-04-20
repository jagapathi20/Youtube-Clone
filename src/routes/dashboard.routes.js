import { Router } from "express"
import { getChannelStats, getChannelVideos } from "../controllers/dashboard.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { cacheMiddleware } from "../middlewares/cache.middleware.js"


const router = Router()
router.use(verifyJWT)

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get channel stats
 *     description: Aggregated analytics for the authenticated user's channel. Cached per user for 10 minutes.
 *     responses:
 *       200:
 *         description: Channel stats fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Channel stats fetched successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     totalVideos: { type: integer, example: 24 }
 *                     totalViews: { type: integer, example: 158420 }
 *                     totalSubscribers: { type: integer, example: 3200 }
 *                     totalLikes: { type: integer, example: 9870 }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/stats").get(cacheMiddleware(600, true), getChannelStats)

/**
 * @swagger
 * /dashboard/videos:
 *   get:
 *     tags: [Dashboard]
 *     summary: Get channel videos
 *     description: Returns all videos (including unpublished) for the authenticated user's channel with like counts.
 *     responses:
 *       200:
 *         description: Channel videos fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Channel videos fetched successfully }
 *                 data:
 *                   type: array
 *                   items:
 *                     allOf:
 *                       - $ref: '#/components/schemas/Video'
 *                       - type: object
 *                         properties:
 *                           likesCount: { type: integer, example: 412 }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/videos").get(getChannelVideos)

export default router