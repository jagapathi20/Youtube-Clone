import { Router } from "express"
import {
    changeCurrentPassword,
    getCurrentUser,
    getUserChannelProfile,
    getWatchHistory,
    loginUser,
    logoutUser,
    refreshAccessToken,
    registerUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import { cacheMiddleware } from "../middlewares/cache.middleware.js"
import { authLimiter, refreshTokenLimiter } from '../middlewares/rateLimiter.middleware.js';

const router = Router()

/**
 * @swagger
 * /users/register:
 *   post:
 *     tags: [Users]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [fullName, email, username, password, avatar]
 *             properties:
 *               fullName:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               username:
 *                 type: string
 *                 example: johndoe
 *               password:
 *                 type: string
 *                 example: secret123
 *               avatar:
 *                 type: string
 *                 format: binary
 *                 description: Required profile picture
 *               coverImage:
 *                 type: string
 *                 format: binary
 *                 description: Optional cover image
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 201 }
 *                 message: { type: string, example: User registered Successfully }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing fields or avatar not provided
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       409:
 *         description: Email or username already exists
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/register").post(
    authLimiter,
    upload.fields([
        { name: "avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser
)

/**
 * @swagger
 * /users/login:
 *   post:
 *     tags: [Users]
 *     summary: Login user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *                 example: secret123
 *     responses:
 *       200:
 *         description: Login successful — tokens returned in cookies and body
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: User logged in Successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       $ref: '#/components/schemas/User'
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *       400:
 *         description: Email or password missing
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 *       404:
 *         description: User not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/login").post(authLimiter, loginUser)

/**
 * @swagger
 * /users/logout:
 *   post:
 *     tags: [Users]
 *     summary: Logout user
 *     description: Clears auth cookies and invalidates the refresh token.
 *     responses:
 *       200:
 *         description: Logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: User logged Out }
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/logout").post(authLimiter, verifyJWT, logoutUser)

/**
 * @swagger
 * /users/refresh-token:
 *   post:
 *     tags: [Users]
 *     summary: Refresh access token
 *     security: []
 *     description: Issues new tokens using a valid refresh token sent via cookie or request body.
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Only required if not sent via cookie
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Access token refreshed }
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken: { type: string }
 *                     refreshToken: { type: string }
 *       401:
 *         description: Refresh token invalid or expired
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/refresh-token").post(refreshAccessToken, refreshAccessToken)

/**
 * @swagger
 * /users/change-password:
 *   post:
 *     tags: [Users]
 *     summary: Change password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [oldPassword, newPassword]
 *             properties:
 *               oldPassword:
 *                 type: string
 *                 example: secret123
 *               newPassword:
 *                 type: string
 *                 example: newSecret456
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Password changed successfully }
 *       400:
 *         description: Old password is incorrect
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
router.route("/change-password").post(authLimiter, verifyJWT, changeCurrentPassword)

/**
 * @swagger
 * /users/current-user:
 *   get:
 *     tags: [Users]
 *     summary: Get current user
 *     responses:
 *       200:
 *         description: Current user fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Current user fetched successfully }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/current-user").get(verifyJWT, getCurrentUser)

/**
 * @swagger
 * /users/update-account:
 *   patch:
 *     tags: [Users]
 *     summary: Update account details
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fullName: { type: string, example: Jane Doe }
 *               email: { type: string, example: jane@example.com }
 *     responses:
 *       200:
 *         description: Account updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Account details updated successfully }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.route("/update-account").patch(authLimiter, verifyJWT, updateAccountDetails)

/**
 * @swagger
 * /users/change-avatar:
 *   patch:
 *     tags: [Users]
 *     summary: Update avatar image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [avatar]
 *             properties:
 *               avatar:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Avatar image updated successfully }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Avatar file missing
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
router.route("/change-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

/**
 * @swagger
 * /users/update_coverImage:
 *   patch:
 *     tags: [Users]
 *     summary: Update cover image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [coverImage]
 *             properties:
 *               coverImage:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Cover image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Cover image updated successfully }
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Cover image file missing
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
router.route("/update_coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

/**
 * @swagger
 * /users/c/{username}:
 *   get:
 *     tags: [Users]
 *     summary: Get channel profile
 *     description: Returns a public channel profile with subscriber count and subscription status. Cached 5 minutes.
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         example: johndoe
 *     responses:
 *       200:
 *         description: Channel profile fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: User channel fetched successfully }
 *                 data:
 *                   type: object
 *                   properties:
 *                     fullName: { type: string }
 *                     username: { type: string }
 *                     avatar: { type: string }
 *                     coverImage: { type: string }
 *                     subscribersCount: { type: integer, example: 1500 }
 *                     channelsSubscribedToCount: { type: integer, example: 42 }
 *                     isSubscribed: { type: boolean, example: true }
 *       404:
 *         description: Channel not found
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
router.route("/c/:username").get(verifyJWT, cacheMiddleware(300, false), getUserChannelProfile)

/**
 * @swagger
 * /users/history:
 *   get:
 *     tags: [Users]
 *     summary: Get watch history
 *     description: Returns the authenticated user's video watch history. Cached per user for 60 seconds.
 *     responses:
 *       200:
 *         description: Watch history fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode: { type: integer, example: 200 }
 *                 message: { type: string, example: Watch history fetched successfully }
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
router.route("/history").get(verifyJWT, cacheMiddleware(60, true), getWatchHistory)

export default router