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
    updateUserCoverImage } from "../controllers/user.controller.js"
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js"
import {cacheMiddleware} from "../middlewares/cache.middleware.js"

const router = Router()


/**
 * @openapi
 * /api/v1/users/register:
 *   post:
 *     summary: Register a new user
 *     description: Creates a new user account. Requires an avatar image. Cover image is optional. Both images are uploaded to Cloudinary.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - username
 *               - password
 *               - avatar
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               username:
 *                 type: string
 *               password:
 *                 type: string
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
 *                 statusCode:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     fullName:
 *                       type: string
 *                     email:
 *                       type: string
 *                       example: john@example.com
 *                     username:
 *                       type: string
 *                       example: johndoe
 *                     avatar:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/avatar.jpg
 *                     coverImage:
 *                       type: string
 *                       example: https://res.cloudinary.com/demo/image/upload/cover.jpg
 *                 message:
 *                   type: string
 *                   example: User registered Successfully
 *       400:
 *         description: Missing required fields, avatar not provided, or Cloudinary upload failed
 *       409:
 *         description: User with this email or username already exists
 *       500:
 *         description: Internal server error during registration
 */
router.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
)


/**
 * @openapi
 * /api/v1/users/login:
 *   post:
 *     summary: User login
 *     description: Authenticates a user with email and password. Returns access and refresh tokens as cookies and in the response body.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                 data:
 *                   type: object
 *                   properties:
 *                     user:
 *                       type: object
 *                       properties:
 *                         _id:
 *                           type: string
 *                         fullName:
 *                           type: string
 *                         email:
 *                           type: string
 *                           example: john@example.com
 *                         username:
 *                           type: string
 *                         avatar:
 *                           type: string
 *                           example: https://res.cloudinary.com/demo/image/upload/avatar.jpg
 *                         coverImage:
 *                           type: string
 *                           example: https://res.cloudinary.com/demo/image/upload/cover.jpg
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: User logged in Successfully
 *       400:
 *         description: Email or password missing
 *       401:
 *         description: Invalid password
 *       404:
 *         description: User with this email does not exist
 */
router.route("/login").post(loginUser)


/**
 * @openapi
 * /api/v1/users/logout:
 *   post:
 *     summary: Logout user
 *     description: Logs out an already signed in user by clearing cookies and invalidating the refresh token.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User logged out successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: User logged Out
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 */

router.route("/logout").post(verifyJWT, logoutUser)



/**
 * @openapi
 * /api/v1/users/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     description: Generates a new access and refresh token using an existing refresh token. Token can be sent via cookie or request body.
 *     tags:
 *       - Users
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: Required only if not sent via cookie
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                   properties:
 *                     accessToken:
 *                       type: string
 *                     refreshToken:
 *                       type: string
 *                 message:
 *                   type: string
 *                   example: Access token refreshed
 *       401:
 *         description: Unauthorized - refresh token missing, invalid, expired, or already used
 */
router.route("/refresh-token").post(refreshAccessToken)


/**
 * @openapi
 * /api/v1/users/change-password:
 *   post:
 *     summary: Change password
 *     description: Logged in users can change their password using their old password.
 *     tags:
 *       - Users
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - oldPassword
 *               - newPassword
 *             properties:
 *               oldPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                 message:
 *                   type: string
 *                   example: password changed successfully
 *       400:
 *         description: Invalid old password
 *       401:
 *         description: Unauthorized - JWT token missing or invalid
 */
router.route("/change-password").post(verifyJWT, changeCurrentPassword)

/**
 * @openapi
 * /api/v1/resource:
 *   get:
 *     summary: Short one-line description
 *     description: Longer optional description
 *     tags:
 *       - ResourceName
 *     security:
 *       - bearerAuth: []        
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 data:
 *                   type: object
 *                  properties:
 *                      id:
 *                          type: integer
 *                 message:
 *                   type: string
 *                   example: "current user Fetched successfully"
 *       401:
 *         description: Unauthorized - JWT tokken missing or invalid
 */
router.route("/current-user").get(verifyJWT, getCurrentUser)

router.route("/update-account").patch(verifyJWT, updateAccountDetails)

router.route("/change-avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar)

router.route("/update_coverImage").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(
    verifyJWT, 
    cacheMiddleware(300, false),
    getUserChannelProfile)

router.route("/history").get(
    verifyJWT, 
    cacheMiddleware(60, true),
    getWatchHistory)

export default router