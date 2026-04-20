import { Router } from "express"
import {
    createTweet,
    deleteTweet,
    getUserTweets,
    updateTweet,
} from "../controllers/tweet.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"

const router = Router()
router.use(verifyJWT)

/**
 * @swagger
 * /tweets:
 *   post:
 *     tags: [Tweets]
 *     summary: Create a tweet
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
 *                 example: Just uploaded a new video, go check it out!
 *     responses:
 *       201:
 *         description: Tweet created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 201 }
 *                 message: { type: string, example: Tweet created successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Tweet'
 *       400:
 *         description: Tweet content is required
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
router.route("/").post(createTweet)

/**
 * @swagger
 * /tweets/user/{userId}:
 *   get:
 *     tags: [Tweets]
 *     summary: Get tweets by a user
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema: { type: string }
 *         example: 64abc123def456
 *     responses:
 *       200:
 *         description: Tweets fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Tweets fetched successfully }
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Tweet'
 *       404:
 *         description: User not found
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
router.route("/user/:userId").get(getUserTweets)

/**
 * @swagger
 * /tweets/{tweetId}:
 *   patch:
 *     tags: [Tweets]
 *     summary: Update a tweet
 *     description: Owner only.
 *     parameters:
 *       - in: path
 *         name: tweetId
 *         required: true
 *         schema: { type: string }
 *         example: 64twt123abc
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [content]
 *             properties:
 *               content: { type: string, example: Updated tweet content }
 *     responses:
 *       200:
 *         description: Tweet updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Tweet updated successfully }
 *                 data:
 *                   $ref: '#/components/schemas/Tweet'
 *       403:
 *         description: Forbidden — not the tweet owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Tweet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *
 *   delete:
 *     tags: [Tweets]
 *     summary: Delete a tweet
 *     description: Owner only.
 *     parameters:
 *       - in: path
 *         name: tweetId
 *         required: true
 *         schema: { type: string }
 *         example: 64twt123abc
 *     responses:
 *       200:
 *         description: Tweet deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Tweet deleted successfully }
 *       403:
 *         description: Forbidden — not the tweet owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: Tweet not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/:tweetId").patch(updateTweet).delete(deleteTweet)

export default router