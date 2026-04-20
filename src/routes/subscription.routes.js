import { Router } from "express"
import {
    getSubscribedChannels,
    getUserChannelSubscribers,
    toggleSubscription,
} from "../controllers/subscription.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

/**
 * @swagger
 * /subscriptions/c/{channelId}:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get channels subscribed to by a user
 *     description: Returns channels that the given user (by channelId) is subscribed to.
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema: { type: string }
 *         description: The subscriber's user ID
 *         example: 64abc123def456
 *     responses:
 *       200:
 *         description: Subscribed channels fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Subscribed channels fetched successfully }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string }
 *                       username: { type: string }
 *                       fullName: { type: string }
 *                       avatar: { type: string }
 *                       subscribersCount: { type: integer, example: 3200 }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 *   post:
 *     tags: [Subscriptions]
 *     summary: Toggle subscription to a channel
 *     description: Subscribes if not subscribed, unsubscribes if already subscribed.
 *     parameters:
 *       - in: path
 *         name: channelId
 *         required: true
 *         schema: { type: string }
 *         description: The channel owner's user ID
 *         example: 64abc123def456
 *     responses:
 *       200:
 *         description: Subscription toggled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Subscribed successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     subscribed: { type: boolean, example: true }
 *       400:
 *         description: Cannot subscribe to your own channel
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
router.route("/c/:channelId").get(getSubscribedChannels).post(toggleSubscription)

/**
 * @swagger
 * /subscriptions/u/{subscriberId}:
 *   get:
 *     tags: [Subscriptions]
 *     summary: Get subscribers of a channel
 *     description: Returns users subscribed to the channel owned by subscriberId.
 *     parameters:
 *       - in: path
 *         name: subscriberId
 *         required: true
 *         schema: { type: string }
 *         description: The channel owner's user ID
 *         example: 64abc123def456
 *     responses:
 *       200:
 *         description: Subscribers fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Subscribers fetched successfully }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id: { type: string }
 *                       username: { type: string }
 *                       fullName: { type: string }
 *                       avatar: { type: string }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/u/:subscriberId").get(getUserChannelSubscribers)

export default router